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
 * A slip is kept only when its quoted line is on the page (ROUND_7 Task 1).
 * The marker writes the part as "(b)" as often as "b"; the label is bare here.
 */
export function supportedSlips<S extends { quote: string; part: string }>(slips: S[], lines: string[]): S[] {
  const page = flatLine(lines.join(' '));
  return slips
    .map((s) => ({ ...s, part: s.part.replace(/[()\s]/g, '').toLowerCase() }))
    .filter((s) => flatLine(s.quote).length >= 2 && page.includes(flatLine(s.quote)));
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

export const UNGROUNDED = 'the working uses a value we can’t find on the page or in the question.';

/**
 * The numbers a text holds, each as one canonical string: "1 056 000",
 * "1,056,000" and "1056000" are one number; "0.050" and "0.05" are one.
 */
export function numbersIn(text: string): Set<string> {
  const out = new Set<string>();
  for (const m of text.replace(/(\d)[ ,](?=\d{3}\b)/g, '$1').matchAll(/\d+(?:\.\d+)?/g)) {
    out.add(String(Number(m[0])));
  }
  return out;
}

/** The constants of a method, never a quantity of the problem: small scalars and powers of ten. */
const isMethodConstant = (n: string): boolean => {
  const v = Number(n);
  return Number.isInteger(v) && (v <= 12 || /^10*$/.test(n));
};

/**
 * THE NUMBERS A PAGE HAS EARNED, line by line. A line's result counts only
 * when the line's own inputs were already grounded — the question, an answer,
 * or a line above it that earned its numbers the same way. A line that works
 * on a value from nowhere grounds nothing, so a page that opens on another
 * question's numbers never grounds its own: the cocoa page's first line
 * introduces 1 200 000, and every line built on it stays ungrounded.
 */
export function groundedNumbers(lines: string[], known: Set<string>): Set<string> {
  const grounded = new Set(known);
  for (const line of lines) {
    const segments = line.split('=');
    const inputs = segments.length > 1 ? [...numbersIn(segments.slice(0, -1).join('='))] : [...numbersIn(line)];
    if (inputs.every((n) => isMethodConstant(n) || grounded.has(n))) for (const n of numbersIn(line)) grounded.add(n);
  }
  return grounded;
}

/**
 * A NUMBER IN AN AWARD IS GROUNDED OR THE ROW IS WITHHELD. The marker names
 * every number the quoted line uses; each must be in the question, in a
 * confirmed answer, or earned by an earlier line of the page. A number found
 * nowhere is another page's, or a guess — the cocoa page marked against the
 * slab question earned (b) on 1 200 000 and 144 000, which the slab question
 * never gave. Rows the marker did not name numbers for are left as decided.
 */
export function requireGrounding<D extends { awarded: boolean; reason: string; quantities?: string[] }>(
  decisions: D[],
  ground: { question: string; answers: string[]; lines: string[] },
): D[] {
  const known = new Set<string>([...numbersIn(ground.question), ...ground.answers.flatMap((a) => [...numbersIn(a)])]);
  const flatLines = ground.lines.map(flatLine);
  return decisions.map((d) => {
    if (!d.awarded || !d.quantities?.length) return d;
    // The earlier lines are the ones above the line the award is about: the
    // line the reason quotes, or, unquoted, the first line where the named
    // numbers appear together. A line never grounds itself: a page that
    // introduces its numbers on its first line has grounded none of them.
    const named = d.quantities.flatMap((q) => [...numbersIn(q)]);
    const quotes = [...d.reason.matchAll(/[“"]([^“”"]{2,})[”"]/g)].map((m) => flatLine(m[1]));
    const lineNumbers = ground.lines.map((l) => numbersIn(l));
    const quoted = quotes.length ? flatLines.findIndex((l) => quotes.some((q) => l.includes(q) || q.includes(l))) : -1;
    const at = quoted >= 0 ? quoted : lineNumbers.findIndex((ns) => named.every((n) => isMethodConstant(n) || ns.has(n)));
    const earned = groundedNumbers(at >= 0 ? ground.lines.slice(0, at) : [], known);
    const grounded = named.every((n) => isMethodConstant(n) || earned.has(n));
    return grounded ? d : { ...d, awarded: false, reason: UNGROUNDED };
  });
}
