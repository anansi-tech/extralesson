// Final-answer equivalence check (ROUND_1 §6.3 and §4.3).
// Deliberately simple, documented heuristics — no LLM grading in Round 1.

// Normalize a candidate answer string: trim, lowercase, strip surrounding
// dollar signs / KaTeX wrappers, collapse whitespace, unify minus signs.
function normalize(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^\$+|\$+$/g, '')
    .replace(/\\left|\\right/g, '')
    .replace(/[−–]/g, '-') // unicode minus/en-dash -> hyphen
    .replace(/\s+/g, ' ')
    .trim();
}

// Parse a number from common student notations: "0.5", "-1/3", "1 1/2",
// "50%", "$1,200". Returns null when the value isn't cleanly numeric.
export function parseNumeric(raw: string): number | null {
  let s = normalize(raw).replace(/[,$]/g, '');
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
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return percent ? n / 100 : n;
}

// True when two answers are equivalent: numerically (within a small relative
// tolerance, so 1/3 matches 0.333) or as normalized strings.
export function answersEquivalent(a: string, b: string): boolean {
  const na = parseNumeric(a);
  const nb = parseNumeric(b);
  if (na !== null && nb !== null) {
    if (na === nb) return true;
    const scale = Math.max(Math.abs(na), Math.abs(nb));
    return Math.abs(na - nb) <= Math.max(1e-9, scale * 5e-3);
  }
  // Non-numeric: compare normalized strings (e.g. "x = 2 or x = -1/3").
  return normalize(a) === normalize(b);
}
