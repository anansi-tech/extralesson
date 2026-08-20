import type { Verdict } from './symbolic';

// 2x2 matrix arithmetic, machine-checked.
//
// A composite-transformation question reached review with a false answer: the
// worked solution correctly wrote "rotation first, then reflection", correctly
// set up F·R, and then printed the wrong product. Every gate passed it, because
// nothing in the pipeline multiplies matrices — the symbolic checker knew about
// functions, roots, gradients and magnitudes, and not about the one operation a
// model fumbles most reliably and a computer settles instantly.
//
// Worse than wrong: the correct product had landed in the "reversed order of
// composition" misconception, so a student who did it RIGHT would be marked
// wrong and told they had reversed the order.

export type Matrix2 = [number, number, number, number]; // a b c d, row-major

/** A 2x2 matrix written the way the papers and KaTeX write one. */
export function parseMatrix(raw: string): Matrix2 | null {
  const m = raw.match(/\\begin\{[bp]matrix\}([\s\S]*?)\\end\{[bp]matrix\}/);
  if (!m) return null;
  const rows = m[1].split(/\\\\/).map((r) => r.trim()).filter((r) => r !== '');
  if (rows.length !== 2) return null;
  const cells = rows.map((r) => r.split('&').map((c) => c.trim()));
  if (cells.some((r) => r.length !== 2)) return null;
  const nums = cells.flat().map((c) => {
    // Entries are integers, decimals or simple fractions — nothing a
    // transformation matrix needs is more exotic than that.
    const frac = c.match(/^-?\\d?frac\{(-?[\d.]+)\}\{(-?[\d.]+)\}$/);
    if (frac) {
      const v = Number(frac[1]) / Number(frac[2]);
      return c.startsWith('-') ? -v : v;
    }
    return Number(c);
  });
  return nums.every((n) => Number.isFinite(n)) ? (nums as Matrix2) : null;
}

export function multiply(a: Matrix2, b: Matrix2): Matrix2 {
  return [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
  ];
}

export function determinant(m: Matrix2): number {
  return m[0] * m[3] - m[1] * m[2];
}

export function inverse2(m: Matrix2): Matrix2 | null {
  const det = determinant(m);
  if (Math.abs(det) < 1e-12) return null;
  return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det];
}

const near = (a: number, b: number) => Math.abs(a - b) <= 1e-9;
export const sameMatrix = (a: Matrix2, b: Matrix2) => a.every((v, i) => near(v, b[i]));

const show = (m: Matrix2) => `(${m[0]} ${m[1]}; ${m[2]} ${m[3]})`;

/**
 * Check a product a solution ASSERTS.
 *
 * The claim comes out of the worked solution's own equation — "A B = C" — so
 * nothing is inferred about which matrices the question meant to multiply. It
 * checks the arithmetic that was written down, which is where the error was.
 */
export function productClaim(a: Matrix2, b: Matrix2, claimed: Matrix2): Verdict {
  const want = multiply(a, b);
  if (sameMatrix(want, claimed)) return { checked: true, ok: true };
  // Naming the other order is the useful half of the message: it is almost
  // always what the wrong answer actually is.
  const reversed = multiply(b, a);
  const note = sameMatrix(reversed, claimed) ? ' — that is the product in the other order' : '';
  return {
    checked: true,
    ok: false,
    reason: `${show(a)} times ${show(b)} is ${show(want)}, not ${show(claimed)}${note}`,
  };
}

export function inverseClaim(m: Matrix2, claimed: Matrix2): Verdict {
  const want = inverse2(m);
  if (!want) return { checked: true, ok: false, reason: `${show(m)} is singular and has no inverse` };
  return sameMatrix(want, claimed)
    ? { checked: true, ok: true }
    : { checked: true, ok: false, reason: `the inverse of ${show(m)} is ${show(want)}, not ${show(claimed)}` };
}

export function determinantClaim(m: Matrix2, claimed: number): Verdict {
  const want = determinant(m);
  return near(want, claimed)
    ? { checked: true, ok: true }
    : { checked: true, ok: false, reason: `the determinant of ${show(m)} is ${want}, not ${claimed}` };
}
