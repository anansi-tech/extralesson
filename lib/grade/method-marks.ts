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
