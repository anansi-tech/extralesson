import { describe, expect, it } from 'vitest';
import { parseQuantity } from '@/lib/grade/quantity';
import { answersEquivalent } from '@/lib/grade/equivalence';

// The unit used to be parsed off and thrown away, so every quantity collapsed
// to its numeric head. Each case below is one direction of that failure, and
// each is asserted BOTH WAYS ROUND — the comparison is symmetric and a fix
// that only works when the canonical answer happens to be on the left is not a
// fix.
const both = (a: string, b: string) => [answersEquivalent(a, b), answersEquivalent(b, a)];

describe('units are compared, not stripped', () => {
  it('accepts the same quantity however it is spelled', () => {
    for (const [a, b] of [
      ['336 square metres', '336 m²'],
      ['336 sq m', '336 m^2'],
      ['336 metres squared', '336 m2'],
      ['24m', '24 m'],
      ['45 degrees', '45°'],
      ['1000 cm^3', '1 litre'],
    ] as [string, string][]) {
      expect(both(a, b), `${a} = ${b}`).toEqual([true, true]);
    }
  });

  it('rejects the same number in a different unit', () => {
    // The release blocker: this was accepted, and marked a wrong answer right.
    expect(both('72 cm', '72 m')).toEqual([false, false]);
    expect(both('5 cm', '5 kg')).toEqual([false, false]);
    expect(both('12 apples', '12 kg')).toEqual([false, false]);
    expect(both('45°', '45 cm')).toEqual([false, false]);
    expect(both('7 units', '7 cups')).toEqual([false, false]);
  });

  it('rejects the same number in a different dimension of the same unit', () => {
    expect(both('336 m', '336 m²')).toEqual([false, false]);
    expect(both('336 m', '336 square metres')).toEqual([false, false]);
    expect(both('3 m^3', '3 m^2')).toEqual([false, false]);
  });

  it('accepts a conversion that is genuinely the same amount', () => {
    expect(both('0.72 m', '72 cm')).toEqual([true, true]);
    expect(both('5000 g', '5 kg')).toEqual([true, true]);
    expect(both('2.5 kg', '2500 g')).toEqual([true, true]);
    expect(both('2 hours', '120 minutes')).toEqual([true, true]);
    expect(both('1.5 litres', '1500 ml')).toEqual([true, true]);
  });

  it('accepts a bare number, because the question supplied the unit', () => {
    // Omitting the unit is not a mathematical error, and the mark scheme's own
    // answer is where the unit came from.
    expect(both('336', '336 m²')).toEqual([true, true]);
    expect(both('7', '7 units')).toEqual([true, true]);
    // ...but the number still has to be right. 335 is NOT used here: numeric
    // comparison carries a 0.5% tolerance throughout, so 335 and 336 are
    // already the same answer to it. That is pre-existing and separate.
    expect(both('300', '336 m²')).toEqual([false, false]);
  });

  it('handles a rate part-wise, without splitting the answer on its operators', () => {
    expect(both('60 km/h', '60 km/h')).toEqual([true, true]);
    expect(both('60 km/h', '60 km')).toEqual([false, false]);
    expect(parseQuantity('60 km/h')?.dimension).toBe('length/time');
  });

  it('leaves mathematics alone', () => {
    // "pi" is not a unit; reading it as one rejected 5π against its own value.
    expect(both('5 pi', '15.70796327')).toEqual([true, true]);
    expect(parseQuantity('5 pi')).toBeNull();
    // A single letter is algebra, not a unit.
    expect(parseQuantity('3 x')).toBeNull();
    expect(parseQuantity('336')).toBeNull();
  });

  it('normalises to a base unit so conversion is one rule, not a list of cases', () => {
    expect(parseQuantity('72 cm')).toEqual({ value: 0.72, dimension: 'length' });
    expect(parseQuantity('336 m²')).toEqual({ value: 336, dimension: 'area' });
    expect(parseQuantity('2 hours')).toEqual({ value: 7200, dimension: 'time' });
  });
});

