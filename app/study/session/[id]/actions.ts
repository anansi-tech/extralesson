'use server';

import { z } from 'zod';
import { dbConnect, Attempt, PracticeSession, Question } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { markMcq, markStructured } from '@/lib/grade/mark';
import { answersEquivalent } from '@/lib/grade/equivalence';
import { renderMathHtml } from '@/lib/katex';
import type { ProfileMarks, RubricItem } from '@/lib/types';

const SubmitZ = z.object({
  sessionId: z.string().regex(/^[a-f0-9]{24}$/),
  questionIndex: z.number().int().min(0),
  answer: z.string().min(1).max(2000),
  working: z.string().max(10000).default(''),
  durationMs: z.number().int().min(0).max(60 * 60 * 1000).catch(0),
});

export interface Feedback {
  correct: boolean;
  profile_marks: ProfileMarks;
  rubric_awarded: string[];
  // misconception remediation when the miss matches one, else worked solution
  feedbackTitle: string;
  feedbackHtml: string;
  isMisconception: boolean;
}

export async function submitAnswer(input: {
  sessionId: string;
  questionIndex: number;
  answer: string;
  working?: string;
  durationMs?: number;
}): Promise<Feedback | { error: string }> {
  const auth = await requireSession();
  const parsed = SubmitZ.safeParse({ working: '', durationMs: 0, ...input });
  if (!parsed.success) return { error: 'Invalid submission.' };
  const { sessionId, questionIndex, answer, working, durationMs } = parsed.data;

  await dbConnect();
  const session = await PracticeSession.findOne({
    _id: sessionId,
    student_id: auth.student_id,
  }).lean<{ question_ids: unknown[] } | null>();
  if (!session) return { error: 'Session not found.' };

  // One attempt per question, in order: the next unanswered index must match.
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
    rubric?: RubricItem[];
    final_answer?: string;
    worked_solution: string;
    misconceptions: { trigger: string; name: string; remediation: string }[];
  } | null>();
  if (!question) return { error: 'Question not found.' };

  let result;
  let storedAnswer: string | number = answer;
  if (question.kind === 'mcq') {
    const idx = Number(answer);
    storedAnswer = idx;
    result = markMcq(question.profile!, question.marks, idx, question.answer_key!);
  } else {
    result = markStructured(question.rubric ?? [], question.final_answer ?? '', answer, working);
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

  // Miss -> matching misconception remediation, else worked solution (§6.4).
  let feedbackTitle = 'Worked solution';
  let feedbackHtml = renderMathHtml(question.worked_solution);
  let isMisconception = false;
  if (!result.correct) {
    const studentAnswerText =
      question.kind === 'mcq' ? (question.options?.[Number(answer)] ?? String(answer)) : answer;
    const match = question.misconceptions.find((m) =>
      answersEquivalent(m.trigger, studentAnswerText),
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
    feedbackTitle,
    feedbackHtml,
    isMisconception,
  };
}
