import { Attempt, PracticeSession, Transcription } from '@/lib/db';
import { attemptOutcome, type OutcomeQuestion, type OutcomeRead, type OutcomeRow } from './outcome';

// Nothing here is rendered or marked afresh: this is the list of links to the
// read-only view a session already serves at ?q=<index>. The numbers are the
// one fold's (lib/study/outcome.ts), so a number beside a question can never
// disagree with the number that moved their mastery.

export interface ReviewableQuestion {
  /** Where the read-only view lives: /study/session/{sessionId}?q={index} */
  sessionId: string;
  index: number;
  earned: number;
  /** Marks assessed: the denominator. */
  marks: number;
  /** Marks no one could assess yet. */
  unassessed: number;
  /** True when a photograph of the working was read for this one. */
  photographed: boolean;
  ts: Date;
  /** So a row can say WHICH question it is once several share a date heading. */
  objectiveIds: string[];
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
    .populate('question_id', 'marks profile parts rubric objective_ids')
    .lean<
      {
        _id: unknown;
        question_id: (OutcomeQuestion & { _id: unknown; objective_ids?: string[] }) | null;
        session_id: unknown;
        rubric_awarded: string[];
        rubric?: OutcomeRow[];
        correct: boolean;
        ts: Date;
      }[]
    >();

  const reads = await Transcription.find({ attempt_id: { $in: attempts.map((a) => a._id) } })
    .select('attempt_id legible marker_version method_marks')
    .lean<(OutcomeRead & { attempt_id: unknown })[]>();
  const takes = new Map<string, OutcomeRead[]>();
  for (const r of reads) takes.set(String(r.attempt_id), [...(takes.get(String(r.attempt_id)) ?? []), r]);

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
    const mine = takes.get(String(a._id)) ?? [];
    const outcome = attemptOutcome(a, a.question_id, mine);
    out.push({
      sessionId: String(a.session_id),
      index,
      earned: outcome.earned,
      marks: outcome.assessed,
      unassessed: outcome.unassessedMarks,
      photographed: mine.length > 0,
      ts: a.ts,
      objectiveIds: a.question_id.objective_ids ?? [],
    });
    if (out.length >= limit) break;
  }
  return out;
}
