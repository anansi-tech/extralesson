import { answersEquivalentAny } from './equivalence';
import { componentsEquivalent } from './components';
import { checkAnswerFormat, valueLooksRight } from './format';
import type { AnswerFormat, ProfileMarks, RubricItem } from '@/lib/types';

// Round 1 marking (ROUND_1 §6): final-answer equivalence drives accuracy marks
// and CK/AK marks come from simple documented heuristics only — the examiner
// pass is ROUND_2, do not extend this. A correct final answer awards every
// rubric criterion; a wrong one awards nothing, because a method mark needs the
// working and the working is PHOTOGRAPHED (ROUND_2 §4).

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
// the reason is skipped.
export interface SlotInput {
  /** 'a.i' — the part label and the slot label. */
  ref: string;
  answer: string;
  /**
   * One entry per box when the slot was rendered as typed inputs, so marking
   * compares values by POSITION instead of parsing the string back apart.
   */
  values?: string[];
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
        slot.accept,
        slot.answer_format as AnswerFormat | undefined,
        input?.values,
      );
      // ONLY A SLOT THAT CARRIES MARKS VOTES ON THE VERDICT: five auto-marked
      // slots in the bank have no rubric row, so a miss there cost no marks and
      // still failed the attempt. The verdict means what the score means.
      if (slotRubric.length > 0 && !result.correct) allCorrect = false;
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
  accept?: string[],
  answerFormat?: AnswerFormat,
  enteredValues?: string[],
): MarkResult {
  const equivalent =
    enteredValues && enteredValues.length > 0
      ? componentsEquivalent(enteredValues, canonicalAnswer, accept)
      : answersEquivalentAny(studentAnswer, canonicalAnswer, accept);
  // A required form is part of the question: the value earns its marks and the
  // demanded form earns a further one (R1.7 §B4), so a right value in the wrong
  // form keeps every row except those written for the form. A FORM IS CHECKED
  // PER VALUE — a slot holding two angles is never itself one number to one
  // decimal place, so checking the joined line lost the mark every time.
  const checkForm = (): { ok: boolean; feedback?: string } => {
    if (!answerFormat) return { ok: true };
    const values = enteredValues?.length ? enteredValues : [studentAnswer];
    for (const v of values) {
      const check = checkAnswerFormat(v, answerFormat);
      if (!check.ok) return check;
    }
    return { ok: true };
  };

  let format_feedback: string | undefined;
  let correct = equivalent;
  let formOnlyMiss = false;
  // A FORM ONLY COSTS SOMETHING IF A ROW PAYS FOR IT: 129 of the 256 slots
  // declaring a format have no for_format row, and there a missed form took no
  // marks yet set the answer incorrect — "9 out of 9" beside "Not quite".
  const formIsMarked = rubric.some((r) => r.for_format);
  if (equivalent && answerFormat) {
    const check = checkForm();
    if (!check.ok) {
      format_feedback = check.feedback;
      if (formIsMarked) {
        correct = false;
        formOnlyMiss = true;
      }
    }
  } else if (!equivalent && answerFormat && valueLooksRight(studentAnswer, canonicalAnswer)) {
    format_feedback = checkForm().feedback;
  }
  const awarded = rubric.filter((r) => {
    if (formOnlyMiss) return !r.for_format; // the mathematics was right
    return correct;
  });

  const profile_marks: ProfileMarks = { CK: 0, AK: 0, R: 0 };
  for (const r of awarded) profile_marks[r.profile] += r.mark_value;

  return { correct, rubric_awarded: awarded.map((r) => r.code), profile_marks, format_feedback };
}
