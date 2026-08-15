import { evaluate, rationalize, simplify } from 'mathjs';

// Final-answer equivalence check (ROUND_1 §6.3 and §4.3).
// Deliberately simple, documented heuristics — no LLM grading in Round 1.
//
// Strategy: split each answer into parts (multi-root / multi-part answers),
// strip labels and "x =" prefixes, then match parts as an unordered set.
// Each pair is compared numerically (with tolerance), then canonically via
// mathjs (fractions, surds, equivalent algebraic forms), then as normalized
// strings.

// Normalize: trim, lowercase, strip KaTeX/currency dressing, unify minus
// signs and multiplication symbols, collapse whitespace.
function preClean(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\\left|\\right|\\,|\\;/g, '')
    .replace(/\$+/g, '') // KaTeX delimiters and bare dollar signs
    .replace(/\b(ec|us|tt|bds|gy|j)\s*(?=\d)/g, '') // currency prefixes left after $ strip
    .replace(/\\text\{([^{}]*)\}/g, '$1') // \text{ and } wrappers carry no value
    .replace(/\\[dt]frac\b/g, '\\frac') // display/inline fractions are one fraction
    .replace(/[−–]/g, '-') // unicode minus / en-dash
    // One spelling per relation, whichever notation the writer reached for.
    .replace(/\\mapsto|\\rightarrow|\\to\b|↦|→/g, '->')
    .replace(/\\neq?\b|≠/g, '!=')
    .replace(/⁻¹/g, '^{-1}')
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^\s*\{?\s*\\?circ\s*\}?/g, '°') // KaTeX degrees: ^\circ, ^{\circ}
    .replace(/²/g, '^2') // unicode superscripts are exponents, not prose
    .replace(/³/g, '^3')
    .replace(/°/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Split a (pre-cleaned) answer into independent parts: roots, or the answers
// to (a)/(b)/(c) sub-parts. Comma splits only on ", " so thousands separators
// ("1,200") survive.
function splitParts(cleaned: string): string[] {
  return cleaned
    .split(/\s+or\s+|\s+and\s+|;|\n|,\s+/)
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
  let s = preClean(raw).replace(/,/g, '');
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
  // Number followed by a unit/noun ("72 cm", "5 pieces", "500 ml"): parse the
  // numeric head. Letters must not touch the digits ("2x" stays algebraic).
  const unitTail = s.match(/^(-?[\d.]+(?: \d+\/\d+)?|-?[\d.]+\/[\d.]+) [a-z][a-z .°]*$/);
  if (unitTail) return parseNumeric(unitTail[1]);
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return percent ? n / 100 : n;
}

function closeEnough(a: number, b: number): boolean {
  if (a === b) return true;
  const scale = Math.max(Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= Math.max(1e-9, scale * 5e-3);
}

// Rewrite KaTeX-isms into mathjs syntax.
function toMathExpr(s: string): string {
  return s
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))')
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

// Canonical comparison via mathjs: evaluate both (constants like "2*sqrt(2)"
// vs "2.828"), else simplify the difference of two algebraic forms to 0.
// Returns null when mathjs can't decide.
function mathEquivalent(a: string, b: string): boolean | null {
  const bothEquations = a.includes('=') && b.includes('=');
  const ea = toMathExpr(bothEquations ? asDifference(a) : a);
  const eb = toMathExpr(bothEquations ? asDifference(b) : b);
  try {
    const va = evaluate(ea);
    const vb = evaluate(eb);
    if (typeof va === 'number' && typeof vb === 'number') return closeEnough(va, vb);
  } catch {
    // fall through to symbolic comparison
  }
  // rationalize expands polynomials to canonical form (simplify alone does
  // not distribute, so "2(x-2)" vs "2x-4" would not reduce to 0).
  try {
    return rationalize(`(${ea}) - (${eb})`).toString() === '0';
  } catch {
    // non-polynomial (surds, functions) — try plain simplification
  }
  try {
    return simplify(`(${ea}) - (${eb})`).toString() === '0';
  } catch {
    return null;
  }
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
