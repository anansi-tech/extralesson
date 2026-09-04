import { evaluate, parse, rationalize, simplify } from 'mathjs';
import { markMoney, normaliseDigitGroups } from '@/lib/money';
import { parseQuantity, parseQuantityProduct, productsEqual, sameDimension } from './quantity';
import { roundTo, type Rounding } from './rounding';

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
  const cleaned = normaliseDigitGroups(markMoney(stripInvisible(raw)))
    .trim()
    .toLowerCase()
    .replace(/\\left|\\right|\\,|\\;/g, '')
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

// The left side is discarded only when it actually looks like a label —
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
function mathEquivalent(a: string, b: string, rounding: Rounding | null): boolean | null {
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
      if (typeof na === 'number' && typeof nb === 'number') return closeEnough(na, nb, rounding);
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
function looksMathematical(s: string): boolean {
  return !/[a-z]{2,}/.test(s.replace(/sqrt|frac|pi|text|cdot|times/g, ''));
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

  const na = parseNumeric(a);
  const nb = parseNumeric(b);
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
export function answersEquivalent(a: string, b: string, rounding: Rounding | null = null): boolean {
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
  rounding: Rounding | null = null,
): boolean {
  if (answersEquivalent(candidate, canonical, rounding)) return true;
  return (accept ?? []).some((alt) => answersEquivalent(candidate, alt, rounding));
}
