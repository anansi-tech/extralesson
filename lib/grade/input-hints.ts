import type { InputShape } from './input-shape';

/**
 * WHAT IS LEGAL TO TYPE, SAID WHERE THE TYPING HAPPENS — an empty box makes
 * every form the marker accepts a guess, and a mark rides on it. THE EXAMPLES
 * ARE CONSTANTS: a hint must never print the answer to the box it sits under.
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
   * A hint is a claim about the marker, and prose beside a regex drifts from it,
   * so every promise is asserted against the real marker in the tests.
   */
  promise?: [string, string];
  /**
   * WHAT THE KEY PUTS IN THE BOX, as a whole answer. "Tap √" promises the
   * tapped form marks as well as the typed one, and both go to the real marker.
   */
  tapped?: string;
}

// A HINT BESIDE A KEY DESCRIBES THE KEY. "Type <= for ≤" was printed directly
// under a button that inserts ≤: the product advising against its own control,
// and the student left to guess whether the two are the same answer. Where a
// rule offers keys, its hint names them first and the typing second.


// Ordered by how much a student loses for not knowing it.
const RULES: Rule[] = [
  {
    when: /\\sqrt|√/,
    hint: 'Tap √ or type sqrt(…) — e.g. sqrt(7) for √7.',
    symbols: ['√'],
    promise: ['sqrt(7)', '$\\sqrt{7}$'],
    tapped: '√7',
  },
  {
    when: /\\le\b|\\ge\b|\\leq|\\geq|≤|≥/,
    hint: 'Tap ≤ or ≥, or type <= and >=.',
    symbols: ['≤', '≥'],
    promise: ['n<=7', '$n \\le 7$'],
    tapped: 'n≤7',
  },
  {
    when: /\\pi\b|π/,
    hint: 'Tap π or type pi — e.g. 3pi for 3π.',
    symbols: ['π'],
    promise: ['3pi', '$3\\pi$'],
    tapped: '3π',
  },
  {
    when: /\^\s*\{?\s*\\circ|°/,
    hint: 'Tap ° or leave it out — e.g. 47 and 47° are both accepted.',
    symbols: ['°'],
    promise: ['47', '$47^\\circ$'],
    tapped: '47°',
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

/** Every hint that sits beside keys, for the test that holds it to them. */
export const HINT_KEYS: { hint: string; symbols: string[] }[] = RULES.filter(
  (r) => r.hint && r.symbols?.length,
).map((r) => ({ hint: r.hint!, symbols: r.symbols! }));

/** Every promise the hints make, for the test that holds them to the marker. */
export const HINT_PROMISES: { hint: string; typed: string; canonical: string; tapped?: string }[] = RULES.filter(
  (r) => r.promise,
).map((r) => ({ hint: r.hint ?? '', typed: r.promise![0], canonical: r.promise![1], tapped: r.tapped }));

/**
 * The unit is the SLOT'S OWN — a hint under a mass answer talking about
 * centimetres describes a different question. The number stays a constant,
 * because the one thing a hint must never print is the answer.
 */
const EXAMPLE_VALUES = [72, 45];

function unitOf(answer: string): string | null {
  const bare = answer
    .replace(/^\$+|\$+$/g, '')
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\\,/g, ' ')
    .trim();
  const m = bare.match(/(?<=\d)\s*([a-z]{1,3}(?:\/[a-z]{1,3})?(?:\^\{?[23]\}?)?)\s*$/i);
  return m ? m[1].trim() : null;
}

function unitHint(answer: string): string | null {
  const unit = unitOf(answer);
  if (!unit) return null;
  // If the constant happens to be the answer's own number, use the other one:
  // a hint that prints the answer under the box is worse than no hint.
  const own = answer.match(/\d+/)?.[0];
  const example = EXAMPLE_VALUES.find((v) => String(v) !== own) ?? EXAMPLE_VALUES[0];
  return `The unit is optional — e.g. ${example} and ${example} ${unit} are both accepted.`;
}

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

  // The degree sign IS the unit, and so is percent; "the unit is optional"
  // underneath would say one thing twice and spend the second line saying it.
  const unitAlreadySaid = hints.some((h) => h.includes('degree sign') || h.includes('Percent'));
  if (shape === 'quantity' && !unitAlreadySaid && hints.length < MAX_HINTS) {
    const hint = unitHint(answer);
    if (hint) hints.push(hint);
  }
  return { hints, symbols };
}
