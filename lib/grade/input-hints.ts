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
}

// Ordered by how much a student loses for not knowing it.
const RULES: Rule[] = [
  { when: /\\sqrt|√/, hint: 'A square root can be typed sqrt(2) or √2.', symbols: ['√'] },
  { when: /\\le\b|\\ge\b|\\leq|\\geq|≤|≥/, hint: 'Type <= for ≤ and >= for ≥.', symbols: ['≤', '≥'] },
  { when: /\\pi\b|π/, hint: 'Pi can be typed pi or π.', symbols: ['π'] },
  { when: /\^\s*\{?\s*\\circ|°/, hint: 'The degree sign is optional: 45 or 45°.', symbols: ['°'] },
  { when: /%/, hint: 'Percent or decimal: 20% or 0.2.' },
  { when: /\\frac|\d\s*\/\s*\d/, hint: 'Fraction or decimal: 3/4 or 0.75.' },
  { when: /\\times|×/, hint: 'The times sign can be typed x or *.' },
  { when: /\^\s*\{?\s*[23]\}?|²|³/, symbols: ['²', '³'] },
];

/** A unit the student may leave off, which the marker supplies from the question. */
const UNIT_HINT = 'The unit is optional — 72 and 72 cm are both accepted.';

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

  if (shape === 'quantity' && hints.length < MAX_HINTS) hints.push(UNIT_HINT);
  return { hints, symbols };
}
