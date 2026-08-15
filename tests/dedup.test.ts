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

// One approved question whose entire stem was "Use the information above to
// answer the parts below" rejected 25 consecutive drafts on the same recipe:
// normalised, that sentence is 51 characters and is contained in every stem
// that opens the same way. A lead-in is not what makes a question that question.
describe('boilerplate lead-ins do not make two questions the same', () => {
  const lead = 'Use the information above to answer the parts below.';

  it('strips the lead-in, leaving nothing to match on', () => {
    expect(normalizeStem(lead).trim()).toBe('');
    expect(normalizeStem('Use the table to answer the questions below.').trim()).toBe('');
    expect(normalizeStem('Refer to the diagram shown to answer the parts that follow.').trim()).toBe('');
  });

  it('no longer calls two unrelated questions duplicates', () => {
    const a = `${lead} A refrigerator listed at EC$1800 is reduced by 15%, and a sales tax of 12.5% is added.`;
    const b = `${lead} A vendor buys 24 mangoes for EC$60 and sells them at EC$4 each.`;
    expect(stemContained(a, b)).toBe(false);
    expect(stemContained(a, lead)).toBe(false);
  });

  it('still catches a question that really is the same one', () => {
    const a = 'A refrigerator listed at EC$1800 is reduced by 15%. Find the sale price.';
    const b = `${lead} A refrigerator listed at EC$2400 is reduced by 20%. Find the sale price.`;
    expect(stemContained(a, b)).toBe(true);
  });

  it('keeps the rest of the stem intact', () => {
    const n = normalizeStem(`${lead} A vendor buys 24 mangoes for EC$60.`);
    expect(n).toContain('vendor buys');
    expect(n).not.toContain('answer the parts');
  });
});
