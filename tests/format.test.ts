import { describe, expect, it } from 'vitest';
import { checkAnswerFormat, valueLooksRight } from '@/lib/grade/format';
import { markStructured } from '@/lib/grade/mark';
import type { AnswerFormat, RubricItem } from '@/lib/types';

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

// R1.7 §B4 — this feedback is only ever reached when the value was right, so
// it must say so first. "The question asks for standard form" alone reads as
// "you got it wrong"; the student lost one mark for the form, not the question.
describe('format feedback leads with what the student got right', () => {
  const cases: [string, AnswerFormat][] = [
    ['0.000045', 'standard_form'],
    ['1.414', 'surd'],
    ['4/8', 'lowest_terms'],
    ['7.5', 'integer'],
    ['12', 'equation_form'],
    ['3.14159', 'sf:3'],
    ['36.87', 'dp:1'],
    ['0.5', 'exact'],
  ];
  for (const [answer, format] of cases) {
    it(`says "Correct value" for ${format}`, () => {
      const check = checkAnswerFormat(answer, format);
      expect(check.ok).toBe(false);
      expect(check.feedback).toMatch(/^Correct value/);
    });
  }
});

// STANDING RULE (AGENTS.md): every answer_format proves that an answer written
// CORRECTLY in that form marks CORRECT, end to end. Rejection tests alone hid
// the fact that standard form could never be marked right at all — the value
// comparison failed before the format check was ever consulted.
describe('round trip — a correctly formatted answer marks correct', () => {
  const rubric: RubricItem[] = [
    { code: 'CK1', profile: 'CK', criterion: 'CAO', mark_value: 2, slot_ref: 'a.i', part_label: 'a' },
    { code: 'R1', profile: 'R', criterion: "Expresses 'their' answer in the required form", mark_value: 1, slot_ref: 'a.i', part_label: 'a', for_format: true },
  ];

  // [format, canonical answer, what a student writes correctly, an equivalent
  //  value in the WRONG form]
  const cases: [AnswerFormat, string, string, string][] = [
    ['exact', '\\frac{3}{8}', '\\frac{3}{8}', '0.375'],
    ['surd', '3\\sqrt{2}', '3\\sqrt{2}', '4.243'],
    ['standard_form', '4.5 \\times 10^{-5}', '4.5 \\times 10^{-5}', '0.000045'],
    ['standard_form', '3.2 \\times 10^{4}', '3.2 \\times 10^{4}', '32000'],
    ['lowest_terms', '\\frac{3}{4}', '\\frac{3}{4}', '\\frac{6}{8}'],
    ['integer', '47', '47', '47.2'],
    ['equation_form', 'y = 2x + 5', 'y = 2x + 5', '2x + 5'],
    ['sf:3', '12.7', '12.7', '12.68'],
    ['dp:1', '36.9', '36.9', '36.87'],
  ];

  for (const [format, canonical, wellFormed, wrongForm] of cases) {
    it(`${format}: "${wellFormed}" earns every mark`, () => {
      const res = markStructured(rubric, canonical, wellFormed, '', undefined, format);
      expect(res.correct, `${format} rejected its own canonical form`).toBe(true);
      expect(res.rubric_awarded).toEqual(['CK1', 'R1']);
      expect(res.format_feedback).toBeUndefined();
    });

    it(`${format}: "${wrongForm}" keeps the value marks and loses the form mark`, () => {
      const res = markStructured(rubric, canonical, wrongForm, '', undefined, format);
      expect(res.correct).toBe(false);
      expect(res.rubric_awarded).toEqual(['CK1']);
      expect(res.format_feedback).toMatch(/^Correct value/);
    });
  }

  it('covers every format the schema allows', () => {
    const covered = new Set(cases.map(([f]) => String(f).replace(/:\d+$/, ':N')));
    for (const f of ['exact', 'standard_form', 'lowest_terms', 'integer', 'surd', 'equation_form', 'sf:N', 'dp:N']) {
      expect(covered.has(f), `no round-trip case for ${f}`).toBe(true);
    }
  });
});

