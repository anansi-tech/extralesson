import { Attempt, Question } from '@/lib/db';

/**
 * WHAT THE STUDENT ACTUALLY GOT WRONG, per objective, folded out of attempts.
 * NOT SPACED REPETITION, which the kill list bans: no interval, ease factor,
 * due date or queue. The STUDENT asks for a revisit; this only chooses.
 */

/**
 * A question answered wrong an hour ago is not a memory test, it is the same
 * sitting. Three days is long enough that recalling the answer is no longer the
 * easy path, and short enough to be reachable in a week of study.
 */
export const REVISIT_DELAY_DAYS = 3;

export interface Mistakes {
  /** Marks lost per objective, only counting attempts past the delay. */
  lostByObjective: Map<string, number>;
  /** Questions already attempted — a revisit sets a NEW one on the objective. */
  attemptedIds: Set<string>;
  /** Attempts that are still inside the delay, so the UI can say "not yet". */
  waiting: number;
}

export async function loadMistakes(studentId: string, now = new Date()): Promise<Mistakes> {
  const attempts = await Attempt.find({ student_id: studentId })
    .sort({ ts: 1 })
    .lean<{ question_id: unknown; rubric_awarded: string[]; ts: Date }[]>();

  const cutoff = new Date(now.getTime() - REVISIT_DELAY_DAYS * 24 * 60 * 60 * 1000);
  const attemptedIds = new Set<string>();
  const lost = new Map<string, number>();
  let waiting = 0;

  for (const a of attempts) {
    attemptedIds.add(String(a.question_id));
    if (a.ts >= cutoff) {
      waiting++;
      continue;
    }
    const q = await Question.findById(a.question_id)
      .select('parts rubric')
      .lean<{
        parts?: { label: string; slots?: { label: string; objective_id?: string; response_mode?: string }[] }[];
        rubric?: { code: string; slot_ref: string; mark_value: number }[];
      } | null>();
    if (!q) continue;

    const objectiveOf = new Map<string, string>();
    for (const p of q.parts ?? []) {
      for (const slot of p.slots ?? []) {
        // Self-marked work is not marked here, so it cannot be "lost" here.
        if ((slot.response_mode ?? 'answer') !== 'answer') continue;
        if (slot.objective_id) objectiveOf.set(`${p.label}.${slot.label}`, slot.objective_id);
      }
    }

    const awarded = new Set(a.rubric_awarded);
    for (const row of q.rubric ?? []) {
      const objective = objectiveOf.get(row.slot_ref);
      if (!objective) continue;
      if (awarded.has(row.code)) {
        // Got it right SINCE getting it wrong: nothing to revisit. Attempts are
        // read oldest-first, so a later success clears an earlier loss.
        lost.set(objective, 0);
      } else {
        lost.set(objective, (lost.get(objective) ?? 0) + row.mark_value);
      }
    }
  }

  for (const [id, marks] of lost) if (marks === 0) lost.delete(id);
  return { lostByObjective: lost, attemptedIds, waiting };
}
