import { evaluate, parse, rationalize, simplify } from 'mathjs';
import { markMoney, normaliseDigitGroups } from '@/lib/money';
import { parseQuantity, parseQuantityProduct, productsEqual, sameDimension, UNIT_WORDS } from './quantity';
import { roundingOf, roundTo, type Rounding } from './rounding';

// Final-answer equivalence (ROUND_1 §6.3 and §4.3): documented deterministic
// heuristics, no LLM grading.

// Phone keyboards and copy-out-of-a-page insert zero-width joiners and
// non-breaking spaces. A wrong mark nothing on the screen explains is the
// worst kind, so these characters carry no weight here.
function stripInvisible(raw: string): string {
  return raw
    .replace(/[\u200b-\u200f\u2060\ufeff]/g, '')
    .replace(/[\u00a0\u2007\u2009\u202f]/g, ' ');
}

function preClean(raw: string): string {
  // Currency logic lives in lib/money.ts and nowhere else. Money is MARKED as a
  // unit, not stripped: deleting the currency made every amount a bare number,
  // so $70 matched 70 m.
  // SPACING COMMANDS FIRST, THEN THE GROUPING. "18\\ 000" is eighteen thousand,
  // but the grouper looks for a digit followed by a space or a comma and finds a
  // BACKSLASH, so it never fired; and it ran before the strip below, so even the
  // forms that strip cleanly were past saving by then. `\\ ` is a thin space and
  // `\\\\ ` is a matrix row separator followed by one, so only an unpaired
  // backslash is a space.
  const despaced = stripInvisible(raw).replace(/\\left|\\right|\\,|\\;|(?<!\\)\\ /g, '');
  const cleaned = normaliseDigitGroups(markMoney(despaced))
    .trim()
    .toLowerCase()
    .replace(/\$+/g, '') // KaTeX delimiters and bare dollar signs
    .replace(/\\text\{([^{}]*)\}/g, '$1') // \text{ and } wrappers carry no value
    // Authored answers are KaTeX, where a literal percent is \%. It is the same
    // sign, so unescaping it is what lets "10\%" match "10" and "10%".
    .replace(/\\%/g, '%')
    .replace(/\\[dt]frac\b/g, '\\frac') // display/inline fractions are one fraction
    .replace(/[−–]/g, '-') // unicode minus / en-dash
    // One spelling per relation, whichever notation the writer reached for.
    .replace(/\\mapsto|\\rightarrow|\\to\b|↦|→/g, '->')
    .replace(/\\neq?\b|≠/g, '!=')
    .replace(/⁻¹/g, '^{-1}')
    .replace(/[×·]|\\times|\\cdot/g, '*')
    .replace(/÷|\\div\b/g, '/')
    .replace(/\^\s*\{?\s*\\?circ\s*\}?/g, '°')
    .replace(/²/g, '^2') // unicode superscripts are exponents, not prose
    .replace(/³/g, '^3')
    .replace(/\s+/g, ' ')
    // A full stop at the end of a written answer is punctuation, not a value:
    // "No." and "No" are one answer. Only after a letter or a bracket, so a
    // decimal point is never touched.
    .replace(/([a-z)\]])\.$/, '$1')
    // A point named before its coordinates — O(0,0) — is the same point as
    // (0,0), exactly as "x = " in front of a value is the same value. Here and
    // not in stripLabel, which only ever sees one side of the comma.
    .replace(/^[a-z]\s*(\([^()]*,[^()]*\))$/, '$1')
    .trim();
  return rewritePositionalTimes(cleaned);
}

// The letter x is a multiplication sign only POSITIONALLY: every piece either
// side must be arithmetic carrying no letters, so "2^3 x 3" is a product while
// "2x + 5" and "2 x 3 grid" keep their x. Reading it that way anywhere else
// would turn every algebraic answer into arithmetic. quantity.ts applies the
// same rule one level up, for pieces that are quantities.
const ARITHMETIC_PIECE = /^[\d.^{}()\s*\/+-]*\d[\d.^{}()\s*\/+-]*$/;