// Money was the hole the first pass left: stripMoney deleted the currency so
// every amount reached the comparison as a bare number. Consumer Arithmetic is
// an entire topic, so this is the commonest unit in the bank.
describe('money is a dimension', () => {
  const both = (a: string, b: string) => [answersEquivalent(a, b), answersEquivalent(b, a)];

  it('is not a length', () => {
    expect(both('\\$70', '70 m')).toEqual([false, false]);
    expect(both('\\$70', '70 kg')).toEqual([false, false]);
  });

  it('reads every way the bank writes an amount', () => {
    expect(both('\\$70', '70 dollars')).toEqual([true, true]);
    expect(both('\\$70', 'EC\\$70')).toEqual([true, true]);
    expect(both('\\$17 400', '17400 dollars')).toEqual([true, true]);
  });

  it('knows a dollar is a hundred cents', () => {
    expect(both('\\$0.50', '50 cents')).toEqual([true, true]);
  });

  it('still accepts an amount written without the sign', () => {
    expect(both('\\$70', '70')).toEqual([true, true]);
    expect(both('\\$70', '\\$58')).toEqual([false, false]);
  });

  it('leaves a bare $ alone, because that is a KaTeX delimiter', () => {
    // "$70$" is the number seventy in maths mode. Reading it as currency would
    // make every typeset number an amount.
    expect(both('$70$', '70')).toEqual([true, true]);
  });
});

// Tolerance only where the scheme's answer is itself rounded: a question
// demanding 3 s.f. has a rounded canonical, and a student writing the
// unrounded value has done the mathematics right — they keep the value marks
// and lose the one written for the form. With nothing asked for, exact.
describe('two numbers agree only at a stated rounding', () => {
  it('rejects a difference at the precision given', () => {
    expect(answersEquivalent('335', '336', { kind: 'sf', n: 3 })).toBe(false);
    expect(answersEquivalent('12.7', '12.4', { kind: 'sf', n: 3 })).toBe(false);
  });

  it('accepts the unrounded value against a rounded canonical', () => {
    expect(answersEquivalent('12.7', '12.68', { kind: 'sf', n: 3 })).toBe(true);
    expect(answersEquivalent('36.9', '36.87', { kind: 'dp', n: 1 })).toBe(true);
    expect(answersEquivalent('47', '47.2', { kind: 'dp', n: 0 })).toBe(true);
    expect(answersEquivalent('4.243', '4.24264069', { kind: 'dp', n: 3 })).toBe(true);
  });

  it('is exact when nothing asks for a rounding', () => {
    expect(answersEquivalent('12.7', '12.68')).toBe(false);
    expect(answersEquivalent('3', '3.4')).toBe(false);
  });

  it('still absorbs floating point represented two ways', () => {
    expect(answersEquivalent('1/3', '2/6')).toBe(true);
    // 1000 x 1e-6 is not exactly 0.001 in binary, and a conversion computes it.
    expect(answersEquivalent('1000 cm^3', '1 litre')).toBe(true);
  });
});

// Both of these were found in stored attempts, not imagined: a student was
// marked wrong for typing the multiplication sign their phone offered, and for
// omitting a percent sign the question had already supplied.
describe('typing is not mathematics', () => {
  it('reads a product however the multiplication sign was typed', () => {
    for (const typed of ['8m x 6m', '8 m X 6 m', '8 m * 6 m', '24m by 16m']) {
      const against = typed.startsWith('24') ? '24 m × 16 m' : '8 m × 6 m';
      expect(answersEquivalent(typed, against), typed).toBe(true);
    }
  });

  it('is positional: x between quantities only, never a substitution', () => {
    // Rewriting x to * anywhere else turns every algebraic answer into
    // arithmetic, so a quantity has to sit on both sides of it.
    expect(answersEquivalent('3x', '3x')).toBe(true);
    expect(answersEquivalent('2x + 5', '2x + 5')).toBe(true);
    expect(answersEquivalent('3x', '3 m')).toBe(false);
  });

  it('still compares the quantities in the product', () => {
    expect(answersEquivalent('8 m × 5 m', '8 m × 6 m')).toBe(false);
    expect(answersEquivalent('8 m × 6 kg', '8 m × 6 m')).toBe(false);
    // A product is a product: order carries no meaning.
    expect(answersEquivalent('6 m × 8 m', '8 m × 6 m')).toBe(true);
  });

  it('gives percent the leniency every other unit already had', () => {
    expect(answersEquivalent('4', '4%')).toBe(true);
    expect(answersEquivalent('4%', '0.04')).toBe(true);
    // ...without giving up on it being right, or being a percent.
    expect(answersEquivalent('4%', '5%')).toBe(false);
    expect(answersEquivalent('4%', '4 m')).toBe(false);
  });
});
