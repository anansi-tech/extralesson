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

// R1.5 §2: one input per part; per-part equivalence. Rubric rows are awarded
// per part using the same documented heuristics as before, applied within
// each part: a part's R rows require that part's answer to be correct.
export interface PartInput {
  label: string;
  answer: string;
  working: string;
}

export function markStructuredParts(
  rubric: RubricItem[],
  parts: {
    label: string;
    answer: string;
    accept?: string[];
    answer_format?: AnswerFormat;
    response_mode?: string;
  }[],
  inputs: PartInput[],
): MarkResult {
  const inputByLabel = new Map(inputs.map((i) => [i.label, i]));
  const profile_marks: ProfileMarks = { CK: 0, AK: 0, R: 0 };
  const awarded: string[] = [];
  let allCorrect = true;
  let formatFeedback: string | undefined;

  for (const part of parts) {
    // R1.6 §1: a "show that" or "explain" part is self-marked in the session,
    // so it earns nothing here and cannot make the question wrong. Its marks
    // are out of the denominator too (lib/study/state.ts).
    if ((part.response_mode ?? 'answer') !== 'answer') continue;
    const input = inputByLabel.get(part.label);
    const partRubric = rubric.filter((r) => r.part_label === part.label);
    const result = markStructured(
      partRubric.length > 0
        ? partRubric
        : [{ code: 'R0', profile: 'R', criterion: 'answer', mark_value: 0, part_label: part.label }],
      part.answer,
      input?.answer ?? '',
      input?.working ?? '',
      part.accept,
      part.answer_format,
    );
    if (!result.correct) allCorrect = false;
    if (result.format_feedback && !formatFeedback) formatFeedback = result.format_feedback;
    awarded.push(...result.rubric_awarded.filter((c) => c !== 'R0'));
    profile_marks.CK += result.profile_marks.CK;
    profile_marks.AK += result.profile_marks.AK;
    profile_marks.R += result.profile_marks.R;
  }

  return { correct: allCorrect, rubric_awarded: awarded, profile_marks, format_feedback: formatFeedback };
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
  // A required form is part of the question: an equivalent value written the
  // wrong way is not a correct answer, but the student should be told that it
  // was the form and not the mathematics that lost the mark.
  let format_feedback: string | undefined;
  let correct = equivalent;
  if (equivalent && answerFormat) {
    const check = checkAnswerFormat(studentAnswer, answerFormat);
    if (!check.ok) {
      correct = false;
      format_feedback = check.feedback;
    }
  } else if (!equivalent && answerFormat && valueLooksRight(studentAnswer, canonicalAnswer)) {
    format_feedback = checkAnswerFormat(studentAnswer, answerFormat).feedback;
  }
  const trimmed = working.trim();
  const hasWorking = trimmed.length > 0;
  const hasWorkedStep = trimmed.includes('=') || trimmed.split('\n').filter((l) => l.trim()).length >= 2;

  const awarded = rubric.filter((r) => {
    if (correct) return true;
    if (r.profile === 'CK') return hasWorking;
    if (r.profile === 'AK') return hasWorkedStep;
    return false; // R requires a correct final answer
  });

  const profile_marks: ProfileMarks = { CK: 0, AK: 0, R: 0 };
  for (const r of awarded) profile_marks[r.profile] += r.mark_value;

  return { correct, rubric_awarded: awarded.map((r) => r.code), profile_marks, format_feedback };
}
