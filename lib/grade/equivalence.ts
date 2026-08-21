import { evaluate, parse, rationalize, simplify } from 'mathjs';
import { markMoney, normaliseDigitGroups } from '@/lib/money';
import { parseQuantity, parseQuantityProduct, productsEqual, sameDimension } from './quantity';

// Final-answer equivalence check (ROUND_1 §6.3 and §4.3).
// Deliberately simple, documented heuristics — no LLM grading in Round 1.
//
// Strategy: split each answer into parts (multi-root / multi-part answers),
// strip labels and "x =" prefixes, then match parts as an unordered set.
// Each pair is compared numerically (with tolerance), then canonically via
// mathjs (fractions, surds, equivalent algebraic forms), then as normalized
// strings.

// Characters a student cannot see and did not mean to send. A phone keyboard,
// a copy out of a rendered page and some autocomplete engines all insert zero-
// width joiners and non-breaking spaces, and a stored attempt was marked wrong
// for a trailing U+200B on an otherwise correct list. Invisible is the worst
// kind of wrong mark: nothing the student can look at explains it.
//
// Zero-width characters carry no meaning here and go. The various fixed-width
// spaces are spaces and become one.
function stripInvisible(raw: string): string {
  return raw
    .replace(/[\u200b-\u200f\u2060\ufeff]/g, '')
    .replace(/[\u00a0\u2007\u2009\u202f]/g, ' ');
}

// Normalize: trim, lowercase, strip KaTeX/currency dressing, unify minus
// signs and multiplication symbols, collapse whitespace.
function preClean(raw: string): string {
  // Money and thousands grouping are understood in lib/money.ts, nowhere else:
  // the J$80 bug came from currency logic living in three places at once.
  // Money is MARKED, not stripped: deleting the currency made every amount a
  // bare number, so $70 matched 70 m. markMoney rewrites it as a unit the
  // quantity parser understands; the bare $ that follows is a KaTeX delimiter
  // and is still removed below.
  const cleaned = normaliseDigitGroups(markMoney(stripInvisible(raw)))
    .trim()
    .toLowerCase()
    .replace(/\\left|\\right|\\,|\\;/g, '')
    .replace(/\$+/g, '') // KaTeX delimiters and bare dollar signs
    .replace(/\\text\{([^{}]*)\}/g, '$1') // \text{ and } wrappers carry no value
    .replace(/\\[dt]frac\b/g, '\\frac') // display/inline fractions are one fraction
    .replace(/[−–]/g, '-') // unicode minus / en-dash
    // One spelling per relation, whichever notation the writer reached for.
    .replace(/\\mapsto|\\rightarrow|\\to\b|↦|→/g, '->')
    .replace(/\\neq?\b|≠/g, '!=')
    .replace(/⁻¹/g, '^{-1}')
    .replace(/[×·]|\\times|\\cdot/g, '*')
    .replace(/÷|\\div\b/g, '/')
    .replace(/\^\s*\{?\s*\\?circ\s*\}?/g, '°') // KaTeX degrees: ^\circ, ^{\circ}
    .replace(/²/g, '^2') // unicode superscripts are exponents, not prose
    .replace(/³/g, '^3')
    .replace(/\s+/g, ' ')
    .trim();
  return rewritePositionalTimes(cleaned);
}

// The letter x is a multiplication sign when the phone keyboard in a student's
// hand has no x symbol on it. It is only ever read that way POSITIONALLY:
// every piece either side must be arithmetic carrying no letters of its own,
// so "2^3 x 3" is a product while "2x + 5", "y = 2 x" and "2 x 3 grid" keep
// their x untouched. Substituting x for * anywhere else would turn every
// algebraic answer into arithmetic.
//
// lib/grade/quantity.ts applies the same positional rule one level up, where
// the pieces are quantities ("8 m x 6 m") rather than bare numbers. Both are
// needed: that one requires a unit on both sides, and a prime factorisation
// has none.
const ARITHMETIC_PIECE = /^[\d.^{}()\s*\/+-]*\d[\d.^{}()\s*\/+-]*$/;

function rewritePositionalTimes(s: string): string {
  const pieces = s.split(/\s+x\s+/);
  if (pieces.length < 2) return s;
  return pieces.every((p) => ARITHMETIC_PIECE.test(p.trim())) ? pieces.join(' * ') : s;
}

