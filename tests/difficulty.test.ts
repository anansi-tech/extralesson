import { describe, expect, it } from 'vitest';
import { actsPerMark, chainDepth, dependsOnEarlier, summarise } from '@/lib/targets/difficulty';

// Difficulty is measured, not asserted: `difficulty` is a label the generator
// gives itself, and a self-assigned label cannot be wrong.

const slot = (label: string, depends_on: string[] = []) => ({ label, depends_on });

describe('actsPerMark — how finely the work is credited', () => {
  it('is 1 when every rubric row is worth one mark, as an examiner writes it', () => {
    expect(
      actsPerMark({
        marks: 3,
        rubric: [
          { mark_value: 1 },
          { mark_value: 1 },
          { mark_value: 1 },
        ],
      }),
    ).toBe(1);
  });

  it('falls below 1 when a row bundles marks a student could earn separately', () => {
    const ratio = actsPerMark({ marks: 3, rubric: [{ mark_value: 3 }] });
    expect(ratio).toBeCloseTo(1 / 3);
  });

  it('says nothing rather than zero when there is no rubric to read', () => {
    expect(actsPerMark({ marks: 1 })).toBeNull();
    expect(actsPerMark({ marks: 1, rubric: [] })).toBeNull();
  });
});

describe('chainDepth — how far a result has to travel', () => {
  it('is 1 when nothing rests on anything, however many parts there are', () => {
    const q = {
      marks: 4,
      parts: [
        { label: 'a', prompt: 'Find x.', slots: [slot('i'), slot('ii')] },
        { label: 'b', prompt: 'Find y.', slots: [slot('i')] },
      ],
    };
    expect(chainDepth(q)).toBe(1);
  });

  it('counts the longest path, not the number of dependencies', () => {
    // a.i -> b.i -> c.i is a chain of three; d.i also rests on a.i but that is
    // a second branch of length two, not a fourth link.
    const q = {
      marks: 4,
      parts: [
        { label: 'a', prompt: 'Factorise.', slots: [slot('i')] },
        { label: 'b', prompt: 'Evaluate.', slots: [slot('i', ['a.i'])] },
        { label: 'c', prompt: 'Deduce.', slots: [slot('i', ['b.i'])] },
        { label: 'd', prompt: 'State.', slots: [slot('i', ['a.i'])] },
      ],
    };
    expect(chainDepth(q)).toBe(3);
  });

  it('reads the declared graph, never the wording', () => {
    // Says "hence" everywhere and declares nothing: the papers chain constantly
    // without saying it, and this bank said it constantly without chaining.
    const loud = {
      marks: 2,
      parts: [
        { label: 'a', prompt: 'Find the total.', slots: [slot('i')] },
        { label: 'b', prompt: 'Hence, or otherwise, find the mean.', slots: [slot('i')] },
      ],
    };
    expect(chainDepth(loud)).toBe(1);

    const quiet = {
      marks: 2,
      parts: [
        { label: 'a', prompt: 'Find the total.', slots: [slot('i')] },
        { label: 'b', prompt: 'Find the mean.', slots: [slot('i', ['a.i'])] },
      ],
    };
    expect(chainDepth(quiet)).toBe(2);
  });

  it('ignores a reference to a slot that is not in the question', () => {
    const q = {
      marks: 1,
      parts: [{ label: 'a', prompt: 'Find x.', slots: [slot('i', ['z.i'])] }],
    };
    expect(chainDepth(q)).toBe(1);
  });

  it('is 0 when there is nothing answerable at all', () => {
    expect(chainDepth({ marks: 0, parts: [] })).toBe(0);
  });
});

describe('dependsOnEarlier — kept only for the one-off backfill', () => {
  it('recognises the wording a question uses when it does announce itself', () => {
    expect(dependsOnEarlier('Hence, calculate the mean.')).toBe(true);
    expect(dependsOnEarlier('Using your answer to part (a), find the total.')).toBe(true);
    expect(dependsOnEarlier('Calculate the area of the trapezium.')).toBe(false);
  });
});

describe('summarise', () => {
  it('reports the median of an even-length set as the midpoint', () => {
    expect(summarise([1, 2, 3, 4]).median).toBe(2.5);
  });

  it('returns zeros rather than NaN for an empty set', () => {
    expect(summarise([])).toEqual({ n: 0, mean: 0, median: 0, min: 0, max: 0 });
  });
});
