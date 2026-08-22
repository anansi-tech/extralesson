import { parseQuantity } from './quantity';
import { parseNumeric } from './equivalence';

/**
 * WHAT INPUT AN ANSWER ACTUALLY WANTS.
 *
 * A single free-text box asks every answer to be typed as a string, which puts
 * two problems on the student at once: reaching characters a phone keyboard
 * does not have, and choosing a delimiter the marker will accept. Both are
 * typing, not mathematics, and both have cost real marks.
 *
 * Classifying the shape lets the session render the input the answer wants —
 * one box per value, stacked boxes for a column vector, a fixed colon between
 * ratio boxes — so the student never types a delimiter and the marker never
 * parses one.
 *
 * The shape is read from the SLOT ANSWER — the same string the marker compares
 * against — and never stored beside it. One source of truth: an answer edited
 * in review changes the input the student is given and the components the
 * marker checks in the same instant, so the two cannot disagree. A copy of the
 * classification on the slot would go stale silently the first time someone
 * corrected an answer, and render the wrong number of boxes.
 */
export type InputShape =
  | 'number' //        42, -1/3, 0.75
  | 'quantity' //      72 cm, $260, 35°
  | 'list' //          18 kg, 27 kg, 36 kg — order carries meaning
  | 'roots' //         x = 2 or x = -1/3 — order does not
  | 'set' //           {1, 2, 3} — order does not
  | 'coordinate' //    (3, 4)
  | 'column_vector' // a 2x1 or 3x1 matrix
  | 'matrix' //        anything wider than one column
  | 'ratio' //         2 : 3
  | 'inequality' //    x <= 5
  | 'expression' //    2x + 5, T_n = 0.2n + 1.4
  | 'word'; //         prose, a classification, a yes/no

export interface ShapeReading {
  shape: InputShape;
  /** How many values the student has to enter. 1 unless the shape is plural. */
  boxes: number;
  /** Whether the order of those values is part of the answer. */
  ordered: boolean;
  /** The answer broken into the values a student would enter, in order. */
  values: string[];
  /** Columns, for a matrix — the grid cannot be laid out without it. */
  cols?: number;
}

/**
 * Shapes whose number of values is fixed by the QUESTION rather than by the
 * answer: a coordinate is always a pair, a column vector has the rows the
 * question asked for. Their box count can be shown.
 *
 * The others must not show it. "List the factors of 24" rendered as eight
 * boxes has answered itself — the paper does not say how many there are, and
 * neither may we. Those grow on demand instead.
 */
export const FIXED_ARITY = new Set<InputShape>(['coordinate', 'column_vector', 'matrix', 'ratio']);

/**
 * A list this short is the question naming what it wants — "calculate both
 * angles", "state the two shares" — so its length is already public and the
 * boxes may show it. Longer than this it is an enumeration, and how many there
 * are is the thing being asked.
 *
 * Measured on the live bank: 38 of 52 list slots hold exactly two values and
 * only 7 hold five or more, while sets run the other way — 13 of 22 hold five
 * or more and exactly one holds two. Withholding the count from all of them
 * opened three empty boxes for a two-value answer, which is what a student hit.
 */
export const NAMED_LIST_MAX = 4;

/** Whether the number of boxes can be shown without answering the question. */
export function showsBoxCount(reading: ShapeReading): boolean {
  if (FIXED_ARITY.has(reading.shape)) return true;
  return reading.shape === 'list' && reading.boxes <= NAMED_LIST_MAX;
}

/** Shapes entered as several values, however many. */
export function isMultiValue(shape: InputShape): boolean {
  return shape === 'list' || shape === 'set' || shape === 'roots' || FIXED_ARITY.has(shape);
}

/** KaTeX dressing removed, so the shape underneath is visible. */
function bare(raw: string): string {
  return raw
    .trim()
    .replace(/^\$+|\$+$/g, '')
    .replace(/\\left|\\right|\\,|\;|\\!/g, '')
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\\[dt]frac/g, '\\frac')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .trim();
}

const NUMBERISH = /^-?\d+(?:\.\d+)?(?:\s*\/\s*-?\d+(?:\.\d+)?)?$/;

/**
 * Split on a separator that is NOT inside brackets.
 *
 * A sample space is written {(Mango,H),(Mango,T)} and its members are the
 * PAIRS. Splitting on every comma tears them in half and offers the student
 * four boxes holding "(Mango" and "H)".
 */
function splitTopLevel(s: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of s) {
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    if (ch === sep && depth <= 0) {
      out.push(current);
      current = '';
    } else current += ch;
  }
  out.push(current);
  return out.map((p) => p.trim()).filter(Boolean);
}

/**
 * A set written as a CONDITION rather than as members: {x in N : 1 <= x <= 12}.
 *
 * There is nothing to put in boxes — the answer is a predicate, not a list of
 * values — and it cannot be typed on a phone either. Slots whose answer reads
 * this way are marked by the student against the revealed answer instead of
 * being auto-marked wrong, which is what they were.
 */