// A FORM IS A CLAIM ABOUT THE NUMBER, NOT ABOUT THE STRING AROUND IT.
//
// The check required bare digits, so anything carrying a unit failed to parse
// as a number at all and was reported as the wrong form. Measured on the live
// bank before the fix: 59 of the 256 slots declaring a format had a canonical
// answer that failed ITS OWN declared format — the mark scheme's own answer
// could not have earned the mark it defines. Afterwards: none.
describe('checkAnswerFormat — units, dressing and prose around the number', () => {
  it('reads the number through a unit', () => {
    expect(checkAnswerFormat('73.7°', 'dp:1').ok).toBe(true);
    expect(checkAnswerFormat('203.0\\text{ m}^2', 'dp:1').ok).toBe(true);
    expect(checkAnswerFormat('34.3 km/h', 'sf:3').ok).toBe(true);
    expect(checkAnswerFormat('20.2\\%', 'sf:3').ok).toBe(true);
    expect(checkAnswerFormat('164^\\circ', 'integer').ok).toBe(true);
  });

  it('reads it through KaTeX dressing and a prose tail', () => {
    expect(checkAnswerFormat('$203.0\\text{ m}^2$', 'dp:1').ok).toBe(true);
    expect(checkAnswerFormat('$53.1°$ north of east', 'dp:1').ok).toBe(true);
    expect(checkAnswerFormat('$1.93\\text{ m}^2\\text{ per litre}$', 'dp:2').ok).toBe(true);
  });

  // "2\pi" ends in the letters "pi", which must not be eaten as a unit.
  it('does not mistake a symbol for a unit', () => {
    expect(checkAnswerFormat('2\\pi', 'exact').ok).toBe(true);
    expect(checkAnswerFormat('2\\sqrt{3}', 'exact').ok).toBe(true);
    expect(checkAnswerFormat('2.34 \\times 10^9\\text{ L}', 'standard_form').ok).toBe(true);
  });

  it('still fails a form that is genuinely wrong', () => {
    expect(checkAnswerFormat('74', 'dp:1').ok).toBe(false);
    expect(checkAnswerFormat('73.75', 'dp:1').ok).toBe(false);
    expect(checkAnswerFormat('2.5 cm', 'integer').ok).toBe(false);
    expect(checkAnswerFormat('20.25%', 'dp:1').ok).toBe(false);
    expect(checkAnswerFormat('0.5', 'exact').ok).toBe(false);
  });
});

// A TRAILING ZERO IN A WHOLE NUMBER IS AMBIGUOUS, and the numeral cannot say
// which it is: 2540 is 2541 written to three significant figures, and it is
// also an exact count written to four. Counting them "as written" picked one
// reading and rejected the other, which rejected a correctly rounded answer —
// 037d54 asks for the amount due after three years correct to 3 s.f., the
// amount is $2 541, and three figures makes it $2 540.
describe('checkAnswerFormat — significant figures in a whole number', () => {
  it('accepts every reading the numeral can bear', () => {
    expect(checkAnswerFormat('\\$2 540', 'sf:3').ok).toBe(true);
    expect(checkAnswerFormat('2540', 'sf:3').ok).toBe(true);
    expect(checkAnswerFormat('2540', 'sf:4').ok).toBe(true);
    expect(checkAnswerFormat('2500', 'sf:2').ok).toBe(true);
    expect(checkAnswerFormat('2500', 'sf:3').ok).toBe(true);
  });

  it('rejects a reading it cannot', () => {
    expect(checkAnswerFormat('2540', 'sf:2').ok).toBe(false);
    expect(checkAnswerFormat('2541', 'sf:3').ok).toBe(false);
    expect(checkAnswerFormat('2537', 'sf:3').ok).toBe(false);
  });

  // A decimal point settles it: those zeros were written on purpose.
  it('keeps a decimal exact, where nothing is ambiguous', () => {
    expect(checkAnswerFormat('25.40', 'sf:4').ok).toBe(true);
    expect(checkAnswerFormat('25.40', 'sf:3').ok).toBe(false);
    expect(checkAnswerFormat('0.0250', 'sf:3').ok).toBe(true);
    expect(checkAnswerFormat('0.0250', 'sf:2').ok).toBe(false);
  });
});