// Split a (pre-cleaned) answer into independent parts: roots, or the answers
// to (a)/(b)/(c) sub-parts.
//
// The comma needs no space after it. It used to, so that a thousands separator
// ("1,200") survived — but preClean has already run normaliseDigitGroups by
// this point and digit grouping is gone, so every comma still standing here is
// a separator. Requiring the space marked "18kg,27kg,36kg" wrong against
// "18 kg, 27 kg, 36 kg", which is the same list typed without the spacebar.
function splitParts(cleaned: string): string[] {
  return cleaned
    .split(/\s+or\s+|\s+and\s+|;|\n|,\s*/)
    .map(stripLabel)
    .filter((p) => p.length > 0);
}

// A name standing in front of a value: "P", "x", "cost of one pineapple".
// Deliberately excludes anything with digits, operators, braces or backslashes
// so an expression is never mistaken for a label.
const LABEL_LIKE = /^[a-z][a-z\s_]{0,24}$/;

// The other thing that stands in front of a value: a function being defined or
// evaluated — "f(x)", "gf(4)", "f^{-1}(x)", "ff^{-1}(x)". These are names too,
// and the answer is the right-hand side, exactly as with "cost = 5". Without
// this, "gf(4) = 6" and "6" read as different answers.
// A chain of function-name atoms — each a single letter, optionally inverted —
// with an optional argument list: "f", "gf(4)", "f^{-1}(x)", "ff^{-1}(x)",
// "f^{-1}(f(x))".
const DEFINITION_LHS = /^(?:[a-z](?:\^\{?-1\}?)?){1,4}(?:\((?:[^()]|\([^()]*\)){0,16}\))?$/;

// "f: x -> (x-1)/2" and "x ↦ (x-1)/2" define the same function as
// "f(x) = (x-1)/2"; the value is what the variable maps to.
function stripMapping(part: string): string {
  const i = part.indexOf('->');
  if (i < 0) return part;
  return /^[a-z]$/.test(part.slice(0, i).trim()) ? part.slice(i + 2).trim() : part;
}

// Strip leading part labels ("(a)", "b)") and naming prefixes: for a part like
// "small bag = 5" or "plantain: 10", the value is what follows the separator.
// The left side is only discarded when it actually looks like a label —
// otherwise "matrix = -PR" would throw away the matrix and keep the
// restatement, and "3s = 2(s + 250)" would lose half the equation.
function stripLabel(part: string): string {
  const p = part.trim().replace(/^\(?[a-z]\)[\s.:]*/, '');
  for (const sep of ['=', ':']) {
    const i = p.indexOf(sep);
    if (i < 0) continue;
    const lhs = p.slice(0, i).trim();
    if (LABEL_LIKE.test(lhs) || DEFINITION_LHS.test(lhs)) {
      // Recurse: "f^{-1}(f(x)) = f(f^{-1}(x)) = x" is a chain of definitions
      // and the answer is what the chain ends at.
      return stripLabel(stripMapping(p.slice(i + 1).trim()));
    }
    break;
  }
  return stripMapping(p.trim());
}

// Parse a number from common student notations: "0.5", "-1/3", "1 1/2",
// "50%", "$1,200", "EC$70", "\frac{1}{4}". Returns null when not cleanly
// numeric.
export function parseNumeric(raw: string): number | null {
  let s = normaliseDigitGroups(preClean(raw)).replace(/,/g, '');
  const eq = s.lastIndexOf('=');
  if (eq >= 0) s = s.slice(eq + 1).trim();
  let percent = false;
  if (s.endsWith('%')) {
    percent = true;
    s = s.slice(0, -1).trim();
  }
  // KaTeX fraction: \frac{a}{b}
  const frac = s.match(/^-?\\frac\{(-?[\d.]+)\}\{(-?[\d.]+)\}$/);
  if (frac) {
    const sign = s.startsWith('-') ? -1 : 1;
    const v = (sign * Number(frac[1])) / Number(frac[2]);
    return Number.isFinite(v) ? (percent ? v / 100 : v) : null;
  }
  // Mixed number: "1 1/2"
  const mixed = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/);
  if (mixed) {
    const sign = mixed[1] === '-' ? -1 : 1;
    const v = sign * (Number(mixed[2]) + Number(mixed[3]) / Number(mixed[4]));
    return percent ? v / 100 : v;
  }
  // Simple fraction: "-1/3"
  const simple = s.match(/^(-?[\d.]+)\/(-?[\d.]+)$/);
  if (simple) {
    const v = Number(simple[1]) / Number(simple[2]);
    return Number.isFinite(v) ? (percent ? v / 100 : v) : null;
  }
  if (s === '') return null;
  // Number followed by a REAL unit ("72 cm", "500 ml"): the numeric head, for
  // callers that need a number — the format checks, which ask how many decimal
  // places an answer carries and do not care what it measures.
  //
  // Only units the quantity parser recognises are stripped. It used to strip
  // any trailing word, which made "5 pi" the number 5 and stopped it ever
  // reaching the algebra path that knows pi is 3.14159. Equivalence no longer
  // reaches here for quantities at all — it compares them dimensionally first.
  // The degree sign is a unit that is not a letter, and it may be the whole
  // tail — "67°" — so the class has to admit it in first position too.
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

