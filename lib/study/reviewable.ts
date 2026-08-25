import { Attempt, PracticeSession, Transcription } from '@/lib/db';
import { markSplit } from '@/lib/grade/assessable';
import { methodMarksEarned } from '@/lib/grade/method-marks';

// LOOKING BACK AT A QUESTION ALREADY ANSWERED.
//
// Nothing new is rendered and nothing new is marked: a session page already
// serves any answered question read-only at ?q=<index>, which is what a student
// gets when they page back inside a live session. Once the session finished,
// nothing linked to it. This is the list of links.
//
// Marks are folded exactly as lib/study/state.ts folds them — deterministic
// profile marks plus method marks, one row paid once across takes — so the
// number beside a question here can never disagree with the number that moved
// their mastery.

export interface ReviewableQuestion {
  /** Where the read-only view lives: /study/session/{sessionId}?q={index} */
  sessionId: string;
  index: number;
  earned: number;
  marks: number;
  /** True when a photograph of the working added marks to this one. */
  photographed: boolean;
  ts: Date;
}

interface Options {
  /** Restrict to one session — the summary lists only its own questions. */
  sessionId?: string;
  limit?: number;
}

export async function loadReviewable(
  studentId: string,
  { sessionId, limit = 12 }: Options = {},
): Promise<ReviewableQuestion[]> {
  const sessions = await PracticeSession.find(
    sessionId ? { _id: sessionId, student_id: studentId } : { student_id: studentId },
  )
    .sort({ started_at: -1 })
    .select('question_ids started_at')
    .lean<{ _id: unknown; question_ids: unknown[] }[]>();
  if (sessions.length === 0) return [];

  // Where each question sits in each session. The ATTEMPT names its own
  // session, so there is nothing to infer: a question can appear in several
  // sessions, and the row must open the sitting it actually records.
  const indexOf = new Map<string, number>();
  for (const s of sessions) {
    s.question_ids.forEach((q, index) => indexOf.set(`${String(s._id)}:${String(q)}`, index));
  }

  const attempts = await Attempt.find({
    student_id: studentId,
    question_id: { $in: [...new Set(sessions.flatMap((s) => s.question_ids.map(String)))] },
  })
    .sort({ ts: -1 })
    .populate('question_id', 'marks parts rubric')
    .lean<
      {
        _id: unknown;
        question_id: { _id: unknown; marks: number; parts?: unknown[]; rubric?: unknown[] } | null;
        session_id: unknown;
        profile_marks: { CK: number; AK: number; R: number };
        ts: Date;
      }[]
    >();

  const reads = await Transcription.find({ attempt_id: { $in: attempts.map((a) => a._id) } })
    .select('attempt_id method_marks')
    .lean<{ attempt_id: unknown; method_marks?: { code: string; awarded: boolean; mark_value: number }[] }[]>();
  const takes = new Map<string, typeof reads>();
  for (const r of reads) {
    const key = String(r.attempt_id);
    takes.set(key, [...(takes.get(key) ?? []), r]);
  }

  const out: ReviewableQuestion[] = [];
  const seen = new Set<string>();
  for (const a of attempts) {
    if (!a.question_id) continue;
    const index = indexOf.get(`${String(a.session_id)}:${String(a.question_id._id)}`);
    if (index === undefined) continue;
    // One row per question: the most recent attempt is the one to look back at,
    // and attempts are sorted newest first.
    const key = String(a.question_id._id);
    if (seen.has(key)) continue;
    seen.add(key);
    const method = methodMarksEarned(takes.get(String(a._id)) ?? []);
    out.push({
      sessionId: String(a.session_id),
      index,
      earned: a.profile_marks.CK + a.profile_marks.AK + a.profile_marks.R + method,
      marks: markSplit(a.question_id as never).auto || a.question_id.marks || 1,
      photographed: method > 0,
      ts: a.ts,
    });
    if (out.length >= limit) break;
  }
  return out;
}