function rewritePositionalTimes(s: string): string {
  const pieces = s.split(/\s+x\s+/);
  if (pieces.length < 2) return s;
  return pieces.every((p) => ARITHMETIC_PIECE.test(p.trim())) ? pieces.join(' * ') : s;
}

// Input is pre-cleaned, so digit grouping is already gone and every comma
// still standing is a separator. Requiring a space after it marked
// "18kg,27kg,36kg" wrong against the same list typed with the spacebar.
function splitParts(cleaned: string): string[] {
  return cleaned
    .split(/\s+or\s+|\s+and\s+|;|\n|,\s*/)
    .map(stripLabel)
    .filter((p) => p.length > 0);
}

// A name standing in front of a value: "P", "cost of one pineapple". Excludes
// digits, operators, braces and backslashes so an expression is never a label.
const LABEL_LIKE = /^[a-z][a-z\s_]{0,24}$/;

/** One letter standing alone: a name, not a value. */
const BARE_NAME = /^[a-z](?:\^\{?-1\}?)?$/;

// A function being defined or evaluated is a name too, and the answer is its
// right-hand side. Without this, "gf(4) = 6" and "6" read as different answers.
const DEFINITION_LHS = /^(?:[a-z](?:\^\{?-1\}?)?){1,4}(?:\((?:[^()]|\([^()]*\)){0,16}\))?$/;

// "f: x -> (x-1)/2" and "x ↦ (x-1)/2" define the same function as
// "f(x) = (x-1)/2"; the value is what the variable maps to.
function stripMapping(part: string): string {
  const i = part.indexOf('->');
  if (i < 0) return part;
  return /^[a-z]$/.test(part.slice(0, i).trim()) ? part.slice(i + 2).trim() : part;
}

/** Whether the right side is written in variables the left side is not. */
function inOtherVariables(lhs: string, rhs: string): boolean {
  const vars = freeVariables(toMathExpr(rhs));
  return vars !== null && vars.some((v) => v.toLowerCase() !== lhs.toLowerCase());
}

// The left side is discarded only when it actually looks like a label —
// otherwise "matrix = -PR" would throw away the matrix and keep the
// restatement, and "3s = 2(s + 250)" would lose half the equation.
function stripLabel(part: string): string {
  const p = part
    .trim()
    .replace(/^\(?[a-z]\)[\s.:]*/, '')
    // A point named before its coordinates — O(0,0) — is the same point as
    // (0,0), exactly as "x = " in front of a value is the same value. The comma
    // is what says these are coordinates and not a function being evaluated.
;
  for (const sep of ['=', ':']) {
    const i = p.indexOf(sep);
    if (i < 0) continue;
    const lhs = p.slice(0, i).trim();
    const rhs = p.slice(i + 1).trim();
    // "P = 30" is a value with a name on it. "h = d" is a RELATION between two
    // unknowns, and dropping its left side left "d" facing "h" — which is how a
    // scheme and its own accept list, the same relation written both ways round,
    // compared unequal. A bare name on both sides means neither is a label.
    //
    // A function being APPLIED is still a definition, whatever is on the right:
    // "ff^{-1}(x) = x" says the composition is the identity, and its answer is
    // what the chain ends at.
    const applied = DEFINITION_LHS.test(lhs) && lhs.includes('(');
    if (!applied && BARE_NAME.test(rhs)) break;
    // "y = 80x + 120" is an EQUATION, not a labelled expression: a bare
    // single-letter left side is a variable when the right side is written in
    // other variables. Stripping it made an equation into an expression, so
    // "y - 120 = 80x" — the same line rearranged — never reached the rule that
    // compares two equations, and a student who wrote it was refused.
    if (!applied && BARE_NAME.test(lhs) && inOtherVariables(lhs, rhs)) break;
    if (LABEL_LIKE.test(lhs) || DEFINITION_LHS.test(lhs)) {
      // Recurse: "f^{-1}(f(x)) = f(f^{-1}(x)) = x" is a chain of definitions
      // and the answer is what the chain ends at.
      return stripLabel(stripMapping(p.slice(i + 1).trim()));
    }
    break;
  }
  return stripMapping(p.trim());
}

