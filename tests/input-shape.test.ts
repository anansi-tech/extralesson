import { describe, expect, it } from 'vitest';
import { boxWidthChars, FIXED_ARITY, isMultiValue, readInputShape } from '@/lib/grade/input-shape';
import { componentsEquivalent, composeAnswer } from '@/lib/grade/components';

describe('readInputShape — what input an answer wants', () => {
  it('reads the single-value shapes', () => {
    expect(readInputShape('42').shape).toBe('number');
    expect(readInputShape('72 cm').shape).toBe('quantity');
    expect(readInputShape('$T_n = 0.2n + 1.4$').shape).toBe('expression');
    expect(readInputShape('corresponding angles').shape).toBe('word');
    expect(readInputShape('$x \\le 5$').shape).toBe('inequality');
  });

  it('reads the shapes made of several values, and splits them', () => {
    expect(readInputShape('$(3, 4)$')).toMatchObject({
      shape: 'coordinate',
      boxes: 2,
      values: ['3', '4'],
    });
    expect(readInputShape('\\begin{pmatrix}260\\\\278\\end{pmatrix}')).toMatchObject({
      shape: 'column_vector',
      values: ['260', '278'],
    });
    expect(readInputShape('\\begin{pmatrix}20&20\\\\16&30\\end{pmatrix}')).toMatchObject({
      shape: 'matrix',
      cols: 2,
      values: ['20', '20', '16', '30'],
    });
    expect(readInputShape('18 kg, 27 kg, 36 kg').values).toEqual(['18 kg', '27 kg', '36 kg']);
    expect(readInputShape('$2 : 3$').shape).toBe('ratio');
  });

  it('knows which shapes carry an order', () => {
    expect(readInputShape('$(3, 4)$').ordered).toBe(true);
    expect(readInputShape('$\\{12,24,36\\}$').ordered).toBe(false);
    expect(readInputShape('x = 2 or x = -1/3').ordered).toBe(false);
  });

  // Showing eight boxes for "list the factors of 24" answers the question.
  it('fixes the box count only where the QUESTION fixes it', () => {
    expect(FIXED_ARITY.has('coordinate')).toBe(true);
    expect(FIXED_ARITY.has('column_vector')).toBe(true);
    expect(FIXED_ARITY.has('list')).toBe(false);
    expect(FIXED_ARITY.has('set')).toBe(false);
    expect(isMultiValue('list')).toBe(true);
    expect(isMultiValue('number')).toBe(false);
  });
});

// The defect this fixes ran the other way from the one that was reported: the
// marker was ACCEPTING wrong answers, because a multi-part answer matched as an
// unordered set. 220 slots in the live bank could be told a scrambled answer
// was right.
describe('componentsEquivalent — position is the answer', () => {
  it('rejects the right values in the wrong order', () => {
    expect(componentsEquivalent(['4', '3'], '$(3, 4)$')).toBe(false);
    expect(componentsEquivalent(['278', '260'], '\\begin{pmatrix}260\\\\278\\end{pmatrix}')).toBe(false);
    expect(componentsEquivalent(['30', '16', '20', '20'], '\\begin{pmatrix}20&20\\\\16&30\\end{pmatrix}')).toBe(false);
    expect(componentsEquivalent(['36', '27', '18'], '18 kg, 27 kg, 36 kg')).toBe(false);
  });

  it('accepts them in the right order', () => {
    expect(componentsEquivalent(['3', '4'], '$(3, 4)$')).toBe(true);
    expect(componentsEquivalent(['260', '278'], '\\begin{pmatrix}260\\\\278\\end{pmatrix}')).toBe(true);
    expect(componentsEquivalent(['20', '20', '16', '30'], '\\begin{pmatrix}20&20\\\\16&30\\end{pmatrix}')).toBe(true);
  });

  it('leaves genuinely unordered shapes unordered', () => {
    expect(componentsEquivalent(['36', '12', '24'], '$\\{12,24,36\\}$')).toBe(true);
    expect(componentsEquivalent(['36', '12', '25'], '$\\{12,24,36\\}$')).toBe(false);
  });

  it('still applies full equivalence inside each box', () => {
    expect(componentsEquivalent(['1.6', '1.8', '2.0', '2.2'], '$1.6, \\frac{9}{5}, 2.0, \\frac{11}{5}$')).toBe(true);
    expect(componentsEquivalent(['18', '27', '36'], '18 kg, 27 kg, 36 kg')).toBe(true);
  });

  it('requires the right number of values', () => {
    expect(componentsEquivalent(['3'], '$(3, 4)$')).toBe(false);
    expect(componentsEquivalent(['3', '4', '5'], '$(3, 4)$')).toBe(false);
  });

  it('honours the mark scheme accept list', () => {
    expect(componentsEquivalent(['1', '2'], '$(2, 1)$', ['$(1, 2)$'])).toBe(true);
  });
});

