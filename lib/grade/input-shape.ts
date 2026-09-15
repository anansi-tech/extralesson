import { parseQuantity } from './quantity';
import { canEvaluate, isProse, parseNumeric } from './equivalence';
import { bare, matrixRows, NUMBERISH, splitTopLevel, unorderedReading, wrapped } from './answer-syntax';

/**
 * One box per value, so the student never types a delimiter. Read from the
 * SLOT ANSWER the marker compares against, never stored beside it: a copy goes
 * stale the first time review corrects an answer and renders the wrong boxes.
 */
export type InputShape =
  | 'number'
  | 'quantity'
  | 'list'
  | 'roots'
  | 'set'
  | 'coordinate'
  | 'column_vector'
  | 'matrix'
  | 'ratio'
  | 'inequality'
  | 'expression'
  | 'word';

export interface ShapeReading {
  shape: InputShape;
  /** 1 unless the shape is plural. */
  boxes: number;
  ordered: boolean;
  /** The answer split into the values a student enters, in reading order. */
  values: string[];
  /** Columns, for a matrix — the grid cannot be laid out without it. */
  cols?: number;
  /**
   * Where group boundaries fall when the elements are themselves groups —
   * [2,2] for two pairs. `values` stays FLAT and in reading order, so one box
   * per value and the positional comparison keep working.
   */
  groups?: number[];
  groupKind?: '(' | '{';
}

/**
 * Shapes whose value count is fixed by the QUESTION, so showing the box count
 * gives nothing away. The others must not show it: "list the factors of 24"
 * rendered as eight boxes has answered itself.
 */
export const FIXED_ARITY = new Set<InputShape>(['coordinate', 'column_vector', 'matrix', 'ratio']);

/**
 * Up to this many, a list is the question naming what it wants — "both angles"
 * — so its length is already public; longer, the count is what is being asked.
 * Measured on the bank: 38 of 52 list slots hold exactly two values.
 */
export const NAMED_LIST_MAX = 4;

/** Whether the number of boxes can be shown without answering the question. */
export function showsBoxCount(reading: ShapeReading): boolean {
  if (FIXED_ARITY.has(reading.shape)) return true;
  return reading.shape === 'list' && reading.boxes <= NAMED_LIST_MAX;
}

export function isMultiValue(shape: InputShape): boolean {
  return shape === 'list' || shape === 'set' || shape === 'roots' || FIXED_ARITY.has(shape);
}

/** Public member structure, never the number of groups in the answer key. */
export function inputGroup(reading: Pick<ShapeReading, 'groups' | 'groupKind'>): { size: number; kind: '(' | '{' } | undefined {
  const size = reading.groups?.[0];
  return size && reading.groupKind && reading.groups?.every(n => n === size)
    ? { size, kind: reading.groupKind } : undefined;
}

/**
 * A set written as a CONDITION, not as members: {x in N : 1 <= x <= 12}. The
 * answer is a predicate — nothing to put in boxes, nothing a phone can type —
 * so these slots are self-marked against the revealed answer, not auto-marked.
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

/**
 * A COMPONENT OF A POINT IS WHATEVER THE ANSWER IS EXACT IN. An intersection
 * lands on \frac{5}{2} as readily as on 2, and the old rule admitted digits, a
 * dot and a slash — so an exact point was not a point, split into no boxes, and
 * was compared against its own decimal form as text.
 *
 * Prose is excluded by name: the comparator can settle "red" as a word, but
 * (red, blue) is a pair of colours and not a coordinate.
 */
function isComponent(piece: string): boolean {
  const p = piece.trim();
  return p !== '' && !isProse(p) && canEvaluate(p);
}


