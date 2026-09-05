import { Attempt, PracticeSession, Question, Topic, Transcription } from '@/lib/db';
import { attemptOutcome, type OutcomeQuestion, type OutcomeRead, type OutcomeRow } from './outcome';

export interface FirstQuestion {
  sessionId: string;
  /** The topic the question sat in. */
  title: string;
  earned: number;
  marks: number;
}

/** The one free question, with its marks from the one fold, for the dashboard's "Your first question". */
export async function loadFirstQuestion(studentId: string): Promise<FirstQuestion | null> {
  const session = await PracticeSession.findOne({ student_id: studentId, mode: 'first' })
    .select('_id')
    .lean<{ _id: unknown } | null>();
  if (!session) return null;
  const attempt = await Attempt.findOne({ session_id: session._id })
    .select('question_id rubric_awarded rubric correct')
    .lean<{ _id: unknown; question_id: unknown; rubric_awarded: string[]; rubric?: OutcomeRow[]; correct: boolean } | null>();
  if (!attempt) return null;
  const question = await Question.findById(attempt.question_id)
    .select('marks profile parts rubric objective_ids')
    .lean<(OutcomeQuestion & { objective_ids: string[] }) | null>();
  if (!question) return null;
  const [reads, topic] = await Promise.all([
    Transcription.find({ attempt_id: attempt._id })
      .select('legible marker_version method_marks')
      .lean<OutcomeRead[]>(),
    Topic.findOne({ 'objectives.id': question.objective_ids[0] }).select('title').lean<{ title: string } | null>(),
  ]);
  const outcome = attemptOutcome(attempt, question, reads);
  return {
    sessionId: String(session._id),
    title: topic?.title ?? '',
    earned: outcome.earned,
    marks: outcome.assessed,
  };
}
