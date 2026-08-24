import { createHash } from 'node:crypto';

/**
 * What the marker was when an attempt was marked.
 *
 * Bump this whenever marking BEHAVIOUR changes — equivalence, tolerance,
 * formats, the assessable-marks denominator. Not for a refactor that cannot
 * change a verdict.
 *
 * History, so the next change can be audited against exactly what it replaced:
 *   v1  the marker as it stood before units were compared at all
 *   v2  units compared dimensionally; money a dimension; numbers compared to
 *       the precision written rather than within 0.5%; the denominator read
 *       from rubric rows on auto-marked slots
 *   v3  a product of quantities matches however the multiplication sign was
 *       typed; percent gets the omitted-unit leniency every other unit had
 *   v4  expressions compared by sampling instead of by rationalize()'s output
 *       string, which left float residue and reported an expression as not
 *       equivalent to itself; a symbolic engine may now only prove equality,
 *       never inequality; x read as times between arithmetic pieces, not only
 *       between quantities carrying units; a comma separates a list whether or
 *       not a space follows it; zero-width characters and non-breaking spaces
 *       scrubbed before anything reads the answer
 *   v5  a declared FORM is read off the number rather than the string around
 *       it — a unit, KaTeX dressing or a prose tail no longer makes an
 *       answer's form unreadable — a form is checked per value on a slot
 *       holding several instead of on the line they were joined into, and a
 *       whole number's trailing zeros are read as the ambiguity they are, so
 *       2540 satisfies 3 significant figures as well as 4
 *   v6  a verdict means exactly what the score means. Method marks are no
 *       longer awarded from a working box that belongs to the whole question,
 *       so a wrong slot cannot be paid for by another slot's working; a
 *       declared form that no rubric row pays for is reported and no longer
 *       fails the answer; and a slot carrying no marks — self-marked, or with
 *       no rubric row — no longer votes on correctness
 */
export const GRADER_VERSION = 'v6';

/**
 * What the METHOD marker was when a photographed working was judged.
 *
 * Versioned exactly like the grader and for the same reason: every prompt or
 * model change re-runs against the golden set and is reported as a delta before
 * it lands (R2 §6). "v0" means the pass has never run — the feature is off
 * until the eval gate passes, and an attempt stamped v0 was marked
 * deterministically and by nothing else.
 *
 * History:
 *   v0  method marking not enabled; deterministic marking only
 *   v1  first pass over the golden set. 89% agreement on the 128 rows in
 *       contention. Two failure modes fixed: a follow-through criterion's
 *       printed number was being read as a value the student had to produce
 *       rather than as the scheme's own, and a criterion naming an act was
 *       being earned by a result merely consistent with it
 *   v2  no behavioural change: v1's verdicts vary between runs (93/92/91% and
 *       one below the gate) and temperature 0 was tried to stop it. The
 *       provider rejects temperature on a reasoning model, so the variance is
 *       inherent and the gate must be judged over repeated runs, not one
 */
export const MARKER_VERSION = 'v2';

/** An attempt stamped before this existed. Recorded, not guessed at. */
export const GRADER_VERSION_UNKNOWN = 'unstamped';

interface Markable {
  parts?: {
    label: string;
    slots?: {
      label: string;
      answer?: string;
      accept?: string[];
      answer_format?: string;
      response_mode?: string;
    }[];
  }[];
  rubric?: { slot_ref: string; mark_value: number }[];
  answer_key?: number;
  marks: number;
}

/**
 * A fingerprint of the question AS THE MARKER SEES IT.
 *
 * Only the fields a verdict depends on: what each slot accepts, in what form,
 * whether it is marked at all, and which rubric rows hang off it. Not the
 * wording, not the figure, not the worked solution — a typo fixed in a stem
 * cannot change how an answer was marked, and hashing the whole document would
 * invalidate the audit trail every time someone corrected one.
 */
export function questionFingerprint(q: Markable): string {
  const marking = {
    marks: q.marks,
    answer_key: q.answer_key,
    slots: (q.parts ?? []).flatMap((p) =>
      (p.slots ?? []).map((s) => [
        `${p.label}.${s.label}`,
        s.answer ?? '',
        [...(s.accept ?? [])].sort(),
        s.answer_format ?? '',
        s.response_mode ?? 'answer',
      ]),
    ),
    rubric: (q.rubric ?? [])
      .map((r) => [r.slot_ref, r.mark_value] as const)
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1])),
  };
  return createHash('sha256').update(JSON.stringify(marking)).digest('hex').slice(0, 16);
}
