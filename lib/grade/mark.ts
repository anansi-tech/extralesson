import { answersEquivalentAny } from './equivalence';
import { checkAnswerFormat, valueLooksRight } from './format';
import type { AnswerFormat, ProfileMarks, RubricItem } from '@/lib/types';

// Round 1 marking (ROUND_1 §6.3): the final-answer equivalence check drives
// accuracy marks; method-ish CK/AK marks come from SIMPLE, DOCUMENTED
// heuristics only. Full examiner (LLM) marking is Round 2 — do not extend.
//
// Heuristics for structured questions:
// - Correct final answer            -> every rubric criterion is awarded.
// - Wrong answer, working shown     -> CK criteria awarded (the student
//   engaged the concept); AK criteria awarded only when the working contains
//   at least one worked step (an '=' sign or 2+ lines).
// - R criteria are never awarded without a correct final answer.

export interface MarkResult {
  correct: boolean;
  rubric_awarded: string[];
  profile_marks: ProfileMarks;
  /** Set when the value was right but the required FORM was not (R1.6 §2). */
  format_feedback?: string;
}

export function markMcq(profile: 'CK' | 'AK' | 'R', marks: number, answerIndex: number, answerKey: number): MarkResult {
  const correct = answerIndex === answerKey;
  const profile_marks: ProfileMarks = { CK: 0, AK: 0, R: 0 };
  if (correct) profile_marks[profile] = marks;
  return { correct, rubric_awarded: [], profile_marks };
}

// R1.8 Part 1: the unit of marking is the SLOT. One input per slot, addressed
// as 'part.slot'; rubric rows are earned by the slot named in slot_ref. A part
// may mix an auto-marked value with a reason the student self-marks, and only
// the reason is skipped — under R1.6 an explain sub-part exiled its whole part.
export interface SlotInput {
  /** 'a.i' — the part label and the slot label. */
  ref: string;
  answer: string;
  working: string;
}

export interface MarkableSlot {
  label: string;
  answer: string;
  accept?: string[];
  // Widened to string because 'sf:N' / 'dp:N' carry a precision and infer as
  // string at the Zod boundary, which has already validated the shape.
  answer_format?: string;
  response_mode?: string;
}

export function markStructuredParts(
  rubric: RubricItem[],
  parts: { label: string; slots: MarkableSlot[] }[],
  inputs: SlotInput[],
): MarkResult {
  const inputByRef = new Map(inputs.map((i) => [i.ref, i]));
  const profile_marks: ProfileMarks = { CK: 0, AK: 0, R: 0 };
  const awarded: string[] = [];
  let allCorrect = true;
  let formatFeedback: string | undefined;

  for (const part of parts) {
    for (const slot of part.slots) {
      const ref = `${part.label}.${slot.label}`;
      // Self-marked work earns nothing here, costs nothing, and is out of the
      // denominator too (lib/study/state.ts).
      if ((slot.response_mode ?? 'answer') !== 'answer') continue;
      const input = inputByRef.get(ref);
      const slotRubric = rubric.filter((r) => r.slot_ref === ref);
      const result = markStructured(
        slotRubric.length > 0
          ? slotRubric
          : [{ code: 'R0', profile: 'R', criterion: 'answer', mark_value: 0, slot_ref: ref, part_label: part.label }],
        slot.answer,
        input?.answer ?? '',
        input?.working ?? '',
        slot.accept,
        slot.answer_format as AnswerFormat | undefined,
      );
      if (!result.correct) allCorrect = false;
      if (result.format_feedback && !formatFeedback) formatFeedback = result.format_feedback;
      awarded.push(...result.rubric_awarded.filter((c) => c !== 'R0'));
      profile_marks.CK += result.profile_marks.CK;
      profile_marks.AK += result.profile_marks.AK;
      profile_marks.R += result.profile_marks.R;
    }
  }

  return { correct: allCorrect, rubric_awarded: awarded, profile_marks, format_feedback: formatFeedback };
}

/** The slots a student is asked to type an answer into. */
export function markableSlots(
  parts: { label: string; slots: { label: string; response_mode?: string }[] }[],
): string[] {
  return parts.flatMap((p) =>
    p.slots.filter((s) => (s.response_mode ?? 'answer') === 'answer').map((s) => `${p.label}.${s.label}`),
  );
}

export function markStructured(
  rubric: RubricItem[],
  canonicalAnswer: string,
  studentAnswer: string,
  working: string,
  accept?: string[],
  answerFormat?: AnswerFormat,
): MarkResult {
  const equivalent = answersEquivalentAny(studentAnswer, canonicalAnswer, accept);
  // A required form is part of the question, and the official scheme marks it
  // as its own act: the value earns its marks, and expressing it in the demanded
  // form earns a further one (R1.7 §B4). So a right value in the wrong form
  // keeps everything except the rows written for the form.
  let format_feedback: string | undefined;
  let correct = equivalent;
  let formOnlyMiss = false;
  if (equivalent && answerFormat) {
    const check = checkAnswerFormat(studentAnswer, answerFormat);
    if (!check.ok) {
      correct = false;
      formOnlyMiss = true;
      format_feedback = check.feedback;
    }
  } else if (!equivalent && answerFormat && valueLooksRight(studentAnswer, canonicalAnswer)) {
    format_feedback = checkAnswerFormat(studentAnswer, answerFormat).feedback;
  }
  const trimmed = working.trim();
  const hasWorking = trimmed.length > 0;
  const hasWorkedStep = trimmed.includes('=') || trimmed.split('\n').filter((l) => l.trim()).length >= 2;

  const awarded = rubric.filter((r) => {
    if (formOnlyMiss) return !r.for_format; // the mathematics was right
    if (correct) return true;
    if (r.profile === 'CK') return hasWorking;
    if (r.profile === 'AK') return hasWorkedStep;
    return false; // R requires a correct final answer
  });

  const profile_marks: ProfileMarks = { CK: 0, AK: 0, R: 0 };
  for (const r of awarded) profile_marks[r.profile] += r.mark_value;

  return { correct, rubric_awarded: awarded.map((r) => r.code), profile_marks, format_feedback };
}