// Returns null when the string is not cleanly numeric.
export function parseNumeric(raw: string): number | null {
  let s = normaliseDigitGroups(preClean(raw)).replace(/,/g, '');
  const eq = s.lastIndexOf('=');
  if (eq >= 0) s = s.slice(eq + 1).trim();
  let percent = false;
  if (s.endsWith('%')) {
    percent = true;
    s = s.slice(0, -1).trim();
  }
  const frac = s.match(/^-?\\frac\{(-?[\d.]+)\}\{(-?[\d.]+)\}$/);
  if (frac) {
    const sign = s.startsWith('-') ? -1 : 1;
    const v = (sign * Number(frac[1])) / Number(frac[2]);
    return Number.isFinite(v) ? (percent ? v / 100 : v) : null;
  }
  const mixed = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/);
  if (mixed) {
    const sign = mixed[1] === '-' ? -1 : 1;
    const v = sign * (Number(mixed[2]) + Number(mixed[3]) / Number(mixed[4]));
    return percent ? v / 100 : v;
  }
  const simple = s.match(/^(-?[\d.]+)\/(-?[\d.]+)$/);
  if (simple) {
    const v = Number(simple[1]) / Number(simple[2]);
    return Number.isFinite(v) ? (percent ? v / 100 : v) : null;
  }
  if (s === '') return null;
  // The numeric head of "72 cm", for callers that want a number and not what it
  // measures. Only units the quantity parser recognises are stripped: stripping
  // any trailing word made "5 pi" the number 5 and kept it off the algebra path
  // that knows pi. The degree sign is a unit that is not a letter and may be the
  // whole tail, so the character class admits it first as well.
  const unitTail = s.match(/^(-?[\d.]+(?: \d+\/\d+)?|-?[\d.]+\/[\d.]+)\s*[a-z°][a-z .°^\d]*$/);
  if (unitTail && parseQuantity(s) !== null) return parseNumeric(unitTail[1]);
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return percent ? n / 100 : n;
}

