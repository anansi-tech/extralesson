import { describe, expect, it } from 'vitest';
import { determinant, inverse2, multiply, parseMatrix, productClaim } from '@/lib/grade/matrix';
import { matrixClaims } from '@/lib/grade/checkable';

const M = (a: number, b: number, c: number, d: number) =>
  `\\begin{pmatrix}${a}&${b}\\\\${c}&${d}\\end{pmatrix}`;

describe('2x2 matrix arithmetic', () => {
  it('reads a matrix the way the papers write one', () => {
    expect(parseMatrix(M(0, 1, 1, 0))).toEqual([0, 1, 1, 0]);
    expect(parseMatrix('\\begin{bmatrix}2&3\\\\1&1\\end{bmatrix}')).toEqual([2, 3, 1, 1]);
    expect(parseMatrix('not a matrix')).toBeNull();
  });

  it('multiplies, inverts and takes a determinant', () => {
    expect(multiply([0, 1, 1, 0], [0, -1, 1, 0])).toEqual([1, 0, 0, -1]);
    expect(determinant([2, 1, 1, 1])).toBe(1);
    expect(inverse2([2, 1, 1, 1])).toEqual([1, -1, -1, 2]);
    expect(inverse2([1, 1, 1, 1])).toBeNull(); // singular
  });

  it('names the other order, because that is what the wrong answer usually is', () => {
    const v = productClaim([0, 1, 1, 0], [0, -1, 1, 0], [-1, 0, 0, 1]) as { ok: boolean; reason: string };
    expect(v.ok).toBe(false);
    expect(v.reason).toContain('other order');
  });
});

describe('checking the arithmetic a worked solution asserts', () => {
  const chain = (...segments: string[]) => `Therefore \\[ ${segments.join(' = ')}. \\]`;

  it('catches the composite-transformation error that reached review', () => {
    // Rotate 90 anticlockwise then reflect in y = x. The solution set the
    // product up correctly and printed the wrong result; every gate passed it
    // because nothing multiplied matrices.
    const claims = matrixClaims(chain('C', `${M(0, 1, 1, 0)} ${M(0, -1, 1, 0)}`, M(-1, 0, 0, 1)));
    expect(claims).toHaveLength(1);
    expect((claims[0].verdict as { ok: boolean }).ok).toBe(false);
  });

  it('passes the same chain once it is right', () => {
    const claims = matrixClaims(chain('C', `${M(0, 1, 1, 0)} ${M(0, -1, 1, 0)}`, M(1, 0, 0, -1)));
    expect((claims[0].verdict as { ok: boolean }).ok).toBe(true);
  });

  it('reads a chain, not pairs pulled out of the middle of one', () => {
    // "AB = M1 M2 = <entrywise working> = R" is how these are written. Matching
    // "A B = C" pairwise reported three correct approved questions as false.
    const working = '\\begin{pmatrix}2-1&-2+2\\\\1-1&-1+2\\end{pmatrix}';
    const claims = matrixClaims(chain('AB', `${M(2, 1, 1, 1)} ${M(1, -1, -1, 2)}`, working, M(1, 0, 0, 1)));
    expect((claims[0].verdict as { ok: boolean }).ok).toBe(true);
  });

  it('abstains where a scalar or a power changes the value', () => {
    // "1/det times the adjugate" and "M^{-1}" are not products of the matrices
    // written; reading only the matrices reported four correct questions wrong.
    for (const scaled of [`\\frac{1}{-4}${M(0, -2, -2, 0)}`, `3${M(2, 1, 1, 1)}`, `${M(0, 2, 2, 0)}^{-1}`]) {
      expect(matrixClaims(chain('X', scaled, M(0, 0.5, 0.5, 0))), scaled).toEqual([]);
    }
  });

  it('says nothing about a solution with no matrix equation in it', () => {
    expect(matrixClaims('The gradient is $2$ and the intercept is $-3$.')).toEqual([]);
    expect(matrixClaims('')).toEqual([]);
  });
});