// How close is the same number: AGREEMENT TO THE PRECISION THAT WAS WRITTEN.
//
// This was a blanket 0.5% relative tolerance, which accepted 335 for 336. That
// forgives exactly what CXC penalises — the papers ask for three significant
// figures, or one decimal place on an angle, and the mark scheme pays for
// getting it right.
//
// Exactness is not the answer either, and the format round-trips say why. When
// a question demands a form, the canonical answer is the ROUNDED value and a
// student who writes the unrounded one has done the mathematics correctly:
// 12.68 against a canonical 12.7 keeps the value marks and loses only the mark
// written for the form (R1.7 §B4). Exact comparison would take everything.
//
// So two numbers agree when they agree to the precision of the less precise of
// them — which is what "correct to 3 s.f." means, and what a human marker does.
// 12.68 and 12.7 agree to three figures. 335 and 336 do not agree to three.
//
// One guard: a value carrying a single significant figure is compared exactly.
// At that precision the rule is too coarse to mean anything — 3.4 rounds to 3 —
// and an integer answer is the common case.
function significantDigits(n: number): number {
  const mantissa = Math.abs(n).toExponential().split('e')[0].replace('.', '').replace(/0+$/, '');
  return Math.max(1, mantissa.length);
}

function closeEnough(a: number, b: number): boolean {
  if (a === b) return true;
  // Representation error FIRST, before anything reasons about precision. A
  // unit conversion computes 1000 x 1e-6 and gets 0.001 with a tail, which
  // carries seventeen significant digits and one real one — the guard below
  // would read that as a single-figure answer and refuse it.
  if (Math.abs(a - b) <= Math.max(1e-9, Math.max(Math.abs(a), Math.abs(b)) * 1e-9)) return true;
  if (a === 0 || b === 0) return false;
  const precision = Math.min(significantDigits(a), significantDigits(b));
  if (precision < 2) return false;
  return Number(a.toPrecision(precision)) === Number(b.toPrecision(precision));
}


// Rewrite KaTeX-isms into mathjs syntax.
function toMathExpr(s: string): string {
  return s
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))')
    .replace(/\^\s*\{([^{}]+)\}/g, '^($1)') // 10^{-5}: mathjs wants parentheses
    .replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)')
    .replace(/√\s*\(?([\d.a-z]+)\)?/g, 'sqrt($1)')
    .replace(/\\pi|π/g, 'pi')
    .replace(/\\/g, '');
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

// Sampling points for the free variables. Deliberately irrational-ish and
// spread over both signs: two different expressions can agree at 0, 1 and 2 by
// coincidence far more easily than they can agree here.
const SAMPLE_POINTS = [0.7371, 1.4142, 2.6458, -1.2361, 3.3166, -2.2360, 4.7958];

// Two expressions are the same function when they agree wherever they are
// evaluated. This is a question about equality of functions, not about a
// student rounding, so the tolerance is float noise and nothing more.
function sameToFloatNoise(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(Math.abs(a), Math.abs(b), 1) * 1e-9;
}

// Do two expressions agree at enough sample points to call them equal?
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

