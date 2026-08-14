import { describe, expect, it } from 'vitest';
import { answersEquivalent, parseNumeric } from '@/lib/grade/equivalence';

describe('parseNumeric', () => {
  it('parses plain numbers, negatives, decimals', () => {
    expect(parseNumeric('42')).toBe(42);
    expect(parseNumeric('-3.5')).toBe(-3.5);
    expect(parseNumeric(' 7 ')).toBe(7);
  });

  it('parses fractions, mixed numbers, percents, currency', () => {
    expect(parseNumeric('-1/3')).toBeCloseTo(-1 / 3);
    expect(parseNumeric('1 1/2')).toBe(1.5);
    expect(parseNumeric('50%')).toBe(0.5);
    expect(parseNumeric('$1,200')).toBe(1200);
    expect(parseNumeric('\\frac{1}{4}')).toBe(0.25);
  });

  it('returns null for non-numeric input', () => {
    expect(parseNumeric('x = 2')).toBeNull();
    expect(parseNumeric('')).toBeNull();
  });
});

describe('answersEquivalent', () => {
  it('matches numerically equivalent forms', () => {
    expect(answersEquivalent('0.5', '1/2')).toBe(true);
    expect(answersEquivalent('-1/3', '-0.333')).toBe(true);
    expect(answersEquivalent('$25', '25')).toBe(true);
  });

  it('rejects different values', () => {
    expect(answersEquivalent('1/3', '-1/3')).toBe(false);
    expect(answersEquivalent('2', '3')).toBe(false);
  });

  it('compares non-numeric answers as normalized strings', () => {
    expect(answersEquivalent('x = 2', 'X = 2')).toBe(true);
    expect(answersEquivalent('$x=2$', 'x=2')).toBe(true);
    expect(answersEquivalent('x = 2', 'x = 3')).toBe(false);
  });
});
