import { describe, expect, it } from 'vitest';
import { buildSession, hasMarkableParts, type CandidateQuestion } from '@/lib/session/builder';
import { M1_PREREQ_THRESHOLD } from '@/lib/mastery/config';

function q(
  id: string,
  module: 1 | 2 | 3,
  objective: string,
  kind: 'mcq' | 'structured' = 'mcq',
): CandidateQuestion {
  return { id, module, objective_ids: [objective], kind };
}

const weights = new Map([
  ['M1.1.', 10],
  ['M1.5.', 8],
  ['M2.3.', 10],
  ['M3.1.', 6],
]);

describe('buildSession — M1 prerequisite ordering', () => {
  const candidates = [
    q('m2a', 2, 'M2.3.1'),
    q('m1a', 1, 'M1.1.1'),
    q('m3a', 3, 'M3.1.1'),
    q('m1b', 1, 'M1.5.1'),
  ];

  it('puts M1 questions first on a cold account (M1 mastery below threshold)', () => {
    const picked = buildSession({
      candidates,
      perObjectiveMastery: new Map(),
      m1Mastery: 0,
      targetModules: [1, 2, 3],
      topicWeightByPrefix: weights,
      size: 4,
    });
    expect(picked.slice(0, 2).every((p) => p.module === 1)).toBe(true);
  });

  it('drops the gate once M1 mastery clears the threshold', () => {
    const mastery = new Map([
      ['M1.1.1', 0.9],
      ['M1.5.1', 0.9],
      ['M2.3.1', 0.1],
      ['M3.1.1', 0.2],
    ]);
    const picked = buildSession({
      candidates,
      perObjectiveMastery: mastery,
      m1Mastery: M1_PREREQ_THRESHOLD + 0.2,
      targetModules: [1, 2, 3],
      topicWeightByPrefix: weights,
      size: 2,
    });
    // Weakest, blueprint-heaviest objectives first: M2.3.1 then M3.1.1
    expect(picked[0].id).toBe('m2a');
    expect(picked[1].id).toBe('m3a');
  });
});

describe('buildSession — weakest-first within target modules', () => {
  it('ranks weaker objectives ahead of stronger ones', () => {
    const candidates = [q('strong', 1, 'M1.1.1'), q('weak', 1, 'M1.1.2'), q('mid', 1, 'M1.1.3')];
    const mastery = new Map([
      ['M1.1.1', 0.9],
      ['M1.1.2', 0.1],
      ['M1.1.3', 0.5],
    ]);
    const picked = buildSession({
      candidates,
      perObjectiveMastery: mastery,
      m1Mastery: 0.6,
      targetModules: [1],
      topicWeightByPrefix: weights,
      size: 3,
    });
    expect(picked.map((p) => p.id)).toEqual(['weak', 'mid', 'strong']);
  });

  it('excludes questions outside the target modules', () => {
    const candidates = [q('m1', 1, 'M1.1.1'), q('m2', 2, 'M2.3.1')];
    const picked = buildSession({
      candidates,
      perObjectiveMastery: new Map(),
      m1Mastery: 0,
      targetModules: [2],
      topicWeightByPrefix: weights,
      size: 8,
    });
    expect(picked.map((p) => p.id)).toEqual(['m2']);
  });

  it('biases toward blueprint-heavy topics at equal mastery', () => {
    const candidates = [q('light', 3, 'M3.1.1'), q('heavy', 2, 'M2.3.1')];
    const picked = buildSession({
      candidates,
      perObjectiveMastery: new Map(),
      m1Mastery: 1,
      targetModules: [2, 3],
      topicWeightByPrefix: weights,
      size: 2,
    });
    expect(picked[0].id).toBe('heavy');
  });
});

