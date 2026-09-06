import { Attempt, PracticeSession, Question, Transcription } from '@/lib/db';
import { attemptOutcome, type OutcomeQuestion, type OutcomeRead, type OutcomeRow } from './outcome';
import { attributeBySlot } from './state';

/**
 * WHAT A SESSION SUMMARY MAY CLAIM (ROUND_9 Task 6): every line here is a
 * fold over stored attempts — the marks per objective in a session, the
 * same marks in the last earlier session on the same topic, and the topic
 * strengths before and after. Nothing is invented.
 */
export type Marks = { earned: number; assessed: number };

type FoldQuestion = OutcomeQuestion & { _id: unknown; objective_ids: string[]; parts?: { label: string; slots?: { label: string; objective_id?: string; response_mode?: string }[] }[] };

/** Earned and assessed marks in one session, by objective. */
export async function marksByObjective(sessionId: unknown): Promise<Map<string, Marks>> {
  const attempts = await Attempt.find({ session_id: sessionId })
    .select('question_id rubric_awarded rubric correct')
    .lean<{ _id: unknown; question_id: unknown; rubric_awarded: string[]; rubric?: OutcomeRow[]; correct: boolean }[]>();
  if (attempts.length === 0) return new Map();
  const questions = await Question.find({ _id: { $in: attempts.map((a) => a.question_id) } })
    .select('objective_ids marks profile parts rubric')
    .lean<FoldQuestion[]>();
  const questionBy = new Map(questions.map((q) => [String(q._id), q]));
  const reads = await Transcription.find({ attempt_id: { $in: attempts.map((a) => a._id) } })
    .select('attempt_id legible marker_version method_marks')
    .lean<(OutcomeRead & { attempt_id: unknown })[]>();
  const out = new Map<string, Marks>();
  for (const a of attempts) {
    const q = questionBy.get(String(a.question_id));
    if (!q) continue;
    const outcome = attemptOutcome(a, q, reads.filter((r) => String(r.attempt_id) === String(a._id)));
    for (const [objective, m] of attributeBySlot(outcome, q)) {
      const row = out.get(objective) ?? { earned: 0, assessed: 0 };
      row.earned += m.earned;
      row.assessed += m.assessed;
      out.set(objective, row);
    }
  }
  return out;
}

export const prefixOf = (objectiveId: string) => objectiveId.slice(0, objectiveId.lastIndexOf('.') + 1);

/** The marks on one topic, summed over its objectives. */
export function marksOnTopic(byObjective: Map<string, Marks>, prefix: string): Marks {
  let earned = 0;
  let assessed = 0;
  for (const [objective, m] of byObjective) {
    if (!objective.startsWith(prefix)) continue;
    earned += m.earned;
    assessed += m.assessed;
  }
  return { earned, assessed };
}

/** The topic a session was mostly about: the prefix carrying the most assessed marks. */
export function mainTopic(byObjective: Map<string, Marks>): string | null {
  const totals = new Map<string, number>();
  for (const [objective, m] of byObjective) {
    const p = prefixOf(objective);
    totals.set(p, (totals.get(p) ?? 0) + m.assessed);
  }
  let best: string | null = null;
  for (const [p, n] of totals) if (best === null || n > (totals.get(best) ?? 0)) best = p;
  return best;
}

export interface Trend {
  earned: number;
  assessed: number;
  daysAgo: number;
}

/**
 * The last earlier session that assessed the same topic, and what it earned
 * there. A session that never touched the topic is not a comparison.
 */
export async function trendOnTopic(studentId: string, sessionId: unknown, prefix: string, startedAt: Date, now = new Date()): Promise<Trend | null> {
  const earlier = await PracticeSession.find({
    student_id: studentId,
    _id: { $ne: sessionId },
    completed_at: { $ne: null },
    started_at: { $lt: startedAt },
    mode: { $in: ['adaptive', 'topic', 'revisit'] },
  })
    .sort({ started_at: -1 })
    .limit(12)
    .select('_id completed_at')
    .lean<{ _id: unknown; completed_at: Date }[]>();
  for (const s of earlier) {
    const marks = marksOnTopic(await marksByObjective(s._id), prefix);
    if (marks.assessed > 0) {
      return { ...marks, daysAgo: Math.round((now.getTime() - s.completed_at.getTime()) / 86_400_000) };
    }
  }
  return null;
}

const daysAgo = (n: number) => (n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`);

/** The claim under the marks: which way the same topic went, in the fold's words. */
export function trendLine(now: Marks, then: Trend | null): string | null {
  if (!then) return null;
  const a = now.assessed ? now.earned / now.assessed : 0;
  const b = then.assessed ? then.earned / then.assessed : 0;
  const which = a > b ? 'Up from' : a < b ? 'Down from' : 'The same as';
  return `${which} ${then.earned} of ${then.assessed} on the same topic ${daysAgo(then.daysAgo)}.`;
}

/** The one line of what moved: the topic strength that moved most, before and after. */
export function movedLine(deltas: { title: string; from: number; to: number }[]): string | null {
  const moved = deltas
    .map((d) => ({ ...d, diff: Math.round(d.to * 100) - Math.round(d.from * 100) }))
    .filter((d) => d.diff !== 0)
    .sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff))[0];
  if (!moved) return null;
  return `${moved.title}: ${Math.round(moved.from * 100)}% → ${Math.round(moved.to * 100)}% topic strength.`;
}
