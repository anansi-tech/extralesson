import type { QuestionKind } from '@/lib/types';
import type { QuestionVisual } from '@/lib/validation/question-visual';

export const QUESTION_REVIEW_PROMPT_VERSION = 'v1';

export interface BlindReviewQuestion {
  question_id: string;
  kind: QuestionKind;
  stem: string;
  options?: string[];
  marks: number;
  visual?: QuestionVisual | null;
}

const REVIEW_INSTRUCTIONS = `Act as an independent CSEC Mathematics assessment reviewer. Evaluate each ORIGINAL practice question blindly for difficulty and exam-paper presentation.

You are not given the author's intended difficulty, profile, archetype, recipe, answer, solution, source fingerprint, or generation model. Infer every judgment from the displayed question only.

Scale definitions:
- difficulty 1: routine single-step; 2: at least two dependent mathematical moves or meaningful interpretation followed by use of the result; 3: at least two concepts and three dependent stages with demanding reasoning.
- profile CK: recall/recognition; AK: carry out a procedure; R: translate, justify, reverse-reason, or integrate dependent reasoning. Choose the dominant demand actually needed to answer.
- exam_fidelity and clarity: 1 poor to 5 excellent.
- visual_legibility and visual_necessity: 1 poor/decorative to 5 excellent/essential; use null when there is no visual.
- readiness pass: could enter human content review unchanged; review: promising but needs editing; reject: materially misleading, ambiguous, malformed, or unlike the expected exam standard.

Renderer facts needed for a fair presentation judgment:
- diagram coordinates use a fixed 0–100 canvas and are not auto-zoomed;
- plot coordinates are auto-scaled with equal x/y unit scale;
- charts auto-scale their values;
- set diagrams use fixed centered set circles.

Use concerns sparingly and consistently. A visual is decorative when the stem repeats its decisive data or it does not materially support solving. A diagram has visual-scale-risk when its content occupies only a small fraction of its fixed canvas.`;

function blindPayload(questions: BlindReviewQuestion[]) {
  return questions.map((question) => ({
    question_id: question.question_id,
    kind: question.kind,
    stem: question.stem,
    options: question.kind === 'mcq' ? question.options : undefined,
    marks: question.marks,
    visual: question.visual ?? null,
  }));
}

export function buildBlindBatchReviewPrompt(questions: BlindReviewQuestion[]): string {
  return `${REVIEW_INSTRUCTIONS}

Questions:
${JSON.stringify(blindPayload(questions))}

Return exactly one evaluation for each question_id, in the same order.`;
}

export function buildBlindSingleReviewPrompt(question: BlindReviewQuestion): string {
  return `${REVIEW_INSTRUCTIONS}

Question:
${JSON.stringify(blindPayload([question])[0])}

Return exactly one evaluation object for this question_id.`;
}
