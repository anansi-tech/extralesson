import { Attempt, PracticeSession, Transcription } from '@/lib/db';
import { markSplit } from '@/lib/grade/assessable';
import { methodMarksEarned } from '@/lib/grade/method-marks';

// Nothing here is rendered or marked afresh: this is the list of links to the
// read-only view a session already serves at ?q=<index>. Marks are folded
// exactly as lib/study/state.ts folds them — deterministic profile marks plus
// method marks, one row paid once across takes — so a number beside a question
// can never disagree with the number that moved their mastery.

export interface ReviewableQuestion {
  /** Where the read-only view lives: /study/session/{sessionId}?q={index} */
  sessionId: string;
  index: number;
  earned: number;
  marks: number;
  /** True when a photograph of the working added marks to this one. */
  photographed: boolean;
  ts: Date;
  /** So a row can say WHICH question it is once several share a date heading. */
  objectiveIds: string[];
}

/** One day's worth, newest day first. */
export interface ReviewableDay {
  /** YYYY-MM-DD, in the viewer's own reckoning of the day. */
  day: string;
  on: Date;
  questions: ReviewableQuestion[];
  earned: number;
  marks: number;
}

/**
 * Grouped by day, not by session: a session holds one or two questions (30
 * across 29 sessions for the heaviest live account), so a heading per session
 * is a heading per question. Those same students sit at 1 to 5 days.
 */
export function groupReviewableByDay(rows: ReviewableQuestion[]): ReviewableDay[] {
  const byDay = new Map<string, ReviewableQuestion[]>();
  for (const r of rows) {
    const d = new Date(r.ts);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    byDay.set(key, [...(byDay.get(key) ?? []), r]);
  }
  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, questions]) => ({
      day,
      on: new Date(questions[0].ts),
      questions,
      earned: questions.reduce((n, q) => n + q.earned, 0),
      marks: questions.reduce((n, q) => n + q.marks, 0),
    }));
}

/**
 * How far back the list reaches. A smaller cap made a heading saying "9
 * questions" mean nine WITHIN THE WINDOW on a day that held twenty-five; forty
 * covers the heaviest live account, and the query reads the attempts either way.
 */
const DEFAULT_LIMIT = 40;

interface Options {
  /** Restrict to one session — the summary lists only its own questions. */
  sessionId?: string;
  limit?: number;
}

export async function loadReviewable(
  studentId: string,
  { sessionId, limit = DEFAULT_LIMIT }: Options = {},
): Promise<ReviewableQuestion[]> {
  const sessions = await PracticeSession.find(
    sessionId ? { _id: sessionId, student_id: studentId } : { student_id: studentId },
  )
    .sort({ started_at: -1 })
    .select('question_ids started_at')
    .lean<{ _id: unknown; question_ids: unknown[] }[]>();
  if (sessions.length === 0) return [];

  // A question can appear in several sessions and the ATTEMPT names its own, so
  // the row opens the sitting it actually records rather than an inferred one.
  const indexOf = new Map<string, number>();
  for (const s of sessions) {
    s.question_ids.forEach((q, index) => indexOf.set(`${String(s._id)}:${String(q)}`, index));
  }

  const attempts = await Attempt.find({
    student_id: studentId,
    question_id: { $in: [...new Set(sessions.flatMap((s) => s.question_ids.map(String)))] },
  })
    .sort({ ts: -1 })
    .populate('question_id', 'marks parts rubric objective_ids')
    .lean<
      {
        _id: unknown;
        question_id: {
          _id: unknown;
          marks: number;
          parts?: unknown[];
          rubric?: unknown[];
          objective_ids?: string[];
        } | null;
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
    const reads = takes.get(String(a._id)) ?? [];
    const method = methodMarksEarned(reads);
    out.push({
      sessionId: String(a.session_id),
      index,
      earned: a.profile_marks.CK + a.profile_marks.AK + a.profile_marks.R + method,
      // Out of the whole question once a read has marked what the grader could not.
      marks: (reads.length ? a.question_id.marks : markSplit(a.question_id as never).auto) || a.question_id.marks || 1,
      photographed: method > 0,
      ts: a.ts,
      objectiveIds: a.question_id.objective_ids ?? [],
    });
    if (out.length >= limit) break;
  }
  return out;
}
