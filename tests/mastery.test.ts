import { describe, expect, it } from 'vitest';
import {
  bandFor,
  masteryByObjective,
  moduleMastery,
  objectiveMastery,
  topicMastery,
  topicWeights,
  type AttemptScore,
} from '@/lib/mastery/fold';

describe('objectiveMastery — weighted fold over last 5 attempts', () => {
  it('returns null with no attempts', () => {
    expect(objectiveMastery([])).toBeNull();
  });

  it('weights the most recent attempt heaviest (5..1)', () => {
    // newest-first: [1, 0, 1, 0, 1] -> (5+3+1)/15 = 0.6
    expect(objectiveMastery([1, 0, 1, 0, 1])).toBeCloseTo(0.6);
    // a recent fail drags more than an old fail:
    expect(objectiveMastery([0, 1, 1, 1, 1])!).toBeLessThan(objectiveMastery([1, 1, 1, 1, 0])!);
  });

  it('uses only the last 5 attempts', () => {
    // 6th attempt (oldest) is ignored entirely
    expect(objectiveMastery([1, 1, 1, 1, 1, 0])).toBe(1);
  });

  it('handles fewer than 5 attempts', () => {
    // [1, 0] -> 5/(5+4) = 0.555...
    expect(objectiveMastery([1, 0])).toBeCloseTo(5 / 9);
  });
});

describe('bandFor', () => {
  it('maps mastery to bands from the single config file', () => {
    expect(bandFor(null)).toBe('NOT_STARTED');
    expect(bandFor(0.1)).toBe('WEAK');
    expect(bandFor(0.5)).toBe('BUILDING');
    expect(bandFor(0.8)).toBe('STRONG');
    expect(bandFor(0.75)).toBe('STRONG'); // boundary
    expect(bandFor(0.4)).toBe('BUILDING'); // boundary
  });
});

describe('masteryByObjective', () => {
  it('folds attempts per objective, newest first', () => {
    const attempts: AttemptScore[] = [
      { objective_ids: ['M1.5.1'], score: 0, ts: 1000 },
      { objective_ids: ['M1.5.1'], score: 1, ts: 2000 },
      { objective_ids: ['M1.5.2'], score: 1, ts: 1500 },
    ];
    const m = masteryByObjective(attempts);
    // M1.5.1 newest-first [1, 0] -> 5/9
    expect(m.get('M1.5.1')).toBeCloseTo(5 / 9);
    expect(m.get('M1.5.2')).toBe(1);
  });

  it('credits every objective a question touches', () => {
    const attempts: AttemptScore[] = [
      { objective_ids: ['M1.1.1', 'M1.1.2'], score: 0.5, ts: 1000 },
    ];
    const m = masteryByObjective(attempts);
    expect(m.get('M1.1.1')).toBe(0.5);
    expect(m.get('M1.1.2')).toBe(0.5);
  });
});

describe('topicMastery', () => {
  it('counts untouched objectives as zero', () => {
    const per = new Map([['M1.1.1', 1]]);
    expect(topicMastery(['M1.1.1', 'M1.1.2'], per)).toBe(0.5);
  });
});

describe('topicWeights + moduleMastery — blueprint-weighted rollup', () => {
  const blueprints = [
    {
      paper: 'P1' as const,
      module: 1,
      allocations: [
        { topic_codes: ['T-A'], items: 4 },
        { topic_codes: ['T-B'], items: 2 },
      ],
    },
    {
      paper: 'P2' as const,
      module: 1,
      allocations: [{ topic_codes: ['T-A', 'T-B'], marks: 12 }],
    },
  ];

  it('splits cluster marks equally across cluster topics', () => {
    const w = topicWeights(blueprints, 1);
    expect(w.get('T-A')).toBe(4 + 6); // 4 P1 items + half of 12 P2 marks
    expect(w.get('T-B')).toBe(2 + 6);
  });

  it('weights module mastery by blueprint weight', () => {
    const w = topicWeights(blueprints, 1);
    // T-A mastery 1 (weight 10), T-B mastery 0 (weight 8) -> 10/18
    expect(
      moduleMastery(
        [
          { code: 'T-A', mastery: 1 },
          { code: 'T-B', mastery: 0 },
        ],
        w,
      ),
    ).toBeCloseTo(10 / 18);
  });

  it('returns 0 when no weights match', () => {
    expect(moduleMastery([{ code: 'X', mastery: 1 }], new Map())).toBe(0);
  });
});
