import type { RubricItem } from '@/lib/types';

/**
 * ROWS A PHOTOGRAPH OF THE WORKING COULD STILL EARN.
 *
 * R2 §4. The marking pass runs only over rows deterministic marking left
 * unearned, and two kinds of row are permanently out of its reach:
 *
 *   CAO — "correct answer only". The answer is what it marks, and the
 *   deterministic grader has already settled that. 24% of AK criteria say so.
 *
 *   Self-marked slots — a "show that", an explain or a construction is marked
 *   by the student against the solution. Nothing here is on offer to a model.
 *
 * This is also what decides whether the camera is offered at all. A photograph
 * where nothing is left to earn costs a student their time and us a model call
 * for a foregone conclusion, so the offer appears only where there is something
 * to gain — which is the honest signal as well as the cheap one.
 *
 * CAO is read from the criterion text, which is prose detection and the one
 * place this round does it. It is a mark-scheme token the generator writes
 * deliberately, in CXC's own vocabulary, the way `for_format` is a flag — and
 * the durable version of this is a declared boolean on the row with a
 * same-commit backfill. Written down because the difference matters: today a
 * criterion that says "correct answer only" in words rather than initials would
 * slip through.
 */
const CAO = /\bCAO\b/;

export interface MethodMarkQuestion {
  parts?: { label: string; slots?: { label: string; response_mode?: string }[] }[];
  rubric?: RubricItem[];
}

export function earnableByMethod(q: MethodMarkQuestion, awarded: string[]): RubricItem[] {
  const earned = new Set(awarded);
  const autoRefs = new Set(
    (q.parts ?? []).flatMap((p) =>
      (p.slots ?? [])
        .filter((s) => (s.response_mode ?? 'answer') === 'answer')
        .map((s) => `${p.label}.${s.label}`),
    ),
  );
  return (q.rubric ?? []).filter(
    (r) => !earned.has(r.code) && autoRefs.has(r.slot_ref) && !CAO.test(r.criterion),
  );
}

/**
 * ROWS A PHOTOGRAPHED CONSTRUCTION COULD EARN.
 *
 * A construct slot is self-marked, so earnableByMethod excludes it — there is
 * nothing for a text marker to judge, because the answer is a drawing. R2 §8
 * gives those rows a way to be earned after all: the correct drawing is a known
 * set of coordinates from the figure's own params, so a photograph can be
 * compared against it.
 *
 * Only rows the grader has not already awarded, and only on construct slots.
 * The same asymmetric rule holds — this can add these rows, never remove them.
 */
export function constructionRows(q: MethodMarkQuestion, awarded: string[]): RubricItem[] {
  const earned = new Set(awarded);
  const constructRefs = new Set(
    (q.parts ?? []).flatMap((p) =>
      (p.slots ?? [])
        .filter((s) => s.response_mode === 'construct')
        .map((s) => `${p.label}.${s.label}`),
    ),
  );
  return (q.rubric ?? []).filter((r) => !earned.has(r.code) && constructRefs.has(r.slot_ref));
}

/**
 * WHAT PHOTOGRAPHED WORKING EARNED ON AN ATTEMPT, ACROSS EVERY TAKE.
 *
 * Two takes exist so a blurry photograph can be replaced, which means the
 * second take normally reads the SAME working as the first and earns the same
 * rows again. Summing the takes paid twice for one row and could carry an
 * 8-mark paper to 12/12.
 *
 * A row is worth its marks once. The union of awarded codes is the earned set —
 * so a later take can add a row the earlier one missed, and a later take that
 * reads nothing (a wrong page, a dark photograph) takes nothing away. That is
 * the same asymmetry the marking pass itself obeys, applied across takes.
 */
export function methodMarksEarned(
  takes: { method_marks?: { code: string; awarded: boolean; mark_value: number }[] }[],
): number {
  const byCode = new Map<string, number>();
  for (const t of takes) {
    for (const m of t.method_marks ?? []) {
      if (m.awarded) byCode.set(m.code, m.mark_value);
    }
  }
  let total = 0;
  for (const v of byCode.values()) total += v;
  return total;
}

/** The rows earlier takes already paid for, so a later take never re-judges them. */
export function alreadyEarnedByMethod(
  takes: { method_marks?: { code: string; awarded: boolean }[] }[],
): string[] {
  const codes = new Set<string>();
  for (const t of takes) {
    for (const m of t.method_marks ?? []) if (m.awarded) codes.add(m.code);
  }
  return [...codes];
}
