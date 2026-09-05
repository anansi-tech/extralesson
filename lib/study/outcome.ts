import type { Profile } from '@/lib/types';

/**
 * ONE FOLD FOR EVERY SURFACE (ROUND_6 Task 1). A rubric row on an attempt is
 * awarded, withheld, or unassessed, and the score is earned out of ASSESSED.
 * A row on an answer slot is always assessed: the grader decided it. A row
 * anywhere else is assessed only by a read the marker finished on a legible
 * page. Nothing here reads a database; the callers pass what is stored.
 */
export type RowState = 'awarded' | 'withheld' | 'unassessed';

export interface OutcomeRow {
  code: string;
  profile: Profile;
  mark_value: number;
  slot_ref: string;
}

export interface OutcomeQuestion {
  parts?: { label: string; slots?: { label: string; response_mode?: string }[] }[];
  rubric?: OutcomeRow[];
  /** For a question with no rubric rows: the whole thing is one row. */
  marks?: number;
  profile?: Profile;
}

export interface OutcomeRead {
  legible: boolean;
  /** Set only when the marker finished; a failed marking leaves it unset. */
  marker_version?: string;
  method_marks?: { code: string; awarded: boolean; reason?: string; needs_review?: boolean }[];
}

export interface RowOutcome extends OutcomeRow {
  state: RowState;
  /** The marker's reason, when a read decided this row. */
  reason?: string;
}

export interface AttemptOutcome {
  rows: RowOutcome[];
  earned: number;
  /** Marks on awarded and withheld rows: the denominator. */
  assessed: number;
  unassessed: number;
  unassessedMarks: number;
  byProfile: Record<Profile, number>;
}

const answerSlots = (q: OutcomeQuestion) =>
  new Set(
    (q.parts ?? []).flatMap((p) =>
      (p.slots ?? [])
        .filter((s) => (s.response_mode ?? 'answer') === 'answer')
        .map((s) => `${p.label}.${s.label}`),
    ),
  );

const knownSlots = (q: OutcomeQuestion) =>
  new Set((q.parts ?? []).flatMap((p) => (p.slots ?? []).map((s) => `${p.label}.${s.label}`)));

// An MCQ carries no rubric: its one mark is the answer, and `correct` is the grader's verdict.
const rowsOf = (attempt: { correct?: boolean }, q: OutcomeQuestion): { rows: OutcomeRow[]; graded: Set<string> } => {
  if (q.rubric?.length) return { rows: q.rubric, graded: new Set() };
  const row: OutcomeRow = { code: 'ANSWER', profile: q.profile ?? 'CK', mark_value: q.marks ?? 1, slot_ref: '' };
  return { rows: [row], graded: new Set(attempt.correct ? [row.code] : []) };
};

export function attemptOutcome(
  attempt: { rubric_awarded: string[]; correct?: boolean },
  question: OutcomeQuestion,
  reads: OutcomeRead[] = [],
): AttemptOutcome {
  const whole = rowsOf(attempt, question);
  const graded = new Set([...attempt.rubric_awarded, ...whole.graded]);
  const answer = answerSlots(question);
  const known = knownSlots(question);
  // An illegible read is no read at all: nothing it says, either way, counts.
  const judging = reads.filter((r) => r.marker_version && r.legible);

  const rows: RowOutcome[] = whole.rows.map((row) => {
    const decisions = judging.flatMap((r) => (r.method_marks ?? []).filter((m) => m.code === row.code));
    const awardedByRead = decisions.some((m) => m.awarded);
    const latest = decisions.at(-1);
    // A row whose slot the question no longer names was the grader's: it was
    // stored before rows named slots, and the grader marked the whole part.
    const gradersRow = answer.has(row.slot_ref) || !known.has(row.slot_ref);
    let state: RowState;
    if (graded.has(row.code) || awardedByRead) state = 'awarded';
    else if (gradersRow) state = 'withheld';
    else if (latest && !latest.needs_review) state = 'withheld';
    else state = 'unassessed';
    return { ...row, state, reason: latest?.reason };
  });

  const byProfile: Record<Profile, number> = { CK: 0, AK: 0, R: 0 };
  let earned = 0;
  let assessed = 0;
  let unassessed = 0;
  let unassessedMarks = 0;
  for (const r of rows) {
    if (r.state === 'unassessed') {
      unassessed++;
      unassessedMarks += r.mark_value;
      continue;
    }
    assessed += r.mark_value;
    if (r.state === 'awarded') {
      earned += r.mark_value;
      byProfile[r.profile] += r.mark_value;
    }
  }
  return { rows, earned, assessed, unassessed, unassessedMarks, byProfile };
}