export function isSetBuilder(rawAnswer: string): boolean {
  const s = bare(rawAnswer);
  if (!/^\\?\{/.test(s)) return false;
  return /\\in\b|\\mathbb|\\mid\b|\\nmid\b/.test(s);
}

function isValue(piece: string): boolean {
  const p = piece.trim().toLowerCase();
  if (p === '') return false;
  return NUMBERISH.test(p) || parseQuantity(p) !== null || parseNumeric(p) !== null;
}

export function readInputShape(rawAnswer: string): ShapeReading {
  const s = bare(rawAnswer);
  const lower = s.toLowerCase();

  // \binom{4}{-2} is a column vector too. The papers and the generator both
  // reach for it — it is the shorter way to write a 2x1 — and reading only
  // \begin{pmatrix} left twelve vector answers classified as prose, so they
  // rendered as a single free-text box asking a student to type KaTeX.
  const binom = s.match(/\\[dt]?binom\s*\{([^{}]*)\}\s*\{([^{}]*)\}/);
  if (binom) {
    return {
      shape: 'column_vector',
      boxes: 2,
      ordered: true,
      values: [binom[1].trim(), binom[2].trim()],
    };
  }

  const grid = s.match(/\\begin\{[bp]matrix\}([\s\S]*?)\\end\{[bp]matrix\}/);
  if (grid) {
    const rows = grid[1].split(/\\\\/).map((r) => r.trim()).filter(Boolean);
    const cols = Math.max(...rows.map((r) => r.split('&').length));
    const cells = rows.flatMap((r) => r.split('&').map((c) => c.trim()));
    return cols > 1
      ? { shape: 'matrix', boxes: rows.length * cols, ordered: true, values: cells, cols }
      : { shape: 'column_vector', boxes: rows.length, ordered: true, values: cells };
  }

  const set = s.match(/^\\?\{([\s\S]*)\\?\}$/);
  if (set) {
    const members = splitTopLevel(set[1].replace(/\\$/, ''), ',');
    return { shape: 'set', boxes: Math.max(1, members.length), ordered: false, values: members };
  }

  // A root list is unordered by nature; "or" is how the papers write it.
  if (/\bor\b/.test(lower) && lower.includes('=')) {
    const roots = s.split(/\s+or\s+/i).map((r) => r.trim()).filter(Boolean);
    return { shape: 'roots', boxes: roots.length, ordered: false, values: roots };
  }

  if (/(<|>|\\le\b|\\ge\b|\\leq\b|\\geq\b|≤|≥)/.test(s)) {
    return { shape: 'inequality', boxes: 1, ordered: true, values: [s] };
  }

  const coord = s.match(/^\(\s*(-?[\d./\s]+)\s*,\s*(-?[\d./\s]+)\s*\)$/);
  if (coord && isValue(coord[1]) && isValue(coord[2])) {
    return { shape: 'coordinate', boxes: 2, ordered: true, values: [coord[1].trim(), coord[2].trim()] };
  }

  const ratio = s.split(/\s*:\s*/);
  if (ratio.length >= 2 && ratio.every(isValue)) {
    return { shape: 'ratio', boxes: ratio.length, ordered: true, values: ratio.map((r) => r.trim()) };
  }

  const pieces = splitTopLevel(s, ',');
  if (pieces.length >= 2 && pieces.every(isValue)) {
    return { shape: 'list', boxes: pieces.length, ordered: true, values: pieces.map((p) => p.trim()) };
  }

  const one = (shape: InputShape): ShapeReading => ({ shape, boxes: 1, ordered: true, values: [s] });
  if (parseQuantity(lower) !== null) return one('quantity');
  if (parseNumeric(lower) !== null) return one('number');

  // A variable with something done to it, or an equation, is an expression.
  if (/[=+\-*/^]/.test(s) && /[a-z]/i.test(s.replace(/\\[a-z]+/gi, ''))) return one('expression');
  if (/^\\?[a-z](\^|_|\()/i.test(s)) return one('expression');

  return one('word');
}

/**
 * HOW WIDE A BOX HAS TO BE TO HOLD ITS ANSWER.
 *
 * Measured in characters, from what the student will TYPE rather than from the
 * mark scheme's markup: the key writes \\frac{9}{5}, eleven characters, and the
 * student types 9/5, which is three. Sizing from the raw string would make
 * every fraction box three times wider than it needs to be.
 *
 * The width is the longest value in the SLOT, applied to all of its boxes, so
 * one box is never a clue to the length of its own answer while the boxes stay
 * a consistent size beside each other.
 */
const MIN_BOX_CHARS = 5;
const MAX_BOX_CHARS = 18;

function typedLength(value: string): number {
  const typed = value
    .replace(/\$/g, '')
    .replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '$1/$2')
    .replace(/\\sqrt\s*\{([^{}]*)\}/g, 'sqrt($1)')
    .replace(/\\text\s*\{([^{}]*)\}/g, '$1')
    .replace(/\\[a-z]+/gi, 'x') // any remaining command types as a symbol or two
    .replace(/[{}]/g, '')
    .trim();
  return typed.length;
}

/** Characters wide the boxes of this slot should be. */
export function boxWidthChars(reading: ShapeReading): number {
  const longest = Math.max(0, ...reading.values.map(typedLength));
  return Math.min(MAX_BOX_CHARS, Math.max(MIN_BOX_CHARS, longest));
}