/** The numeric head of a quantity, before any unit conversion. */
function headOf(raw: string): number | null {
  const m = raw.trim().match(/^(-?\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

// EXACT unless the scheme's answer is itself rounded: two numbers agree at
// the stated rounding, and only there. A less-precise-wins rule accepted 26.5
// for 27 with nothing in the question asking for whole numbers; a blanket
// tolerance before it accepted 335 for 336. Representation error is always
// absorbed: 1000 x 1e-6 is 0.001.
function closeEnough(a: number, b: number, rounding: Rounding | null): boolean {
  if (a === b) return true;
  if (Math.abs(a - b) <= Math.max(1e-9, Math.max(Math.abs(a), Math.abs(b)) * 1e-9)) return true;
  if (!rounding) return false;
  return roundTo(a, rounding) === roundTo(b, rounding);
}


/**
 * \frac and \sqrt, INNERMOST FIRST AND REPEATEDLY. The braces nest and a single
 * pass of `[^{}]+` cannot see past them: \frac{2}{\sqrt{29}} left the fraction
 * unconverted, mathjs was handed `frac{2}{sqrt(29)}`, and the value never became
 * a number. A surd alone evaluated, a fraction alone evaluated, and the two
 * together did not — so a unit vector written the way a mark scheme writes one
 * could not be compared with anything, including its own accept list.
 *
 * Each pass converts the groups that are now brace-free, which makes the next
 * one visible; it stops when nothing changes.
 */
export function expandNestedCommands(s: string): string {
  let out = s;
  for (let pass = 0; pass < 12; pass++) {
    const next = out
      .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
      .replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)');
    if (next === out) break;
    out = next;
  }
  return out;
}

/**
 * Names mathjs owns. Everything else that is two letters or more is a PRODUCT
 * of its letters: a mark scheme writes gT^2 for g times T squared, and the
 * parser read `gT` as one symbol, so gT^2 and T^2g — the same product, written
 * two ways — could not be compared. Splitting is not safe for a name, so the
 * names are listed.
 */
const KNOWN_NAMES = new Set([
  'sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'asin', 'acos', 'atan', 'atan2',
  'sinh', 'cosh', 'tanh', 'log', 'log10', 'log2', 'ln', 'exp', 'sqrt', 'cbrt',
  'nthroot', 'abs', 'sign', 'round', 'floor', 'ceil', 'mod', 'min', 'max',
  'pi', 'tau', 'inf', 'nan', 'true', 'false',
]);

/** A name, not a product: cm is a centimetre and 16th is an ordinal. */
function isName(run: string): boolean {
  const lower = run.toLowerCase();
  return KNOWN_NAMES.has(lower) || UNIT_WORDS.has(lower) || /^(st|nd|rd|th)$/.test(lower);
}

export function splitAdjacentSymbols(s: string): string {
  // M(M-2) is M times (M-2), not a call of M — mathjs reads it as a call and
  // throws, so a factorised form could not be compared with an expanded one.
  // ONE LETTER ONLY: a longer run in front of a bracket is a name, and gf(t) is
  // f then g, whose order a product would throw away.
  const called = s.replace(/(^|[^a-zA-Z\\])([a-zA-Z])\s*\(/g, (whole, lead: string, name: string) =>
    KNOWN_NAMES.has(name.toLowerCase()) ? whole : `${lead}${name}*(`);

  return called.replace(/[a-zA-Z]{2,}/g, (run: string, offset: number) => {
    if (isName(run)) return run;
    // A run behind a backslash is a KaTeX command — \leq, \in, \mathbb — and a
    // command name is a name whatever letters it is spelt with.
    if (called[offset - 1] === '\\') return run;
    // CONTEXT, or prose becomes algebra: "obtuse angle" split letter by letter
    // would read as mathematics and reach mathjs, which is what the prose guard
    // exists to prevent. A run is a product only where it touches arithmetic.
    const before = called[offset - 1] ?? '';
    const after = called[offset + run.length] ?? '';
    // A hyphen joins words ("x-intercept", "right-angled") far more often than
    // it multiplies, and a plus is a sign; neither makes a letter run a product.
    // Nor does a brace, which groups a fraction and delimits a set: {red, blue}
    // is three colours. What does: a power, an operator, a bracket, or a digit.
    const touchesMath = /[*/^([\d]/.test(before) || /[*/^)\]\d]/.test(after);
    return touchesMath ? run.split('').join('*') : run;
  });
}

function toMathExpr(s: string): string {
  return splitAdjacentSymbols(expandNestedCommands(s)
    .replace(/\^\s*\{([^{}]+)\}/g, '^($1)') // 10^{-5}: mathjs wants parentheses
    .replace(/√\s*\(?([\d.a-z]+)\)?/g, 'sqrt($1)')
    .replace(/\\pi|π/g, 'pi')).replace(/\\/g, '');
}

// "a = b" becomes "(a) - (b)", so two forms of one equation ("3s = 2(s + 250)"
// and "3s = 2s + 500") reduce to the same expression.
function asDifference(expr: string): string {
  const sides = expr.split('=');
  return sides.length === 2 ? `(${sides[0]}) - (${sides[1]})` : expr;
}

// Names mathjs resolves itself; everything else in an expression is a free
// variable the student chose.
const MATH_CONSTANTS = new Set(['pi', 'e', 'i', 'tau', 'phi', 'infinity']);

// The free variables of an expression, or null if it will not parse.
function freeVariables(expr: string): string[] | null {
  try {
    const names = new Set<string>();
    parse(expr).traverse((node: unknown, _path: string, parent: unknown) => {
      const n = node as { isSymbolNode?: boolean; name?: string };
      const p = parent as { isFunctionNode?: boolean; fn?: unknown } | null;
      if (!n.isSymbolNode || !n.name) return;
      if (p?.isFunctionNode && p.fn === node) return; // "sqrt" is not a variable
      if (!MATH_CONSTANTS.has(n.name.toLowerCase())) names.add(n.name);
    });
    return [...names];
  } catch {
    return null;
  }
}

// Irrational-ish and spread over both signs: two different expressions agree
// at 0, 1 and 2 by coincidence far more easily than they agree here.
const SAMPLE_POINTS = [0.7371, 1.4142, 2.6458, -1.2361, 3.3166, -2.2360, 4.7958];

// Equality of functions, not a student rounding, so the tolerance is float
// noise and nothing more.
function sameToFloatNoise(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(Math.abs(a), Math.abs(b), 1) * 1e-9;
}

// null means "could not tell" — never "not equal".
function sampledEquivalent(ea: string, eb: string, vars: string[]): boolean | null {
  let agreed = 0;
  for (const base of SAMPLE_POINTS) {
    const scope: Record<string, number> = {};
    // Each variable gets its own value, or "x + y" and "2x" would agree.
    vars.forEach((v, j) => {
      scope[v] = base + j * 0.6180;
    });
    let va: unknown;
    let vb: unknown;
    try {
      va = evaluate(ea, { ...scope });
      vb = evaluate(eb, { ...scope });
    } catch {
      continue; // this point is outside a domain (log, sqrt, /0) — try the next
    }
    if (typeof va !== 'number' || typeof vb !== 'number') return null;
    if (!Number.isFinite(va) || !Number.isFinite(vb)) continue;
    if (!sameToFloatNoise(va, vb)) return false;
    agreed++;
  }
  return agreed >= 3 ? true : null;
}

// Returns null when it cannot decide. Expressions with a variable are compared
// by SAMPLING, because rationalize() answers a question about strings and
// reported an expression not equivalent to ITSELF over a 2.2e-16 residue. So
// rationalize and simplify are trusted ASYMMETRICALLY: '0' proves equality, a
// non-zero residue proves nothing. A symbolic engine never returns false here.
/**
 * TWO EQUATIONS SAY THE SAME THING when one side's difference is a non-zero
 * multiple of the other's. 6m + 24 = 90 and 6m = 66 are one equation written
 * twice; so are 0.75p = 360 and 75p = 36 000, h = x and x = h, and
 * P = M^2 - 2M and P = M(M - 2). Comparing the differences for EQUALITY caught
 * only the last of those, which is why a mark scheme and its own accept list
 * could disagree.
 *
 * A constant ratio across samples is the whole test. Zero on one side and not
 * the other is a real difference; an identically-zero equation proves nothing
 * and stays undecided.
 */
function proportional(ea: string, eb: string, vars: string[]): boolean | null {
  const ratios: number[] = [];
  let sawNonZero = false;
  for (const base of SAMPLE_POINTS) {
    const scope: Record<string, number> = {};
    vars.forEach((v, j) => (scope[v] = base + j * 0.618));
    let va: unknown;
    let vb: unknown;
    try {
      va = evaluate(ea, { ...scope });
      vb = evaluate(eb, { ...scope });
    } catch {
      continue;
    }
    if (typeof va !== 'number' || typeof vb !== 'number') return null;
    if (!Number.isFinite(va) || !Number.isFinite(vb)) continue;
    if (Math.abs(vb) < 1e-9) {
      if (Math.abs(va) > 1e-6) return false;
      continue;
    }
    ratios.push(va / vb);
    if (Math.abs(va) > 1e-9) sawNonZero = true;
  }
  if (ratios.length < 3 || !sawNonZero) return null;
  const k = ratios[0];
  if (Math.abs(k) < 1e-9) return false;
  return ratios.every((r) => Math.abs(r - k) <= 1e-6 * Math.max(1, Math.abs(k)));
}

/** "A = 5x" as the student may answer it, with the name left off. */
function withoutName(s: string): string | null {
  const i = s.indexOf('=');
  if (i < 0) return null;
  return BARE_NAME.test(s.slice(0, i).trim()) ? s.slice(i + 1).trim() : null;
}

function mathEquivalent(a: string, b: string, rounding: Rounding | null): boolean | null {
  const bothEquations = a.includes('=') && b.includes('=');
  // A named quantity is still a name the student may leave off: "A = 5x" is
  // answered by "5x". Only against a side that is NOT an equation — two
  // equations are statements and are compared whole, below.
  if (!bothEquations) {
    const ra = withoutName(a);
    const rb = withoutName(b);
    if (ra !== null && rb === null) return mathEquivalent(ra, b, rounding);
    if (rb !== null && ra === null) return mathEquivalent(a, rb, rounding);
  }
  const ea = toMathExpr(bothEquations ? asDifference(a) : a);
  const eb = toMathExpr(bothEquations ? asDifference(b) : b);

  const va = freeVariables(ea);
  const vb = freeVariables(eb);
  if (va === null || vb === null) return null;
  const vars = [...new Set([...va, ...vb])];

  if (vars.length === 0) {
    try {
      const na = evaluate(ea);
      const nb = evaluate(eb);
      if (typeof na === 'number' && typeof nb === 'number') return closeEnough(na, nb, rounding);
    } catch {
      // not something mathjs can evaluate — fall through
    }
  } else {
    // An equation is a statement, not a value: scaling both sides leaves it
    // saying the same thing, so the differences are compared up to a factor.
    if (bothEquations) {
      const scaled = proportional(ea, eb, vars);
      if (scaled !== null) return scaled;
    }
    const sampled = sampledEquivalent(ea, eb, vars);
    if (sampled !== null) return sampled;
  }

  // rationalize expands polynomials to canonical form (simplify alone does
  // not distribute, so "2(x-2)" vs "2x-4" would not reduce to 0).
  try {
    if (rationalize(`(${ea}) - (${eb})`).toString() === '0') return true;
  } catch {
    // non-polynomial (surds, functions) — try plain simplification
  }
  try {
    if (simplify(`(${ea}) - (${eb})`).toString() === '0') return true;
  } catch {
    return null;
  }
  return null;
}

// Generic nouns that never distinguish two answers ("obtuse" vs "obtuse
// angle" is one answer). Never strip an answer down to nothing.
const GENERIC_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'of',
  'angle', 'angles', 'degree', 'degrees', 'unit', 'units',
]);

function contentTokens(s: string): string[] {
  const all = s
    .replace(/[^a-z0-9°/.\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const kept = all.filter((t) => !GENERIC_WORDS.has(t));
  return kept.length > 0 ? kept : all;
}

// Short classification answers must match on content words exactly, so "acute"
// against "exterior" still fails. Sentence-length justifications are reworded
// freely by an independent solver, so they match on content-word overlap.
function wordsEquivalent(a: string, b: string): boolean {
  const ta = contentTokens(a);
  const tb = contentTokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  if ([...ta].sort().join(' ') === [...tb].sort().join(' ')) return true;

  // Two prose answers quoting different numbers are different answers. Without
  // this, an answer with a wrong value appended reads as a superset of the
  // right one — which is how a deliberately poisoned draft passed this gate.
  const numbers = (t: string[]) => t.filter((x) => /\d/.test(x)).sort().join(' ');
  if (numbers(ta) !== numbers(tb)) return false;

  const setA = new Set(ta);
  const setB = new Set(tb);
  const [small, large] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
  let shared = 0;
  for (const t of small) if (large.has(t)) shared++;

  // One side adding a qualifier the other omits ("hexagon" / "regular
  // hexagon") is one answer at mark-scheme level. Disjoint answers are not.
  if (shared === small.size) return true;

  if (ta.length >= 4 || tb.length >= 4) {
    return shared / Math.max(setA.size, setB.size) >= 0.6;
  }
  return false;
}

// Prose is not algebra: mathjs reads "obtuse angle" as implicit multiplication
// and rationalize() returns garbage that would read as "not equivalent", so the
// symbolic path runs only when both sides look mathematical.
export function looksMathematical(s: string): boolean {
  // Adjacent letters beside arithmetic are a product, not a word: gT^2 is g
  // times T squared, and reading it as prose kept the whole expression out of
  // the symbolic path. The question is asked of the form the symbolic path
  // receives, so the gate and the parse cannot disagree about what a string is.
  const bare = toMathExpr(s).replace(/sqrt|frac|pi|text|cdot|times/g, '');
  return !/[a-z]{2,}/.test(bare);
}

function valueEquivalent(a: string, b: string, rounding: Rounding | null): boolean {
  const close = (x: number, y: number) => closeEnough(x, y, rounding);
  // QUANTITIES FIRST, and decisively: if either side carries a unit the numeric
  // path below must not see it, because that path drops the unit — which is how
  // 72 cm came to equal 72 m. A product of quantities is tried before a single
  // one, since each side of a product is a quantity too.
  const pa = parseQuantityProduct(a);
  const pb = parseQuantityProduct(b);
  if (pa && pb) return productsEqual(pa, pb, close);
  if (pa || pb) return false;

  const qa = parseQuantity(a);
  const qb = parseQuantity(b);
  if (qa && qb) return sameDimension(qa, qb) && close(qa.value, qb.value);
  if (qa || qb) {
    // A bare number is accepted against a unit when the values agree: the
    // question supplied the unit, so omitting it is not a mathematical error.
    // Anything else carrying no unit is not a number, and is not equal.
    const quantity = (qa ?? qb)!;
    const other = parseNumeric(qa ? b : a);
    if (other === null) return false;
    const asWritten = headOf(qa ? a : b);
    return close(other, quantity.value) || (asWritten !== null && close(other, asWritten));
  }

  // AN EQUATION IS NOT ITS RIGHT-HAND SIDE. parseNumeric reads the value after
  // the last "=", which is right for "x = 5" and wrong for two equations:
  // "6m + 24 = 90" against "6m = 66" was compared as 90 against 66, so the
  // statement was never looked at and the symbolic path never ran.
  const bothEquations = a.includes('=') && b.includes('=');
  const na = bothEquations ? null : parseNumeric(a);
  const nb = bothEquations ? null : parseNumeric(b);
  if (na !== null && nb !== null) return close(na, nb);
  if (looksMathematical(a) && looksMathematical(b)) {
    const m = mathEquivalent(a, b, rounding);
    if (m !== null) return m;
  }
  // both sides are already pre-cleaned/label-stripped
  return a === b || wordsEquivalent(a, b);
}

// True when two answers are equivalent. Multi-part answers ("x = -1/3 or
// x = 2", "EC$70; EC$58") match as unordered sets of equivalent values.
// `rounding` undefined means the default: 3 s.f. when either side cannot
// terminate — the scheme's third, or a student's exact surd against a scheme
// that rounded it — and exact otherwise. null means exact.
export function answersEquivalent(a: string, b: string, rounding?: Rounding | null): boolean {
  if (rounding === undefined) rounding = roundingOf({ canonical: b }) ?? roundingOf({ canonical: a });
  const partsA = splitParts(preClean(a));
  const partsB = splitParts(preClean(b));
  if (partsA.length === 0 || partsB.length === 0) return false;

  if (partsA.length !== partsB.length) {
    // Different part counts: only a whole-string comparison can save it.
    return valueEquivalent(stripLabel(preClean(a)), stripLabel(preClean(b)), rounding);
  }

  const used = new Array<boolean>(partsB.length).fill(false);
  for (const pa of partsA) {
    const idx = partsB.findIndex((pb, i) => !used[i] && valueEquivalent(pa, pb, rounding));
    if (idx === -1) return false;
    used[idx] = true;
  }
  return true;
}

// The single entry point for grading and the solve gate. Synonymy lives in the
// question's accept list, as on a real mark scheme, never in heuristics here.
export function answersEquivalentAny(
  candidate: string,
  canonical: string,
  accept?: string[],
  rounding?: Rounding | null,
): boolean {
  if (answersEquivalent(candidate, canonical, rounding)) return true;
  return (accept ?? []).some((alt) => answersEquivalent(candidate, alt, rounding));
}
