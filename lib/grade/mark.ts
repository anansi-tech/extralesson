import { answersEquivalentAny } from './equivalence';
import { componentsEquivalent } from './components';
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
  /**
   * One entry per box, when the slot was rendered as a typed input. Present
   * means the student never typed a delimiter, so marking compares values by
   * POSITION instead of parsing the string back apart.
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
        input?.working ?? '',
        slot.accept,
        slot.answer_format as AnswerFormat | undefined,
        input?.values,
        markableSlots(parts).length === 1,
      );
      // ONLY A SLOT THAT CARRIES MARKS VOTES ON THE VERDICT.
      //
      // A self-marked slot is already skipped above. Five auto-marked slots in
      // the bank carry no rubric row at all: nothing is on offer for them, so a
      // miss there cost no marks and still failed the whole attempt, which is
      // the same disagreement from the other side. The verdict now means
      // exactly what the score means — every mark on offer was earned.
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
  working: string,
  accept?: string[],
  answerFormat?: AnswerFormat,
  enteredValues?: string[],
  /**
   * Whether the working box can be attributed to THIS slot.
   *
   * Working is one box for the whole question, and 424 of the 427 structured
   * questions ask for more than one answer. Crediting every slot from it meant
   * a single "=" anywhere awarded the method marks on slots the student got
   * wrong and never worked — a student scored 11 out of 11 on a question where
   * they had mixed metres with centimetres and mis-read a bound. A quarter of
   * AK rows say CAO, "correct answer only", so awarding those without the
   * answer contradicts the criterion the student is shown.
   *
   * So the heuristic applies only where the box belongs to the slot: a question
   * with exactly one marked slot. Everywhere else a method mark needs the
   * answer. Attributing working per slot properly is the real fix and is a
   * bigger change than this one.
   */
  workingAttributable = false,
): MarkResult {
  const equivalent =
    enteredValues && enteredValues.length > 0
      ? componentsEquivalent(enteredValues, canonicalAnswer, accept)
      : answersEquivalentAny(studentAnswer, canonicalAnswer, accept);
  // A required form is part of the question, and the official scheme marks it
  // as its own act: the value earns its marks, and expressing it in the demanded
  // form earns a further one (R1.7 §B4). So a right value in the wrong form
  // keeps everything except the rows written for the form.
  // A FORM IS CHECKED PER VALUE, not on the line they were joined into.
  //
  // "Calculate both angles, each correct to 1 decimal place" is one slot
  // holding two values. Running the check over the composed "73.7°, 53.1°"
  // asks whether that STRING is one number to one decimal place, which it
  // never is — so the format mark was lost on every multi-value slot that
  // demanded a form, however carefully the student had rounded.
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
  // A FORM ONLY COSTS SOMETHING IF A ROW PAYS FOR IT.
  //
  // R1.7 §B4 gives the form its own mark, and 129 of the 256 slots declaring a
  // format have no row marked for_format. On those, missing the form took no
  // marks — every row was still awarded — and yet set the answer incorrect, so
  // the card read "9 out of 9" beside "Not quite". Where nothing is on offer
  // for the form, saying so is feedback, not a verdict.
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
  const trimmed = working.trim();
  const hasWorking = trimmed.length > 0;
  const hasWorkedStep = trimmed.includes('=') || trimmed.split('\n').filter((l) => l.trim()).length >= 2;

  const awarded = rubric.filter((r) => {
    if (formOnlyMiss) return !r.for_format; // the mathematics was right
    if (correct) return true;
    if (!workingAttributable) return false; // cannot tell whose working this is
    if (r.profile === 'CK') return hasWorking;
    if (r.profile === 'AK') return hasWorkedStep;
    return false; // R requires a correct final answer
  });

  const profile_marks: ProfileMarks = { CK: 0, AK: 0, R: 0 };
  for (const r of awarded) profile_marks[r.profile] += r.mark_value;

  return { correct, rubric_awarded: awarded.map((r) => r.code), profile_marks, format_feedback };
}