describe('composeAnswer — the record reads the way the papers write it', () => {
  it('writes each shape in its own notation', () => {
    expect(composeAnswer(['3', '4'], 'coordinate')).toBe('(3, 4)');
    expect(composeAnswer(['2', '3'], 'ratio')).toBe('2 : 3');
    expect(composeAnswer(['12', '24'], 'set')).toBe('{12, 24}');
    expect(composeAnswer(['260', '278'], 'column_vector')).toBe('[260, 278]');
  });
});

// A fixed 64px box held about seven monospace characters, which is fine for a
// coordinate and too narrow for a word in a set or a value in a ratio. The
// width comes from what the student will TYPE, not from the mark scheme's
// markup: the key writes \frac{9}{5} — eleven characters — and the student
// types 9/5, which is three.
describe('boxWidthChars — a box is as wide as its answer needs', () => {
  const chars = (answer: string) => boxWidthChars(readInputShape(answer));

  it('measures the typed form, not the KaTeX', () => {
    // Four values, the longest typing as 9/5 or 11/5 — nothing near eleven.
    expect(chars('$1.6, \\frac{9}{5}, 2.0, \\frac{11}{5}$')).toBe(5);
  });

  it('widens for a set of words', () => {
    expect(chars('$\\{Mango, Coconut, Breadfruit\\}$')).toBe(10);
  });

  it('keeps short numeric answers compact', () => {
    expect(chars('$(3, 4)$')).toBe(5);
    expect(chars('1:2')).toBe(5);
  });

  // One width for the whole slot: a narrow box beside a wide one would say
  // which answer is the short one.
  it('sizes every box in a slot to the longest value', () => {
    const uneven = readInputShape('$\\{2, 144000\\}$');
    expect(boxWidthChars(uneven)).toBe(Math.max(5, '144000'.length));
  });
});

// A DELIMITER IS NOT PART OF THE VALUE.
//
// bare() strips the $ at the ENDS of an answer, so splitting a list left the
// inner ones stranded inside the values — "16.8$ kg" — in the boxes and in
// what the marker compares against. Eight approved slots carried one.
describe('a split value carries no leftover notation', () => {
  const values = (a: string) => readInputShape(a).values;

  it('drops the maths delimiters between values', () => {
    expect(values('$16.8$ kg, $8.4$ kg')).toEqual(['16.8 kg', '8.4 kg']);
    expect(values('$t=1$ or $t=2$')).toEqual(['t=1', 't=2']);
  });

  it('keeps an ESCAPED dollar, which is money and not a delimiter', () => {
    expect(values('\\$1 860, \\$3 150')).toEqual(['\\$1 860', '\\$3 150']);
  });

  it('drops a thin-space command left at the edge of a value', () => {
    expect(values('$n=6,\\ W=2$')).toEqual(['n=6', 'W=2']);
  });
});

// "OR" IS AN ORDINARY ENGLISH WORD.
//
// Matching on it alone read a described answer — "the common region on or
// below both lines" — as two roots, and made half a sentence the thing the
// marker compared against.
describe('roots are told apart from prose that says "or"', () => {
  it('reads a real pair of roots', () => {
    expect(readInputShape('x = 2 or x = -1/3').shape).toBe('roots');
    expect(readInputShape('$t=\\frac{5-\\sqrt{5}}{2}$ or $t=\\frac{5+\\sqrt{5}}{2}$').boxes).toBe(2);
  });

  it('does not split a sentence that happens to contain "or"', () => {
    const prose =
      'Solid boundary lines $3x+2y=24$ and $x+y=10$ are drawn. The common region on or below both lines in the first quadrant is shaded.';
    const r = readInputShape(prose);
    expect(r.shape).not.toBe('roots');
    expect(r.boxes).toBe(1);
  });
});
