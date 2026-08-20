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
 */
export const GRADER_VERSION = 'v2';

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
