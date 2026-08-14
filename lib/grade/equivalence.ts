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
    .replace(/[−–]/g, '-') // unicode minus / en-dash
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
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

// Strip leading part labels ("(a)", "b)") and naming prefixes: for a part
// like "small bag = 5" or "plantain: 10", the value is what follows the last
// '=' or ':'. Applied to both sides, so genuine equations ("y = 2x + 3")
// reduce consistently to their right-hand side.
function stripLabel(part: string): string {
  let p = part.trim().replace(/^\(?[a-z]\)[\s.:]*/, '');
  const eq = p.lastIndexOf('=');
  if (eq >= 0) p = p.slice(eq + 1);
  else {
    const colon = p.lastIndexOf(':');
    if (colon >= 0) p = p.slice(colon + 1);
  }
  return p.trim();
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

// Canonical comparison via mathjs: evaluate both (constants like "2*sqrt(2)"
// vs "2.828"), else simplify the difference of two algebraic forms to 0.
// Returns null when mathjs can't decide.
function mathEquivalent(a: string, b: string): boolean | null {
  const ea = toMathExpr(a);
  const eb = toMathExpr(b);
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

function valueEquivalent(a: string, b: string): boolean {
  const na = parseNumeric(a);
  const nb = parseNumeric(b);
  if (na !== null && nb !== null) return closeEnough(na, nb);
  const m = mathEquivalent(a, b);
  if (m !== null) return m;
  return a === b; // both sides are already pre-cleaned/label-stripped
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
