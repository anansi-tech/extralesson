import { describe, expect, it } from 'vitest';
import { readInputShape } from '@/lib/grade/input-shape';
import { componentsEquivalent, composeAnswer } from '@/lib/grade/components';

// ANSWERS WHOSE ELEMENTS ARE THEMSELVES GROUPS.
//
// A sample space is a set of ordered PAIRS; an enumeration of subsets is a set
// of SETS. The reader split on every comma, and because the outer-brace match
// was greedy it handed the splitter a string with unbalanced braces — so the
// values it produced carried stray braces ("10\\}") and were what the marker
// compared against. A student entering the right answer could not be marked
// right, and could not enter it in the first place.
//
// ORIGINAL fixture data throughout.

const PAIRS = '$\\{(1,H),(2,H)\\}$';
const SUBSETS = '$\\{\\{1,2\\},\\{1,3\\},\\{1,6\\}\\}$';
const LOOSE_SUBSETS = '\\{6,10\\}, \\{2,6,10\\}';

describe('reading an answer whose elements are groups', () => {
  it('keeps the values clean and records where the groups break', () => {
    const r = readInputShape(PAIRS);
    expect(r.shape).toBe('set');
    expect(r.values).toEqual(['1', 'H', '2', 'H']);
    expect(r.groups).toEqual([2, 2]);
    expect(r.groupKind).toBe('(');
    // The defect in one assertion: no value may carry a bracket.
    expect(r.values.some((v) => /[{}()\\]/.test(v))).toBe(false);
  });

  it('reads a set of sets', () => {
    const r = readInputShape(SUBSETS);
    expect(r.values).toEqual(['1', '2', '1', '3', '1', '6']);
    expect(r.groups).toEqual([2, 2, 2]);
    expect(r.groupKind).toBe('{');
  });

  it('reads groups written side by side, with no outer brace', () => {
    const r = readInputShape(LOOSE_SUBSETS);
    expect(r.shape).toBe('set');
    expect(r.values).toEqual(['6', '10', '2', '6', '10']);
    expect(r.groups).toEqual([2, 3]);
  });

  it('leaves an ordinary answer exactly as it was', () => {
    const set = readInputShape('$\\{2,4,6,8,10\\}$');
    expect(set.values).toEqual(['2', '4', '6', '8', '10']);
    expect(set.groups).toBeUndefined();

    expect(readInputShape('(3,-4)').shape).toBe('coordinate');
    expect(readInputShape('$0, 2$').values).toEqual(['0', '2']);
    // A set written as a condition is one box, not a group.
    expect(readInputShape('$\\{x\\in\\mathbb{R}:9\\leq x\\leq12\\}$').boxes).toBe(1);
  });
});

describe('marking a grouped answer', () => {
  it('accepts the answer entered correctly', () => {
    expect(componentsEquivalent(['1', 'H', '2', 'H'], PAIRS)).toBe(true);
    expect(componentsEquivalent(['1', '2', '1', '3', '1', '6'], SUBSETS)).toBe(true);
  });

  it('accepts the groups in any order, because a set has none', () => {
    expect(componentsEquivalent(['2', 'H', '1', 'H'], PAIRS)).toBe(true);
  });

  it('refuses values shuffled ACROSS groups, which is a different answer', () => {
    // Both entries hold the same four values; only the pairing differs, and
    // (1,H),(2,H) is not (1,2),(H,H).
    expect(componentsEquivalent(['1', '2', 'H', 'H'], PAIRS)).toBe(false);
  });

  it('holds a pair to its order and a subset to none', () => {
    // (H,1) is not the outcome (1,H).
    expect(componentsEquivalent(['H', '1', '2', 'H'], PAIRS)).toBe(false);
    // {2,1} is the subset {1,2}.
    expect(componentsEquivalent(['2', '1', '3', '1', '6', '1'], SUBSETS)).toBe(true);
  });

  it('refuses a wrong value however the groups are arranged', () => {
    expect(componentsEquivalent(['1', 'H', '3', 'H'], PAIRS)).toBe(false);
  });
});

describe('recording a grouped answer', () => {
  it('puts the brackets back, so the record is not four loose values', () => {
    const r = readInputShape(PAIRS);
    expect(composeAnswer(['1', 'H', '2', 'H'], r.shape, r)).toBe('{(1, H), (2, H)}');
    const s = readInputShape(SUBSETS);
    expect(composeAnswer(['1', '2', '1', '3', '1', '6'], s.shape, s)).toBe('{{1, 2}, {1, 3}, {1, 6}}');
  });

  it('composes an ungrouped answer exactly as before', () => {
    expect(composeAnswer(['2', '4'], 'set')).toBe('{2, 4}');
    expect(composeAnswer(['3', '-4'], 'coordinate')).toBe('(3, -4)');
    expect(composeAnswer(['1', '2'], 'ratio')).toBe('1 : 2');
  });
});
