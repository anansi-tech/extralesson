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
    // ...but the number still has to be right.
    expect(both('335', '336 m²')).toEqual([false, false]);
  });

  it('handles a rate part-wise, without splitting the answer on its operators', () => {
    expect(both('60 km/h', '60 km/h')).toEqual([true, true]);
    expect(both('60 km/h', '60 km')).toEqual([false, false]);
    expect(parseQuantity('60 km/h')?.dimension).toBe('length/time');
  });

  it('leaves mathematics alone', () => {
    // "pi" is not a unit; reading it as one rejected 5π against its own value.
    expect(both('5 pi', '15.70796')).toEqual([true, true]);
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
