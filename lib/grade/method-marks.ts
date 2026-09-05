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
 * A MARKING IS ALL OR NOTHING (ROUND_6 Task 1): exactly one decision per row
 * asked for. A missing, repeated or unknown code is a failure to store as one,
 * never a partial result to store as marks.
 */
export function oneDecisionPerRow<D extends { code: string }>(decisions: D[], codes: string[]): D[] {
  const wanted = new Set(codes);
  const seen = new Set<string>();
  for (const d of decisions) {
    if (!wanted.has(d.code)) throw new Error(`marker decided ${d.code}, a row it was not asked about`);
    if (seen.has(d.code)) throw new Error(`marker decided ${d.code} twice`);
    seen.add(d.code);
  }
  const missing = codes.filter((c) => !seen.has(c));
  if (missing.length) throw new Error(`marker did not decide ${missing.join(', ')}`);
  return decisions;
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

// Compared the way the grader reads a line, not character by character: the
// marker writes ≥ and − where the page has >= and -, and a space before a unit
// is not a different line.
const flatLine = (t: string) =>
  t
    .toLowerCase()
    .replace(/[“”"'$\\]/g, '')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/[−–—]/g, '-')
    .replace(/[÷]/g, '/')
    .replace(/[×·]/g, 'x')
    .replace(/\s+/g, '')
    .replace(/[.,;:]+$/, '');

/**
 * A QUOTE IS EVIDENCE ONLY IF IT IS ON THE PAGE. The marker quotes the line
 * that earned a row; a quote the read does not contain is a line the marker
 * made up, and the row is withheld for it. Unquoted reasons are not checked.
 */
export function requireEvidence<D extends { awarded: boolean; reason: string }>(decisions: D[], lines: string[]): D[] {
  // A sentence the page broke across two lines is one quote; the whole page,
  // joined, is what a quote is matched against.
  const page = flatLine(lines.join(' '));
  return decisions.map((d) => {
    if (!d.awarded) return d;
    const quotes = [...d.reason.matchAll(/[“"]([^“”"]{2,})[”"]/g)].map((m) => flatLine(m[1]));
    if (quotes.length === 0) return d;
    const supported = quotes.every((q) => page.includes(q));
    return supported ? d : { ...d, awarded: false, reason: 'no line on the page supports this' };
  });
}
