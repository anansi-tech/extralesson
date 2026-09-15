// THE BRACKETS AND SEPARATORS AN ANSWER IS WRITTEN WITH, and the one thing
// they decide on their own: WHETHER ORDER IS PART OF THE ANSWER. A coordinate,
// a column vector and an ordered pair are ordered by definition; a set and a
// list of roots are not.
//
// It sits below equivalence.ts so the comparator can ask the same question the
// shape reader asks, rather than keeping a second opinion. Matching every
// answer as an unordered set is what let (2,1) be marked as (1,2).

/** KaTeX dressing removed, so the shape underneath is visible. */
export function bare(raw: string): string {
  return raw
    .trim()
    .replace(/^\$+|\$+$/g, '')
    .replace(/\\left\b|\\right\b|\\,|\;|\\!/g, '')
    .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, '$1')
    .replace(/\\[dt]frac/g, '\\frac')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .trim();
}

export const NUMBERISH = /^-?\d+(?:\.\d+)?(?:\s*\/\s*-?\d+(?:\.\d+)?)?$/;

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

export function splitTopLevel(s: string, sep: string): string[] {
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
 * The contents of a leading bracket, but only when it closes at the very END.
 * "{1,2}" wraps; "{1,3}, {2,3}" does not — it is two groups side by side.
 */
export function wrapped(s: string, open: '{' | '(' | '['): string | null {
  const close = open === '{' ? '}' : open === '(' ? ')' : ']';
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
 * The contents of the brace group starting at `from`, and where it ends.
 * \binom{\frac{3}{5}}{\frac{4}{5}} nests, and a single [^{}]* pass stops at the
 * first inner brace — so a column vector of fractions was not read as one and
 * rendered a box asking the student to type KaTeX.
 */
export function braceAt(s: string, from: number): { body: string; end: number } | null {
  let i = from;
  while (s[i] === ' ') i++;
  if (s[i] !== '{') return null;
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') depth++;
    else if (s[j] === '}' && --depth === 0) return { body: s.slice(i + 1, j), end: j + 1 };
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

/** How an answer says its members do not come in an order, or null. */
export interface Unordered {
  shape: 'set' | 'roots';
  values: string[];
  groups?: number[];
  groupKind?: '(' | '{';
}

// "or" is how the papers write roots, and also an ordinary English word, so
// the pieces must LOOK like roots — otherwise prose splits into boxes each
// holding half a sentence, which the marker then compares against.
function rootsSeparatedByOr(s: string): string[] | null {
  if (!/\bor\b/i.test(s)) return null;
  const roots = s.split(/\s+or\s+/i).map(tidyPiece).filter(Boolean);
  const rootish =
    roots.length >= 2 &&
    roots.every((r) => r.includes('=') && r.length <= 40 && r.split(/\s+/).length <= 6 && !/[.;]$/.test(r));
  return rootish ? roots : null;
}

/**
 * "x = -1, 3" is two roots with the name written once, which is how the papers
 * write them and how a student copies them down. Read as a LIST it was ordered,
 * so a student who gave the same two roots the other way round was refused.
 *
 * Only the first piece carries a name; anything later that carries one is a
 * different kind of answer — "x = 2, y = 3" names two quantities, and which is
 * which is the answer.
 */
function rootsSeparatedByComma(s: string): string[] | null {
  const pieces = splitTopLevel(s, ',');
  if (pieces.length < 2) return null;
  if (!/^[a-z]\s*=\s*\S/i.test(pieces[0])) return null;
  return pieces.slice(1).every((p) => NUMBERISH.test(p)) ? pieces : null;
}

/**
 * Whether this answer's members carry no order — the ONE source of that fact.
 * readInputShape sets `ordered` from it and the comparator asks it directly,
 * so the two cannot come to different conclusions about the same string.
 */
export function unorderedReading(s: string): Unordered | null {
  // A SET only when the outer brace wraps the WHOLE answer: on a LIST of sets
  // — {6,10}, {2,6,10} — a greedy match spans first brace to last and splits
  // on the commas inside them.
  const set = wrapped(s, '{');
  if (set !== null) {
    const members = splitTopLevel(set, ',');
    const grouped = asGroups(members);
    if (grouped) return { shape: 'set', values: grouped.values, groups: grouped.groups, groupKind: grouped.groupKind };
    return { shape: 'set', values: members.length ? members : [s] };
  }

  // The papers write an enumeration of subsets with no outer brace: {1,3},
  // {2,3}. Unordered, like the braced form it is shorthand for.
  const bareGroups = asGroups(splitTopLevel(s, ','));
  if (bareGroups && bareGroups.groups.length >= 2) {
    return { shape: 'set', values: bareGroups.values, groups: bareGroups.groups, groupKind: bareGroups.groupKind };
  }

  const roots = rootsSeparatedByOr(s) ?? rootsSeparatedByComma(s);
  return roots ? { shape: 'roots', values: roots } : null;
}

/** Whether where a value sits is part of the answer. */
export function carriesOrder(rawAnswer: string): boolean {
  return unorderedReading(bare(rawAnswer)) === null;
}

/**
 * The rows of a matrix, cell by cell, or null. \binom is the two-row column
 * vector written short, so it reads as one here too.
 *
 * The comparator and the shape reader both need this, and for the same reason:
 * a matrix is its elements IN ORDER, and anything that reads it as one blob
 * compares it as words — which said a matrix equalled itself reversed.
 */
export function matrixRows(s: string): string[][] | null {
  const binom = s.match(/\\[dt]?binom/);
  if (binom) {
    const top = braceAt(s, binom.index! + binom[0].length);
    const bottom = top && braceAt(s, top.end);
    if (top && bottom) return [[top.body.trim()], [bottom.body.trim()]];
  }
  const grid = s.match(/\\begin\{[bp]matrix\}([\s\S]*?)\\end\{[bp]matrix\}/);
  if (!grid) return null;
  const rows = grid[1].split(/\\\\/).map((r) => r.trim()).filter(Boolean);
  if (rows.length === 0) return null;
  return rows.map((r) => r.split('&').map((c) => c.trim()));
}

/**
 * A bracketed list of cells in reading order: "[9, 2]" and "(4, -2)".
 *
 * The first of those is what composeAnswer writes a matrix back as, so it is a
 * spelling of a matrix that the APP ITSELF produces — and a comparator that
 * cannot read its own output marks a student wrong for using the boxes.
 */
export function bracketedCells(s: string): string[] | null {
  const body = wrapped(s, '[') ?? wrapped(s, '(');
  if (body === null) return null;
  const cells = splitTopLevel(body, ',');
  return cells.length >= 2 ? cells : null;
}
