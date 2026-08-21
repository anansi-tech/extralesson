import type { InputShape } from './input-shape';

/**
 * WHAT IS LEGAL TO TYPE, SAID WHERE THE TYPING HAPPENS.
 *
 * The marker accepts far more than a student can guess: sqrt(2) for a surd,
 * 0.75 for three quarters, 72 for 72 cm, <= for ≤. None of that is discoverable
 * from an empty box, so a student types what they can reach and hopes. Every
 * one of those is a mark riding on a guess about software.
 *
 * The hints are derived from the SAME answer the shape is read from, so they
 * appear only where they apply — under the box, not on a help page nobody
 * opens.
 *
 * THE EXAMPLES ARE CONSTANTS. The answer decides WHICH hint shows; it never
 * supplies the numbers in it, or the hint would print the answer under the box
 * a student is trying to answer.
 */
export interface InputAffordance {
  /** At most two lines. More than that is a help page again. */
  hints: string[];
  /** Characters a phone keyboard hides, inserted at the cursor. */
  symbols: string[];
}

const MAX_HINTS = 2;

interface Rule {
  when: RegExp;
  hint?: string;
  symbols?: string[];
  /**
   * THE PROMISE THE HINT MAKES, as [what a student types, what the scheme says].
   *
   * A hint is a claim about the marker. Written as prose beside a regex, the
   * two drift: the hint kept promising that a percent could be written without
   * its sign long after anyone had checked, and the only thing standing behind
   * the promise was that someone had once been right. Every promise here is
   * asserted against the real marker in tests/input-hints.test.ts, so a hint
   * that stops being true fails the build instead of misleading a student.
   */
  promise?: [string, string];
}

// Ordered by how much a student loses for not knowing it.
const RULES: Rule[] = [
  {
    when: /\\sqrt|√/,
    hint: 'A square root can be typed sqrt(…) — e.g. sqrt(7) for √7.',
    symbols: ['√'],
    promise: ['sqrt(7)', '$\\sqrt{7}$'],
  },
  {
    when: /\\le\b|\\ge\b|\\leq|\\geq|≤|≥/,
    hint: 'Type <= for ≤ and >= for ≥.',
    symbols: ['≤', '≥'],
    promise: ['n<=7', '$n \\le 7$'],
  },
  {
    when: /\\pi\b|π/,
    hint: 'Pi can be typed pi — e.g. 3pi for 3π.',
    symbols: ['π'],
    promise: ['3pi', '$3\\pi$'],
  },
  {
    when: /\^\s*\{?\s*\\circ|°/,
    hint: 'The degree sign is optional — e.g. 47 or 47°.',
    symbols: ['°'],
    promise: ['47', '$47^\\circ$'],
  },
  // The example carries "e.g." and an unroundable number on purpose: a student
  // read a tidy "20%" here as the answer they were being told to give.
  { when: /%/, hint: 'Percent or decimal — e.g. 37% or 0.37.', promise: ['37', '37%'] },
  {
    when: /\\frac|\d\s*\/\s*\d/,
    hint: 'Fraction or decimal — e.g. 7/8 or 0.875.',
    promise: ['0.875', '$\\frac{7}{8}$'],
  },
  {
    when: /\\times|×/,
    hint: 'The times sign can be typed x or *.',
    promise: ['5 x 3', '$5 \\times 3$'],
  },
  { when: /\^\s*\{?\s*[23]\}?|²|³/, symbols: ['²', '³'] },
];

/** Every promise the hints make, for the test that holds them to the marker. */
export const HINT_PROMISES: { hint: string; typed: string; canonical: string }[] = RULES.filter(
  (r) => r.promise,
).map((r) => ({ hint: r.hint ?? '', typed: r.promise![0], canonical: r.promise![1] }));

/** A unit the student may leave off, which the marker supplies from the question. */
const UNIT_HINT = 'The unit is optional — e.g. 72 and 72 cm are both accepted.';

export function inputAffordance(answer: string, shape: InputShape): InputAffordance {
  // Prose is answered in words; none of this applies, and a strip of maths
  // symbols under a one-word box is noise.
  if (shape === 'word') return { hints: [], symbols: [] };

  const hints: string[] = [];
  const symbols: string[] = [];
  for (const rule of RULES) {
    if (!rule.when.test(answer)) continue;
    if (rule.hint && hints.length < MAX_HINTS) hints.push(rule.hint);
    for (const s of rule.symbols ?? []) if (!symbols.includes(s)) symbols.push(s);
  }

  // The degree sign IS the unit, and percent is the unit. Adding "the unit is
  // optional" underneath "the degree sign is optional" says one thing twice and
  // spends the second line saying it.
  const unitAlreadySaid = hints.some((h) => h.includes('degree sign') || h.includes('Percent'));
  if (shape === 'quantity' && !unitAlreadySaid && hints.length < MAX_HINTS) hints.push(UNIT_HINT);
  return { hints, symbols };
}
