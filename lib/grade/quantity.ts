import { numericValue } from './notation';
import { resolveUnit, type Quantity } from './units';

// A number with a unit is not a number: a quantity parses to a value in a
// CANONICAL BASE UNIT plus a dimension, and two are equal only when both
// match. 72 cm ≠ 72 m and 0.72 m = 72 cm then fall out of one rule.
//
// The vocabulary is units.ts and the value is read by symbolic.ts; this file is
// where a string is cut into the two and put back together.

export { sameDimension, UNIT_WORDS, type Quantity } from './units';

/**
 * THE VALUE IN FRONT OF A UNIT IS NOT ALWAYS A NUMBER. An exact area is
 * \frac{196\pi}{3} cm², an exact length is 3\sqrt[3]{10} cm, and the old head
 * was a digit regex — so every exact answer in the bank carrying a unit fell
 * out of the quantity path and out of the numeric one, and was compared as
 * TEXT against its own accept list.
 *
 * The three fast paths are what a student types, and are tried first because
 * they are most of the traffic. Reading the head as mathematics is the last
 * resort, not the first.
 */
function headValue(raw: string): number | null {
  const s = raw.trim();
  if (s === '') return null;
  const mixed = s.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const sign = mixed[1] === '-' ? -1 : 1;
    return sign * (Number(mixed[2]) + Number(mixed[3]) / Number(mixed[4]));
  }
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (frac) {
    const v = Number(frac[1]) / Number(frac[2]);
    return Number.isFinite(v) ? v : null;
  }
  const n = Number(s);
  if (Number.isFinite(n)) return n;
  return numericValue(s);
}

/**
 * Where a unit could begin, longest tail first, so a compound wins over its own
 * last word: "5 square metres" is an area and not five squares of metre.
 *
 * A letter behind a BACKSLASH starts a command and not a unit — \sqrt is not a
 * second — and a letter behind a letter is the middle of a word. Those two
 * rules are the whole of it: without them the scan would cut a surd in half and
 * call the rest a unit.
 */
function unitStarts(s: string): number[] {
  const out: number[] = [];
  for (let i = 1; i < s.length; i++) {
    if (!/[a-z°%]/i.test(s[i])) continue;
    if (/[a-z\\]/i.test(s[i - 1])) continue;
    out.push(i);
  }
  return out;
}

/**
 * Null is the important half of the contract: the caller falls back to the
 * comparisons already there, and a parser that guessed would start rejecting
 * correct answers. Input arrives pre-cleaned by equivalence.ts.
 */
export function parseQuantity(raw: string): Quantity | null {
  const s = raw.trim();
  for (const i of unitStarts(s)) {
    const unit = resolveUnit(s.slice(i));
    if (!unit) continue;
    const written = headValue(s.slice(0, i));
    if (written === null) continue;
    return { value: written * unit.factor, dimension: unit.dimension, written };
  }
  return null;
}

// Students type the multiplication sign with whatever the phone keyboard
// gives them. The rule is POSITIONAL, never a substitution: a separator is a
// multiplication sign only when a quantity sits on both sides of it, so "3x"
// and "2x + 5" keep their x instead of turning into arithmetic.
const SEPARATOR = /\s*\*\s*|\s+[x×]\s+|\s+by\s+/i;

export function parseQuantityProduct(raw: string): Quantity[] | null {
  const pieces = raw.trim().split(SEPARATOR);
  if (pieces.length < 2) return null;
  const parsed = pieces.map((p) => parseQuantity(p));
  if (parsed.some((q) => q === null)) return null;
  return parsed as Quantity[];
}

/** Two products match when they hold the same quantities, in any order. */
export function productsEqual(a: Quantity[], b: Quantity[], equal: (x: number, y: number) => boolean): boolean {
  if (a.length !== b.length) return false;
  const used = new Array<boolean>(b.length).fill(false);
  return a.every((qa) => {
    const i = b.findIndex((qb, j) => !used[j] && qb.dimension === qa.dimension && equal(qa.value, qb.value));
    if (i === -1) return false;
    used[i] = true;
    return true;
  });
}
