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
    expect(answersEquivalent('3.8977', '3.90')).toBe(false);
  });

  it('accepts 1/3 against 0.333 only under a stated rounding', () => {
    expect(answersEquivalent('1/3', '0.333')).toBe(false);
    expect(answersEquivalent('1/3', '0.333', { kind: 'dp', n: 3 })).toBe(true);
    expect(answersEquivalent('1/3', '0.333', { kind: 'sf', n: 3 })).toBe(true);
    expect(answersEquivalentAny('0.333', '1/3', ['0.33'], { kind: 'dp', n: 2 })).toBe(true);
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
