'use server';

import { z } from 'zod';
import { dbConnect, Attempt, PracticeSession, Question } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { markMcq, markStructuredParts } from '@/lib/grade/mark';
import { answersEquivalentAny } from '@/lib/grade/equivalence';
import { renderMathHtml } from '@/lib/katex';
import type { ProfileMarks, QuestionPart, RubricItem, TemplateName } from '@/lib/types';
import { SLOT_REF_RE } from '@/lib/notation';
import { renderVisual } from '@/lib/visuals';
import { constructFamily } from '@/lib/targets/construct';

const SubmitZ = z.object({
  sessionId: z.string().regex(/^[a-f0-9]{24}$/),
  questionIndex: z.number().int().min(0),
  // mcq: single entry with label 'a' whose answer is the option index.
  // a-j and up to 10: the part cap rose from 6 in R1.6 §5 and this schema did
  // not follow, so a 7-part question could not be submitted at all.
  // R1.8: answers are addressed by slot — 'a.i', 'b.r5.S' — up to 8 slots
  // across 10 lettered parts.
  answers: z
    .array(
      z.object({
        label: z.string().regex(SLOT_REF_RE),
        // Empty is a legitimate answer: a candidate leaves a blank and hands
        // the paper in, and a blank is marked wrong. Requiring a character here
        // would reject the whole submission over one unanswered slot (§2).
        answer: z.string().max(2000),
      }),
    )
    .min(1)
    .max(40),
  working: z.string().max(10000).default(''),
  durationMs: z.number().int().min(0).max(60 * 60 * 1000).catch(0),
});

export interface Feedback {
  correct: boolean;
  profile_marks: ProfileMarks;
  rubric_awarded: string[];
  partResults: { label: string; correct: boolean }[];
  feedbackTitleHtml: string;
  feedbackHtml: string;
  isMisconception: boolean;
  /** Right value, wrong required form (R1.6 §2). */
  formatFeedback?: string;
  /**
   * The figure, for a construct question only. It is the ANSWER to part (a) —
   * showing it beside the question would hand the student every read the later
   * parts ask for — so it travels back with the marking, as the answers do,
   * and is not in the page the student is answering on.
   */
  construction?: { figureHtml: string; acts: string[] };
}

export async function submitAnswer(input: {
  sessionId: string;
  questionIndex: number;
  answers: { label: string; answer: string }[];
  working?: string;
  durationMs?: number;
}): Promise<Feedback | { error: string }> {
  const auth = await requireSession();
  const parsed = SubmitZ.safeParse({ working: '', durationMs: 0, ...input });
  if (!parsed.success) return { error: 'Invalid submission.' };
  const { sessionId, questionIndex, answers, working, durationMs } = parsed.data;

  await dbConnect();
  const session = await PracticeSession.findOne({
    _id: sessionId,
    student_id: auth.student_id,
  }).lean<{ question_ids: unknown[] } | null>();
  if (!session) return { error: 'Session not found.' };

  const attemptCount = await Attempt.countDocuments({ session_id: sessionId });
  if (questionIndex !== attemptCount || questionIndex >= session.question_ids.length) {
    return { error: 'Out of sequence — reload the page.' };
  }

  const question = await Question.findById(session.question_ids[questionIndex]).lean<{
    kind: 'mcq' | 'structured';
    options?: string[];
    answer_key?: number;
    profile?: 'CK' | 'AK' | 'R';
    marks: number;
    parts?: QuestionPart[];
    rubric?: RubricItem[];
    stimulus?: string;
    stem: string;
    visual?: { template: TemplateName; params: Record<string, unknown> };
    worked_solution: string;
    misconceptions: { trigger: string; name: string; remediation: string }[];
  } | null>();
  if (!question) return { error: 'Question not found.' };

  let result;
  let partResults: { label: string; correct: boolean }[];
  let storedAnswer: string | number;
  if (question.kind === 'mcq') {
    const idx = Number(answers[0]?.answer);
    storedAnswer = idx;
    result = markMcq(question.profile!, question.marks, idx, question.answer_key!);
    partResults = [{ label: 'a', correct: result.correct }];
  } else {
    const parts = question.parts ?? [];
    const inputs = answers.map((a) => ({ ref: a.label, answer: a.answer, working }));
    result = markStructuredParts(question.rubric ?? [], parts, inputs);
    const inputByRef = new Map(answers.map((a) => [a.label, a.answer]));
    partResults = parts.flatMap((p) =>
      p.slots
        .filter((slot) => (slot.response_mode ?? 'answer') === 'answer')
        .map((slot) => ({
          label: `${p.label}.${slot.label}`,
          correct: answersEquivalentAny(
            inputByRef.get(`${p.label}.${slot.label}`) ?? '',
            slot.answer,
            slot.accept,
          ),
        })),
    );
    storedAnswer = answers.map((a) => `(${a.label}) ${a.answer}`).join('; ');
  }

  // Append-only: attempts are never mutated (§3.5).
  await Attempt.create({
    student_id: auth.student_id,
    question_id: session.question_ids[questionIndex],
    session_id: sessionId,
    answer: storedAnswer,
    rubric_awarded: result.rubric_awarded,
    profile_marks: result.profile_marks,
    correct: result.correct,
    duration_ms: durationMs,
    ts: new Date(),
  });

  // Miss -> matching misconception remediation, else worked solution.
  let feedbackTitleHtml = 'Worked solution';
  let feedbackHtml = renderMathHtml(question.worked_solution);
  let isMisconception = false;
  if (!result.correct) {
    const wrongAnswers =
      question.kind === 'mcq'
        ? [question.options?.[Number(answers[0]?.answer)] ?? String(answers[0]?.answer)]
        : partResults.filter((p) => !p.correct).map((p) => answers.find((a) => a.label === p.label)?.answer ?? '');
    const match = question.misconceptions.find((m) =>
      wrongAnswers.some((w) => answersEquivalentAny(w, m.trigger)),
    );
    if (match) {
      feedbackTitleHtml = renderMathHtml(match.name);
      feedbackHtml = renderMathHtml(match.remediation);
      isMisconception = true;
    }
  }

  // The construction, released now that the reads are committed. The acts are
  // the family's, not the question's: they are what an examiner credits for
  // that kind of drawing, which does not vary question to question.
  let construction: Feedback['construction'];
  const family = constructFamily(question.visual?.template);
  if (
    family &&
    (question.parts ?? []).some((p) => p.slots?.some((sl) => sl.response_mode === 'construct'))
  ) {
    try {
      construction = {
        figureHtml: renderVisual(question.visual as never, {
          stimulus: question.stimulus,
          stem: question.stem,
          partPrompts: (question.parts ?? []).flatMap((p) => [
            p.prompt,
            ...(p.slots ?? []).map((sl) => sl.prompt ?? ''),
          ]),
        }),
        acts: family.acts,
      };
    } catch {
      construction = undefined;
    }
  }

  return {
    correct: result.correct,
    profile_marks: result.profile_marks,
    rubric_awarded: result.rubric_awarded,
    partResults,
    feedbackTitleHtml,
    feedbackHtml,
    isMisconception,
    formatFeedback: 'format_feedback' in result ? result.format_feedback : undefined,
    construction,
  };
}