export function readInputShape(rawAnswer: string): ShapeReading {
  const s = bare(rawAnswer);
  const lower = s.toLowerCase();
  const one = (shape: InputShape): ShapeReading => ({ shape, boxes: 1, ordered: true, values: [s] });

  const rows = matrixRows(s);
  if (rows) {
    const cols = Math.max(...rows.map((r) => r.length));
    const cells = rows.flat();
    return cols > 1
      ? { shape: 'matrix', boxes: rows.length * cols, ordered: true, values: cells, cols }
      : { shape: 'column_vector', boxes: rows.length, ordered: true, values: cells };
  }

  // SETS AND ROOTS ARE READ BY answer-syntax.ts, which is also what the
  // comparator asks. The two used to decide separately whether an answer
  // carried an order, and `ordered` below is now that one answer.
  const unordered = unorderedReading(s);
  if (unordered) {
    return {
      shape: unordered.shape,
      boxes: Math.max(1, unordered.values.length),
      ordered: false,
      values: unordered.values.length ? unordered.values : [s],
      ...(unordered.groups ? { groups: unordered.groups, groupKind: unordered.groupKind } : {}),
    };
  }

  // A RELATION SIGN ON ITS OWN answers "which sign goes in the box": a symbol to
  // choose, not a statement to satisfy. Read as an inequality it had no terms,
  // so nothing could evaluate it and it was compared as raw text.
  if (/^(<|>|=|<=|>=|\\le|\\ge|\\leq|\\geq|≤|≥)$/.test(s.trim())) return one('word');

  if (/(<|>|\\le\b|\\ge\b|\\leq\b|\\geq\b|≤|≥)/.test(s)) {
    return { shape: 'inequality', boxes: 1, ordered: true, values: [s] };
  }

  // The point may be named — O(0,0) is the point (0,0), the way "x = 5" is the
  // value 5 — and the comparator strips the name. Without the same reading here
  // the two sides split into different numbers of boxes and never meet.
  const point = wrapped(s.replace(/^[a-z]\s*(?=\()/i, ''), '(');
  if (point !== null) {
    const parts = splitTopLevel(point, ',');
    if (parts.length === 2 && parts.every(isComponent)) {
      return { shape: 'coordinate', boxes: 2, ordered: true, values: parts };
    }
  }

  const ratio = s.split(/\s*:\s*/);
  if (ratio.length >= 2 && ratio.every(isValue)) {
    return { shape: 'ratio', boxes: ratio.length, ordered: true, values: ratio.map((r) => r.trim()) };
  }

  const pieces = splitTopLevel(s, ',');
  if (pieces.length >= 2 && pieces.every(isValue)) {
    return { shape: 'list', boxes: pieces.length, ordered: true, values: pieces.map((p) => p.trim()) };
  }

  if (parseQuantity(lower) !== null) return one('quantity');
  if (parseNumeric(lower) !== null) return one('number');

  // PROSE GOES TO THE WORD PATH BECAUSE IT IS PROSE, not because it fell past
  // every other test. The expression tests below ask only whether an operator is
  // present, and a hyphen is one — so "non-square" and "right-angled isosceles
  // triangle" were read as algebra, which the comparator cannot evaluate, and a
  // sentence quoting a value went the same way.
  if (isProse(s)) return one('word');

  if (/[=+\-*/^]/.test(s) && /[a-z]/i.test(s.replace(/\\[a-z]+/gi, ''))) return one('expression');
  if (/^\\?[a-z](\^|_|\()/i.test(s)) return one('expression');

  // A TeX MATH COMMAND IS MATHEMATICS. \frac{2}{\sqrt{29}} and
  // \sqrt[3]{\frac{3V}{4\pi}} carry no + - * / ^ = of their own, so the test
  // above read them as prose and the comparator never treated them as values.
  if (/\\[dt]?frac\b|\\sqrt\b|[\u221A\u221B\u221C]/.test(s)) return one('expression');

  return one('word');
}

/**
 * Box width in characters, from what the student TYPES, not the key's markup:
 * \\frac{9}{5} is eleven characters and 9/5 is three. The slot's longest value
 * sizes all of its boxes, so no box is a clue to its own answer's length.
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

export function boxWidthChars(reading: ShapeReading): number {
  const longest = Math.max(0, ...reading.values.map(typedLength));
  return Math.min(MAX_BOX_CHARS, Math.max(MIN_BOX_CHARS, longest));
}
