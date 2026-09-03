import { parseQuantity } from './quantity';
import { parseNumeric } from './equivalence';

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
 * bare() strips only the $ at the ENDS, so a split strands the inner ones
 * inside the values, in the boxes and in what the marker compares against. An
 * ESCAPED \$ is money and stays: the papers write \$1 860, which is a value.
 */
function tidyPiece(piece: string): string {
  return piece
    .replace(/(^|[^\\])\$/g, '$1')
    .replace(/^\\[,;!\s]+|\\[,;!\s]+$/g, '')
    .trim();
}

function splitTopLevel(s: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of s) {
    if ('([{'.includes(ch)) depth++;
    // Clamped: an unbalanced close must not make later separators read as top level.
    else if (')]}'.includes(ch)) depth = Math.max(0, depth - 1);
    if (ch === sep && depth <= 0) {
      out.push(current);
      current = '';
    } else current += ch;
  }
  out.push(current);
  return out.map(tidyPiece).filter(Boolean);
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
 * The contents of a leading bracket, but only when it closes at the very END.
 * "{1,2}" wraps; "{1,3}, {2,3}" does not — it is two groups side by side.
 */
function wrapped(s: string, open: '{' | '('): string | null {
  const close = open === '{' ? '}' : ')';
  const body = s.replace(/^\\?\s*/, '');
  if (!body.startsWith(open)) return null;
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        return body.slice(i + 1).replace(/^\\/, '').trim() === '' ? body.slice(1, i).replace(/\\$/, '') : null;
      }
    }
  }
  return null;
}

/**
 * Members that are each a group — (1,H) or {1,2} — flattened with boundaries
 * recorded. Null when they are plain values, which is the ordinary case.
 */
function asGroups(
  members: string[],
): { boxes: number; values: string[]; groups: number[]; groupKind: '(' | '{' } | null {
  if (members.length === 0) return null;
  const kinds = new Set<'(' | '{'>();
  const inner: string[][] = [];
  for (const m of members) {
    const paren = wrapped(m, '(');
    const brace = wrapped(m, '{');
    const body = paren ?? brace;
    if (body === null) return null;
    kinds.add(paren !== null ? '(' : '{');
    const parts = splitTopLevel(body, ',');
    if (parts.length < 2) return null; // a bracket round one value is not a group
    inner.push(parts);
  }
  if (kinds.size !== 1) return null;
  const values = inner.flat();
  return { boxes: values.length, values, groups: inner.map((g) => g.length), groupKind: [...kinds][0] };
}

export function readInputShape(rawAnswer: string): ShapeReading {
  const s = bare(rawAnswer);
  const lower = s.toLowerCase();

  // \binom{4}{-2} is a column vector too: the shorter way the papers and the
  // generator write a 2x1. Missing it renders a box asking for typed KaTeX.
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

  // A SET only when the outer brace wraps the WHOLE answer: on a LIST of sets
  // — {6,10}, {2,6,10} — a greedy match spans first brace to last and splits
  // on the commas inside them.
  const set = wrapped(s, '{');
  if (set !== null) {
    const members = splitTopLevel(set, ',');
    const grouped = asGroups(members);
    if (grouped) return { shape: 'set', ordered: false, ...grouped };
    return { shape: 'set', boxes: Math.max(1, members.length), ordered: false, values: members };
  }

  // The papers write an enumeration of subsets with no outer brace: {1,3},
  // {2,3}. Unordered, like the braced form it is shorthand for.
  const bare_groups = asGroups(splitTopLevel(s, ','));
  if (bare_groups && bare_groups.groups.length >= 2) {
    return { shape: 'set', ordered: false, ...bare_groups };
  }

  // "or" is how the papers write roots, and also an ordinary English word, so
  // the pieces must LOOK like roots — otherwise prose splits into boxes each
  // holding half a sentence, which the marker then compares against.
  if (/\bor\b/.test(lower)) {
    const roots = s.split(/\s+or\s+/i).map(tidyPiece).filter(Boolean);
    const rootish =
      roots.length >= 2 &&
      roots.every((r) => r.includes('=') && r.length <= 40 && r.split(/\s+/).length <= 6 && !/[.;]$/.test(r));
    if (rootish) return { shape: 'roots', boxes: roots.length, ordered: false, values: roots };
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

  if (/[=+\-*/^]/.test(s) && /[a-z]/i.test(s.replace(/\\[a-z]+/gi, ''))) return one('expression');
  if (/^\\?[a-z](\^|_|\()/i.test(s)) return one('expression');

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
