import { describe, expect, it } from 'vitest';
import { answersEquivalent, answersEquivalentAny } from '@/lib/grade/equivalence';
import { roundingOf } from '@/lib/grade/rounding';
import { markStructuredParts } from '@/lib/grade/mark';
import type { RubricItem } from '@/lib/types';

// TOLERANCE ONLY WHERE THE SCHEME'S ANSWER IS ITSELF ROUNDED. The old rule
// compared to the precision of the less precise number, which accepted 26.5
// for 27 on a question that asked for nothing of the kind (golden b1a6a2).
describe('numbers are exact unless a rounding is stated', () => {
  it('rejects 26.5 against 27, and 23.5 against 23', () => {
    expect(answersEquivalent('26.5', '27')).toBe(false);
    expect(answersEquivalent('23.5', '23')).toBe(false);
  });

  it('accepts 3.8977 against 3.90 when 3 s.f. is required', () => {
    expect(answersEquivalent('3.8977', '3.90', { kind: 'sf', n: 3 })).toBe(true);
    expect(answersEquivalent('3.8977', '3.90')).toBe(false); // 3.90 terminates: exact by default
  });

  it('accepts 0.333 against 1/3 by the general instruction, and 0.33 only under a stated rounding', () => {
    expect(answersEquivalent('0.333', '1/3')).toBe(true); // a third cannot terminate: 3 s.f.
    expect(answersEquivalent('0.33', '1/3')).toBe(false);
    expect(answersEquivalent('0.33', '1/3', { kind: 'dp', n: 2 })).toBe(true);
    expect(answersEquivalent('0.333', '1/3', null)).toBe(false); // null is exact
    expect(answersEquivalentAny('0.33', '1/3', ['0.33'], { kind: 'dp', n: 2 })).toBe(true);
  });

  it('is exact for a canonical that terminates, 3 s.f. for one that cannot', () => {
    expect(roundingOf({ canonical: '27' })).toBeNull();
    expect(roundingOf({ canonical: '12.68' })).toBeNull();
    expect(roundingOf({ canonical: '\\frac{3}{8}' })).toBeNull(); // 0.375
    expect(roundingOf({ canonical: '$\\frac{1}{3}$' })).toEqual({ kind: 'sf', n: 3 });
    expect(roundingOf({ canonical: '3\\sqrt{2}' })).toEqual({ kind: 'sf', n: 3 });
    expect(roundingOf({ canonical: '\\sqrt{9}' })).toBeNull(); // 3
    expect(roundingOf({ canonical: '5\\pi' })).toEqual({ kind: 'sf', n: 3 });
    expect(roundingOf({ canonical: '$(4,1)$' })).toBeNull();
    expect(roundingOf({ canonical: 'x = -1/3 or x = 2' })).toEqual({ kind: 'sf', n: 3 });
    // A stated rounding overrides the default either way.
    expect(roundingOf({ canonical: '1/3', answer_format: 'dp:2' })).toEqual({ kind: 'dp', n: 2 });
    expect(roundingOf({ canonical: '27', prompts: ['to 1 decimal place'] })).toEqual({ kind: 'dp', n: 1 });
  });

  it('still absorbs representation error with no rounding at all', () => {
    expect(answersEquivalent('1000 cm^3', '1 litre')).toBe(true);
    expect(answersEquivalent('1/3', '2/6')).toBe(true);
  });
});

describe('roundingOf reads the format first, then the wording', () => {
  it('reads sf:N, dp:N and integer from the declared format', () => {
    expect(roundingOf({ answer_format: 'sf:3' })).toEqual({ kind: 'sf', n: 3 });
    expect(roundingOf({ answer_format: 'dp:2' })).toEqual({ kind: 'dp', n: 2 });
    expect(roundingOf({ answer_format: 'integer' })).toEqual({ kind: 'dp', n: 0 });
    expect(roundingOf({ answer_format: 'exact' })).toBeNull();
  });

  it('reads the question when the format field is silent', () => {
    expect(roundingOf({ prompts: ['Calculate the length, correct to 2 decimal places.'] })).toEqual({ kind: 'dp', n: 2 });
    expect(roundingOf({ prompts: ['Give your answer to 3 s.f.'] })).toEqual({ kind: 'sf', n: 3 });
    expect(roundingOf({ prompts: [undefined, 'to the nearest cent'] })).toEqual({ kind: 'dp', n: 2 });
    expect(roundingOf({ prompts: ['to the nearest whole number'] })).toEqual({ kind: 'dp', n: 0 });
    expect(roundingOf({ prompts: ['Calculate the area.'] })).toBeNull();
  });
});

describe('the marker applies it per slot', () => {
  const rubric: RubricItem[] = [
    { code: 'AK1', profile: 'AK', criterion: 'value', mark_value: 1, slot_ref: 'a.i', part_label: 'a' },
  ];
  it('takes the wording of the part into account', () => {
    const parts = [{ label: 'a', prompt: 'Find the length, to 3 significant figures.', slots: [{ label: 'i', answer: '3.90' }] }];
    expect(markStructuredParts(rubric, parts, [{ ref: 'a.i', answer: '3.8977' }]).correct).toBe(true);
    const exact = [{ label: 'a', prompt: 'Find the length.', slots: [{ label: 'i', answer: '3.90' }] }];
    expect(markStructuredParts(rubric, exact, [{ ref: 'a.i', answer: '3.8977' }]).correct).toBe(false);
  });
});