describe('buildSession — kind blend and coverage', () => {
  it('blends roughly 60/40 structured/mcq when both pools are deep', () => {
    const candidates = [
      ...Array.from({ length: 8 }, (_, i) => q(`s${i}`, 1, `M1.1.${i + 1}`, 'structured')),
      ...Array.from({ length: 8 }, (_, i) => q(`m${i}`, 1, `M1.5.${i + 1}`, 'mcq')),
    ];
    const picked = buildSession({
      candidates,
      perObjectiveMastery: new Map(),
      m1Mastery: 0,
      targetModules: [1],
      topicWeightByPrefix: weights,
      size: 8,
    });
    expect(picked).toHaveLength(8);
    expect(picked.filter((p) => p.kind === 'structured')).toHaveLength(5);
    expect(picked.filter((p) => p.kind === 'mcq')).toHaveLength(3);
  });

  it('degrades gracefully when one kind is unavailable', () => {
    const candidates = Array.from({ length: 8 }, (_, i) => q(`m${i}`, 1, `M1.1.${i + 1}`, 'mcq'));
    const picked = buildSession({
      candidates,
      perObjectiveMastery: new Map(),
      m1Mastery: 0,
      targetModules: [1],
      topicWeightByPrefix: weights,
      size: 8,
    });
    expect(picked).toHaveLength(8);
    expect(picked.every((p) => p.kind === 'mcq')).toBe(true);
  });

  it('spreads across objectives before repeating one', () => {
    const candidates = [
      q('a1', 1, 'M1.1.1'),
      q('a2', 1, 'M1.1.1'),
      q('b1', 1, 'M1.1.2'),
      q('c1', 1, 'M1.1.3'),
    ];
    const picked = buildSession({
      candidates,
      perObjectiveMastery: new Map(),
      m1Mastery: 0,
      targetModules: [1],
      topicWeightByPrefix: weights,
      size: 3,
    });
    const objectives = picked.map((p) => p.objective_ids[0]);
    expect(new Set(objectives).size).toBe(3);
  });

  it('returns fewer than size when the bank is small, never errors', () => {
    const picked = buildSession({
      candidates: [q('only', 1, 'M1.1.1')],
      perObjectiveMastery: new Map(),
      m1Mastery: 0,
      targetModules: [1],
      topicWeightByPrefix: weights,
    });
    expect(picked).toHaveLength(1);
  });
});

describe('buildSession — a question enters the pool when it has anything to mark (R1.6 §1)', () => {
  const withModes = (id: string, modes: string[]): CandidateQuestion => ({
    ...q(id, 1, 'M1.1.1', 'structured'),
    response_modes: modes,
  });

  it('treats a question with no recorded modes as answerable, as before', () => {
    expect(hasMarkableParts(q('legacy', 1, 'M1.1.1'))).toBe(true);
    expect(hasMarkableParts(withModes('all-answer', ['answer', 'answer']))).toBe(true);
  });

  it('keeps a mixed question: its marked parts are still worth practising', () => {
    expect(hasMarkableParts(withModes('mixed', ['answer', 'show_that']))).toBe(true);
    expect(hasMarkableParts(withModes('reasoned', ['answer', 'explain', 'answer']))).toBe(true);
  });

  it('drops a question with nothing to mark at all', () => {
    expect(hasMarkableParts(withModes('all-prose', ['show_that', 'explain']))).toBe(false);
  });

  it('picks a mixed question over a plain one when its objective is weaker', () => {
    const picked = buildSession({
      candidates: [withModes('mixed', ['answer', 'explain']), q('plain', 1, 'M1.5.1', 'structured')],
      perObjectiveMastery: new Map([['M1.5.1', 0.9]]),
      m1Mastery: 0,
      targetModules: [1],
      topicWeightByPrefix: weights,
      size: 1,
    });
    expect(picked.map((p) => p.id)).toEqual(['mixed']);
  });

  it('returns an empty session when nothing in the bank can be marked', () => {
    const picked = buildSession({
      candidates: [withModes('a', ['show_that']), withModes('b', ['explain'])],
      perObjectiveMastery: new Map(),
      m1Mastery: 0,
      targetModules: [1],
      topicWeightByPrefix: weights,
    });
    expect(picked).toEqual([]);
  });
});
