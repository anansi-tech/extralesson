import type { RubricItem } from '@/lib/types';

/**
 * CAO rows are out of reach because the deterministic grader already settled
 * the answer (ROUND_2 §4); CAO is read from criterion prose, so one spelled out
 * in words slips through. An empty result also withholds the camera offer.
 * Rows on a slot the student reasons or shows on paper are read off the page
 * too (ROUND_4 post-smoke): only a drawing needs the construction check.
 */
const CAO = /\bCAO\b/;
const READ_OFF_THE_PAGE = new Set(['answer', 'explain', 'show_that']);

export interface MethodMarkQuestion {
  parts?: { label: string; slots?: { label: string; response_mode?: string }[] }[];
  rubric?: RubricItem[];
}

export function earnableByMethod(q: MethodMarkQuestion, awarded: string[]): RubricItem[] {
  const earned = new Set(awarded);
  const readable = new Set(
    (q.parts ?? []).flatMap((p) =>
      (p.slots ?? [])
        .filter((s) => READ_OFF_THE_PAGE.has(s.response_mode ?? 'answer'))
        .map((s) => `${p.label}.${s.label}`),
    ),
  );
  return (q.rubric ?? []).filter(
    (r) => !earned.has(r.code) && readable.has(r.slot_ref) && !CAO.test(r.criterion),
  );
}

/**
 * Construct slots are self-marked, so earnableByMethod excludes them; a drawing
 * can still be compared against coordinates the figure's own params fix
 * (ROUND_2 §8). Asymmetric like the marker: it adds rows, never removes them.
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
 * A row is worth its marks ONCE across takes, so the earned set is the union of
 * awarded codes and never their sum. A later take can add a row the first
 * missed, and a take that reads nothing takes nothing away.
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

/**
 * THE SCHEME'S "dep": a form row pays for the FORM of a value, so it is
 * earned only when the value row or a method row on the same slot is. A
 * percentage sign on a wrong number is not a mark (smoke #2, fish-vendor R3).
 */
export function applyFormatDependency<D extends { code: string; awarded: boolean; reason: string }>(
  decisions: D[],
  rows: { code: string; slot_ref: string; for_format?: boolean }[],
  settledAwarded: string[],
): D[] {
  const rowByCode = new Map(rows.map((r) => [r.code, r]));
  const awarded = new Set([...settledAwarded, ...decisions.filter((d) => d.awarded).map((d) => d.code)]);
  const carried = (slotRef: string) =>
    rows.some((r) => r.slot_ref === slotRef && !r.for_format && awarded.has(r.code));
  return decisions.map((d) => {
    const row = rowByCode.get(d.code);
    if (!row?.for_format || !d.awarded || carried(row.slot_ref)) return d;
    return { ...d, awarded: false, reason: 'The form is right, but the value it is written on did not earn its mark.' };
  });
}
