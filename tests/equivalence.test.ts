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

  it('strips "x =" prefixes when the value is numeric', () => {
    expect(parseNumeric('x = 2')).toBe(2);
    expect(parseNumeric('EC$70')).toBe(70);
  });

  it('returns null for non-numeric input', () => {
    expect(parseNumeric('no solution')).toBeNull();
    expect(parseNumeric('2x + 1')).toBeNull();
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
    expect(answersEquivalent('Print; do not print', 'Print; Not print')).toBe(true);
  });

  it('strips "x =" style prefixes and part labels', () => {
    expect(answersEquivalent('x = 5', '5')).toBe(true);
    expect(answersEquivalent('(a) 5', '5')).toBe(true);
    expect(answersEquivalent('cost of one pineapple: $8', '8')).toBe(true);
  });

  it('matches multi-root answers as unordered sets', () => {
    expect(answersEquivalent('x = -1/3 or x = 2', '2, -1/3')).toBe(true);
    expect(answersEquivalent('x = 2 or x = 3', 'x = 3 or x = 2')).toBe(true);
    expect(answersEquivalent('x = -1/3; x = 2', 'x = 2 or x = -0.333')).toBe(true);
    expect(answersEquivalent('x = 2 or x = 3', 'x = 2')).toBe(false);
    expect(answersEquivalent('x = 2 or x = 3', 'x = 2 or x = 4')).toBe(false);
  });

  it('matches multi-part money answers with naming prefixes and currency', () => {
    expect(answersEquivalent('Plantain: EC$10; dasheen: EC$16', '$10; $16')).toBe(true);
    expect(
      answersEquivalent('One crate of oranges costs = EC$70; limes = EC$58', '70; 58'),
    ).toBe(true);
    expect(answersEquivalent('EC$10; EC$16', 'EC$10; EC$17')).toBe(false);
    expect(
      answersEquivalent(
        'population parameter; 185 EC dollars; sample statistic',
        'Population parameter; EC$185; Sample statistic',
      ),
    ).toBe(true);
  });

  it('treats equivalent fractions/decimals and KaTeX forms as equal', () => {
    expect(answersEquivalent('\\frac{1}{2}', '0.5')).toBe(true);
    expect(answersEquivalent('x = -\\frac{1}{3}', '-1/3')).toBe(true);
    expect(answersEquivalent('1 1/2', '1.5')).toBe(true);
  });

  it('uses mathjs canonical comparison for surds and algebraic forms', () => {
    expect(answersEquivalent('2*sqrt(2)', '2.8284')).toBe(true);
    expect(answersEquivalent('\\sqrt{9}', '3')).toBe(true);
    expect(answersEquivalent('2x - 4', '2(x - 2)')).toBe(true);
    expect(answersEquivalent('2x - 4', '2x + 4')).toBe(false);
  });
});
