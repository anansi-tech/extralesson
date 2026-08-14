import { describe, expect, it } from 'vitest';
import { cosine, normalizeStem, stemContained } from '@/lib/generation/dedup';

describe('normalizeStem', () => {
  it('collapses math and numbers so surface tweaks do not hide duplicates', () => {
    const a = normalizeStem('A farmer sells $3x$ mangoes for EC$12 each.');
    const b = normalizeStem('A farmer sells $5y$ mangoes for EC$40 each.');
    expect(a).toBe(b);
  });
});

describe('stemContained', () => {
  it('detects near-verbatim containment after normalization', () => {
    const a =
      'At a market stall in Castries, a vendor sells mangoes for EC$5 each and pineapples for EC$8 each. Find the total cost of 3 mangoes.';
    const b =
      'At a market stall in Castries, a vendor sells mangoes for EC$7 each and pineapples for EC$9 each. Find the total cost of 4 mangoes.';
    expect(stemContained(a, b)).toBe(true);
  });

  it('does not flag genuinely different questions', () => {
    const a = 'Solve the simultaneous equations $2x + y = 7$ and $x - y = 2$.';
    const b =
      'A cyclist travels from Kingstown to Georgetown at a constant speed, shown on the travel graph.';
    expect(stemContained(a, b)).toBe(false);
  });

  it('requires exact match for very short stems', () => {
    expect(stemContained('Simplify $3x + 2x$.', 'Simplify $9y + 2y$.')).toBe(true); // math collapsed
    expect(stemContained('Simplify $3x + 2x$.', 'Factorise $9y + 2y$.')).toBe(false);
  });
});

describe('cosine', () => {
  it('computes cosine similarity', () => {
    expect(cosine([1, 0], [1, 0])).toBe(1);
    expect(cosine([1, 0], [0, 1])).toBe(0);
    expect(cosine([1, 1], [1, 1])).toBeCloseTo(1);
    expect(cosine([0, 0], [1, 1])).toBe(0);
  });
});
