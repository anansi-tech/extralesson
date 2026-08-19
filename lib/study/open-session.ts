import { Attempt, PracticeSession, Question } from '@/lib/db';

// A session the student started and has not finished. Coming back to the
// landing page used to offer only "start today's session", which either
// abandoned the half-finished one or built a second — and told them nothing
// about what was left of it.
//
// What is left is reported in MARKS as well as questions. A session is a budget
// of work priced at exam pace, so "1 of 2 done" understates a session whose
// remaining question is worth 12 marks.
export interface OpenSession {
  id: string;
  questions: number;
  answered: number;
  marksLeft: number;
}

export async function openSession(studentId: string): Promise<OpenSession | null> {
  const session = await PracticeSession.findOne({ student_id: studentId, completed_at: null })
    .sort({ started_at: -1 })
    .lean<{ _id: unknown; question_ids: unknown[] } | null>();
  if (!session) return null;

  const answered = await Attempt.countDocuments({ session_id: session._id });
  if (answered >= session.question_ids.length) return null;

  const remaining = session.question_ids.slice(answered);
  const questions = await Question.find({ _id: { $in: remaining } })
    .select('marks')
    .lean<{ marks: number }[]>();
  return {
    id: String(session._id),
    questions: session.question_ids.length,
    answered,
    marksLeft: questions.reduce((sum, q) => sum + q.marks, 0),
  };
}
