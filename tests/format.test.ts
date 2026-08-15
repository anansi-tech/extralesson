import { describe, expect, it } from 'vitest';
import { checkAnswerFormat, valueLooksRight } from '@/lib/grade/format';
import type { AnswerFormat } from '@/lib/types';

const ok = (v: string, f: AnswerFormat) => checkAnswerFormat(v, f).ok;

describe('checkAnswerFormat — exact', () => {
  it('accepts fractions, surds and multiples of pi', () => {
    for (const v of ['1/3', '\\frac{1}{3}', '2\\sqrt{5}', '\\frac{500\\pi}{3}', '5']) {
      expect(ok(v, 'exact'), v).toBe(true);
    }
  });

  it('rejects a rounded decimal, the whole point of asking for exact form', () => {
    const res = checkAnswerFormat('0.333', 'exact');
    expect(res.ok).toBe(false);
    expect(res.feedback).toContain('EXACT');
  });
});

describe('checkAnswerFormat — surd', () => {
  it('requires a root', () => {
    expect(ok('3\\sqrt{2}', 'surd')).toBe(true);
    expect(ok('√18', 'surd')).toBe(true);
    expect(ok('4.24', 'surd')).toBe(false);
  });
});

describe('checkAnswerFormat — standard form', () => {
  it('accepts a x 10^n in the usual notations', () => {
    for (const v of ['3.4 \\times 10^{5}', '3.4 × 10^5', '2 x 10^-3', '1.05\\times10^{8}']) {
      expect(ok(v, 'standard_form'), v).toBe(true);
    }
  });

  it('rejects the plain number', () => {
    const res = checkAnswerFormat('340000', 'standard_form');
    expect(res.ok).toBe(false);
    expect(res.feedback).toContain('standard form');
  });
});

describe('checkAnswerFormat — lowest terms', () => {
  it('accepts a reduced fraction', () => {
    expect(ok('3/4', 'lowest_terms')).toBe(true);
    expect(ok('-2/7', 'lowest_terms')).toBe(true);
  });

  it('rejects an unreduced fraction and names the common factor', () => {
    const res = checkAnswerFormat('6/8', 'lowest_terms');
    expect(res.ok).toBe(false);
    expect(res.feedback).toContain('2');
  });

  it('rejects a decimal', () => {
    expect(ok('0.75', 'lowest_terms')).toBe(false);
  });
});

describe('checkAnswerFormat — integer', () => {
  it('accepts whole numbers only', () => {
    expect(ok('42', 'integer')).toBe(true);
    expect(ok('-7', 'integer')).toBe(true);
    expect(ok('42.0', 'integer')).toBe(false);
    expect(ok('41.6', 'integer')).toBe(false);
  });
});

describe('checkAnswerFormat — significant figures', () => {
  it('counts significant figures as written', () => {
    expect(ok('12.3', 'sf:3')).toBe(true);
    expect(ok('0.0451', 'sf:3')).toBe(true); // leading zeros do not count
    expect(ok('12.30', 'sf:4')).toBe(true); // trailing zero after the point does
  });

  it('rejects the wrong precision and says which', () => {
    const res = checkAnswerFormat('12.345', 'sf:3');
    expect(res.ok).toBe(false);
    expect(res.feedback).toContain('3 significant figures');
    expect(res.feedback).toContain('5');
  });
});

describe('checkAnswerFormat — decimal places', () => {
  it('accepts the requested precision', () => {
    expect(ok('36.9', 'dp:1')).toBe(true); // 1 d.p. for angles
    expect(ok('4.25', 'dp:2')).toBe(true);
  });

  it('rejects too many or too few', () => {
    expect(ok('36.87', 'dp:1')).toBe(false);
    expect(ok('37', 'dp:1')).toBe(false);
    const res = checkAnswerFormat('36.87', 'dp:1');
    expect(res.feedback).toContain('1 decimal place');
  });

  it('dp:0 means the nearest whole number', () => {
    expect(ok('37', 'dp:0')).toBe(true);
    expect(ok('36.9', 'dp:0')).toBe(false);
  });
});

describe('checkAnswerFormat — equation form', () => {
  it('requires an equation', () => {
    expect(ok('y = 2x + 3', 'equation_form')).toBe(true);
    expect(ok('2x + 3', 'equation_form')).toBe(false);
  });
});

describe('checkAnswerFormat — label prefixes do not change the form', () => {
  it('ignores a leading "x =" when judging the value written', () => {
    expect(ok('x = 12.3', 'sf:3')).toBe(true);
    expect(ok('x = 0.333', 'exact')).toBe(false);
  });
});

describe('valueLooksRight', () => {
  it('separates a wrong form from a wrong answer', () => {
    expect(valueLooksRight('0.333', '1/3')).toBe(true);
    expect(valueLooksRight('0.25', '1/3')).toBe(false);
    expect(valueLooksRight('obtuse', '1/3')).toBe(false);
  });
});
