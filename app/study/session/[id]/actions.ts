'use server';

import { z } from 'zod';
import { dbConnect, Attempt, PracticeSession, Question } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { markMcq, markStructuredParts } from '@/lib/grade/mark';
import { answersEquivalentAny } from '@/lib/grade/equivalence';
import { renderMathHtml } from '@/lib/katex';
import type { ProfileMarks, QuestionPart, RubricItem } from '@/lib/types';

const SubmitZ = z.object({
  sessionId: z.string().regex(/^[a-f0-9]{24}$/),
  questionIndex: z.number().int().min(0),
  // mcq: single entry with label 'a' whose answer is the option index.
  answers: z.array(z.object({ label: z.string().regex(/^[a-f]$/), answer: z.string().min(1).max(2000) })).min(1).max(6),
  working: z.string().max(10000).default(''),
  durationMs: z.number().int().min(0).max(60 * 60 * 1000).catch(0),
});

export interface Feedback {
  correct: boolean;
  profile_marks: ProfileMarks;
  rubric_awarded: string[];
  partResults: { label: string; correct: boolean }[];
  feedbackTitle: string;
  feedbackHtml: string;
  isMisconception: boolean;
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
    const parts = (question.parts ?? []).map((p) => ({
      label: p.label,
      answer: p.answer,
      accept: p.accept,
    }));
    const inputs = answers.map((a) => ({ ...a, working }));
    result = markStructuredParts(question.rubric ?? [], parts, inputs);
    const inputByLabel = new Map(answers.map((a) => [a.label, a.answer]));
    partResults = parts.map((p) => ({
      label: p.label,
      correct: answersEquivalentAny(inputByLabel.get(p.label) ?? '', p.answer, p.accept),
    }));
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
  let feedbackTitle = 'Worked solution';
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
      feedbackTitle = match.name;
      feedbackHtml = renderMathHtml(match.remediation);
      isMisconception = true;
    }
  }

  return {
    correct: result.correct,
    profile_marks: result.profile_marks,
    rubric_awarded: result.rubric_awarded,
    partResults,
    feedbackTitle,
    feedbackHtml,
    isMisconception,
  };
}
