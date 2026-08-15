import { describe, expect, it } from 'vitest';
import { answersEquivalent, answersEquivalentAny, parseNumeric } from '@/lib/grade/equivalence';

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

  it('parses a number followed by a unit or noun', () => {
    expect(parseNumeric('72 cm')).toBe(72);
    expect(parseNumeric('5 pieces')).toBe(5);
    expect(parseNumeric('500 ml')).toBe(500);
    expect(parseNumeric('1 1/2 hours')).toBe(1.5);
    expect(parseNumeric('2x')).toBeNull(); // algebra, not a unit
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

describe('answersEquivalent — unit-word tails (pilot regression)', () => {
  it('treats "5 pieces" and "5" as equivalent per part', () => {
    expect(answersEquivalent('5 pieces', '5')).toBe(true);
    expect(answersEquivalent('72 cm', '72')).toBe(true);
    expect(answersEquivalent('3 lengths', '3')).toBe(true);
    expect(answersEquivalent('9 edges', '9')).toBe(true);
    expect(answersEquivalent('5 pieces', '6')).toBe(false);
  });
});

describe('answersEquivalent — word answers (pilot regression)', () => {
  it('matches word answers that differ only in case or a generic noun', () => {
    expect(answersEquivalent('obtuse angle', 'Obtuse angle')).toBe(true);
    expect(answersEquivalent('corresponding angles', 'Corresponding angles')).toBe(true);
    expect(answersEquivalent('alternate interior angles', 'Alternate interior angles')).toBe(true);
    expect(answersEquivalent('obtuse', 'obtuse angle')).toBe(true);
    expect(answersEquivalent('105°, obtuse', '105°; obtuse angle')).toBe(true);
  });

  it('still rejects genuinely different classifications', () => {
    expect(answersEquivalent('acute angle', 'Exterior angle')).toBe(false);
    expect(answersEquivalent('corresponding angles', 'alternate angles')).toBe(false);
    expect(answersEquivalent('obtuse angle', '68°')).toBe(false);
  });

  it('accepts reworded sentence-length justifications, not different claims', () => {
    expect(
      answersEquivalent(
        'grouped data uses class midpoints, not actual values',
        'class midpoints are used instead of the actual data values',
      ),
    ).toBe(true);
    expect(
      answersEquivalent(
        'the sample was too small to be representative',
        'the questionnaire used leading questions',
      ),
    ).toBe(false);
  });

  it('prose comparison never hijacks algebraic comparison', () => {
    expect(answersEquivalent('2x - 4', '2(x - 2)')).toBe(true);
    expect(answersEquivalent('2x - 4', '2x + 4')).toBe(false);
  });
});

describe('answersEquivalent — pilot round 2 regressions', () => {
  it('normalizes KaTeX degree notation', () => {
    expect(parseNumeric('$67^\\circ$')).toBe(67);
    expect(answersEquivalent('$67^\\circ$', '67°')).toBe(true);
    expect(answersEquivalent('$113^{\\circ}$', '113°')).toBe(true);
    expect(answersEquivalent('$67^\\circ$', '113°')).toBe(false);
  });

  it('accepts a qualifier one side omits, not a different answer', () => {
    expect(answersEquivalent('hexagon', 'Regular hexagon')).toBe(true);
    expect(answersEquivalent('$AB=AC$', 'AB = AC')).toBe(true);
    expect(answersEquivalent('hexagon', 'Regular pentagon')).toBe(false);
    expect(answersEquivalent('acute', 'interior angle')).toBe(false);
  });
});

describe('answersEquivalentAny — mark-scheme accept lists', () => {
  it('matches the canonical answer or any accepted alternative', () => {
    expect(answersEquivalentAny('edge', 'edge', ['line segment'])).toBe(true);
    expect(answersEquivalentAny('line segment', 'edge', ['line segment'])).toBe(true);
    expect(answersEquivalentAny('Line segment', 'edge', ['line segment'])).toBe(true);
    expect(answersEquivalentAny('vertex', 'edge', ['line segment'])).toBe(false);
    expect(answersEquivalentAny('edge', 'edge')).toBe(true);
  });
});

describe('answersEquivalent — unicode superscripts (pilot round 3)', () => {
  it('treats ² and ^2 as the same exponent', () => {
    expect(answersEquivalent('P=M^2-2M', 'P = M² - 2M')).toBe(true);
    expect(answersEquivalent('x²+3x', 'x^2 + 3x')).toBe(true);
    expect(answersEquivalent('P=M^2-2M', 'P = M² + 2M')).toBe(false);
  });
});