// Canonical comparison via mathjs. Returns null when it cannot decide.
//
// A CONSTANT is evaluated and compared with the rounding leniency every other
// number gets ("2*sqrt(2)" against "2.828"). An EXPRESSION WITH A VARIABLE is
// compared by SAMPLING — evaluating both sides at fixed points — because
// rationalize() answers a question about strings, not about mathematics:
//
//   rationalize('(1.6+0.2(n-1)) - (1.6+0.2(n-1))')  ->  2.220446049250313e-16
//
// That is not the string '0', so an expression was reported as not equivalent
// to ITSELF, and a real attempt lost the mark for writing the accepted
// alternative exactly as the mark scheme listed it. Any expression with
// decimal coefficients could hit it.
//
// rationalize and simplify are kept as a fallback for what sampling cannot
// evaluate, but they are now trusted ASYMMETRICALLY: '0' is a sound proof of
// equality, while a non-zero residue proves nothing and returns null rather
// than false. A symbolic engine may never produce a confident "wrong" again.
function mathEquivalent(a: string, b: string): boolean | null {
  const bothEquations = a.includes('=') && b.includes('=');
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
      if (typeof na === 'number' && typeof nb === 'number') return closeEnough(na, nb);
    } catch {
      // not something mathjs can evaluate — fall through
    }
  } else {
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

// Word answers ("corresponding angles", "grouped data uses class midpoints").
// Short classification answers must match on content words exactly, so
// "acute" vs "exterior" still fails. Sentence-length answers — the
// justification archetype — are reworded freely by an independent solver, so
// they match on substantial content-word overlap instead.
function wordsEquivalent(a: string, b: string): boolean {
  const ta = contentTokens(a);
  const tb = contentTokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  if ([...ta].sort().join(' ') === [...tb].sort().join(' ')) return true;

  // Two prose answers quoting different numbers are different answers. Without
  // this, the rules below treat any extra token as a harmless qualifier, and
  // an answer with a wrong value appended reads as a superset of the right one
  // — which is how a deliberately poisoned draft once passed this gate.
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

  // Sentence-length answers (justifications) are reworded freely.
  if (ta.length >= 4 || tb.length >= 4) {
    return shared / Math.max(setA.size, setB.size) >= 0.6;
  }
  return false;
}

// Prose is not algebra. mathjs parses "obtuse angle" as implicit
// multiplication, and rationalize() then returns a non-zero garbage
// expression that would read as "not equivalent" — so the symbolic path only
// runs when both sides actually look mathematical.
function looksMathematical(s: string): boolean {
  return !/[a-z]{2,}/.test(s.replace(/sqrt|frac|pi|text|cdot|times/g, ''));
}

function valueEquivalent(a: string, b: string): boolean {
  // QUANTITIES FIRST, and decisively.
  //
  // If either side carries a unit, the comparison is about quantities and the
  // numeric path below must not see it — that path parses the number and drops
  // the unit, which is how 72 cm came to equal 72 m.
  // A product of quantities — "8 m × 6 m" — before a single one, since each
  // side of it is a quantity too.
  const pa = parseQuantityProduct(a);
  const pb = parseQuantityProduct(b);
  if (pa && pb) return productsEqual(pa, pb, closeEnough);
  if (pa || pb) return false;

  const qa = parseQuantity(a);
  const qb = parseQuantity(b);
  if (qa && qb) return sameDimension(qa, qb) && closeEnough(qa.value, qb.value);
  if (qa || qb) {
    // One side has a unit and the other does not. A bare number is accepted
    // against it when the values agree — the question supplied the unit, and a
    // student who omits it has not made a mathematical error. Anything else
    // with no unit of its own is not a number at all, and is not equal.
    const quantity = (qa ?? qb)!;
    const other = parseNumeric(qa ? b : a);
    if (other === null) return false;
    const asWritten = headOf(qa ? a : b);
    return (
      closeEnough(other, quantity.value) || (asWritten !== null && closeEnough(other, asWritten))
    );
  }

  const na = parseNumeric(a);
  const nb = parseNumeric(b);
  if (na !== null && nb !== null) return closeEnough(na, nb);
  if (looksMathematical(a) && looksMathematical(b)) {
    const m = mathEquivalent(a, b);
    if (m !== null) return m;
  }
  // both sides are already pre-cleaned/label-stripped
  return a === b || wordsEquivalent(a, b);
}

// True when two answers are equivalent. Multi-part answers ("x = -1/3 or
// x = 2", "EC$70; EC$58") match as unordered sets of equivalent values.
export function answersEquivalent(a: string, b: string): boolean {
  const partsA = splitParts(preClean(a));
  const partsB = splitParts(preClean(b));
  if (partsA.length === 0 || partsB.length === 0) return false;

  if (partsA.length !== partsB.length) {
    // Different part counts: only a whole-string comparison can save it.
    return valueEquivalent(stripLabel(preClean(a)), stripLabel(preClean(b)));
  }

  const used = new Array<boolean>(partsB.length).fill(false);
  for (const pa of partsA) {
    const idx = partsB.findIndex((pb, i) => !used[i] && valueEquivalent(pa, pb));
    if (idx === -1) return false;
    used[idx] = true;
  }
  return true;
}

// Mark-scheme any-of matching: a candidate is correct when it is equivalent
// to the canonical answer OR to any listed accepted alternative. This is the
// single entry point for grading and the solve gate — synonymy lives in the
// question's accept list (as on a real mark scheme), never in heuristics here.
export function answersEquivalentAny(
  candidate: string,
  canonical: string,
  accept?: string[],
): boolean {
  if (answersEquivalent(candidate, canonical)) return true;
  return (accept ?? []).some((alt) => answersEquivalent(candidate, alt));
}
