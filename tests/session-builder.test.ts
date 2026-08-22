import { describe, expect, it } from 'vitest';
import {
  buildSession,
  estimatedMinutes,
  hasMarkableParts,
  SESSION_MINUTES,
  type CandidateQuestion,
} from '@/lib/session/builder';
import { M1_PREREQ_THRESHOLD } from '@/lib/mastery/config';

function q(
  id: string,
  module: 1 | 2 | 3,
  objective: string,
  kind: 'mcq' | 'structured' = 'mcq',
  marks = kind === 'mcq' ? 1 : 3,
): CandidateQuestion {
  return { id, module, objective_ids: [objective], kind, marks };
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
      minutes: 6,
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
      minutes: 3,
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
      minutes: 4.5,
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
      minutes: 12,
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
      minutes: 3,
    });
    expect(picked[0].id).toBe('heavy');
  });
});

describe('buildSession — kind blend and coverage', () => {
  // The blend is of MINUTES now, not of question counts (R1.8 §2): five
  // structured questions and three MCQs was a 60/40 split of a number that
  // meant nothing to the student, while their session ran an hour.
  it('blends roughly 60/40 structured/mcq by time when both pools are deep', () => {
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
      minutes: 30,
    });
    const spent = picked.reduce((s, p) => s + estimatedMinutes(p), 0);
    const structured = picked
      .filter((p) => p.kind === 'structured')
      .reduce((s, p) => s + estimatedMinutes(p), 0);
    // Fills the budget to within one question of it — here the MCQ pool runs
    // dry first and the cheapest structured question left will not fit.
    expect(spent).toBeGreaterThan(24);
    expect(structured / spent).toBeGreaterThan(0.5);
    expect(picked.some((p) => p.kind === 'mcq')).toBe(true);
  });

  it('degrades gracefully when one kind is unavailable', () => {
    const candidates = Array.from({ length: 8 }, (_, i) => q(`m${i}`, 1, `M1.1.${i + 1}`, 'mcq'));
    const picked = buildSession({
      candidates,
      perObjectiveMastery: new Map(),
      m1Mastery: 0,
      targetModules: [1],
      topicWeightByPrefix: weights,
      minutes: 12,
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
      minutes: 4.5,
    });
    const objectives = picked.map((p) => p.objective_ids[0]);
    expect(new Set(objectives).size).toBe(3);
  });

  it('returns fewer than the budget when the bank is small, never errors', () => {
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
      minutes: 1,
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

// R1.8 §2 — what a session IS, now that a question is a whole paper question.
describe('buildSession — a session is a budget of work', () => {
  it('spends a 15-minute session on one paper-shaped question, not eight fragments', () => {
    const candidates = [
      q('paper', 1, 'M1.1.1', 'structured', 10),
      ...Array.from({ length: 8 }, (_, i) => q(`m${i}`, 1, `M1.5.${i + 1}`, 'mcq')),
    ];
    const picked = buildSession({
      candidates,
      perObjectiveMastery: new Map(),
      m1Mastery: 0,
      targetModules: [1],
      topicWeightByPrefix: weights,
    });
    expect(picked[0].id).toBe('paper');
    expect(picked.length).toBeLessThanOrEqual(2);
    expect(estimatedMinutes(picked[0])).toBeGreaterThan(SESSION_MINUTES);
  });

  it('buys the first question even when it costs more than the whole budget', () => {
    const picked = buildSession({
      candidates: [q('big', 1, 'M1.1.1', 'structured', 12)],
      perObjectiveMastery: new Map(),
      m1Mastery: 0,
      targetModules: [1],
      topicWeightByPrefix: weights,
      minutes: 5,
    });
    expect(picked.map((p) => p.id)).toEqual(['big']);
  });

  it('prefers the question that covers MORE of the student weak objectives', () => {
    // Same weakness per objective; the multi-topic question covers three of
    // them and the drill item one, which is the whole point of §2.
    const spanning: CandidateQuestion = {
      id: 'spanning',
      module: 1,
      objective_ids: ['M1.1.1', 'M1.1.2', 'M1.1.3'],
      kind: 'structured',
      marks: 9,
    };
    const picked = buildSession({
      candidates: [q('narrow', 1, 'M1.1.1', 'structured', 9), spanning],
      perObjectiveMastery: new Map(),
      m1Mastery: 0,
      targetModules: [1],
      topicWeightByPrefix: weights,
    });
    expect(picked[0].id).toBe('spanning');
  });
});

// THE MODES. 'adaptive' is the default and is what every test above exercises;
// these cover the three things a student knows about their own week that the
// app cannot — what class covered today, what they got wrong, and that it has
// never seen them work.
describe('buildSession — practise a topic', () => {
  const candidates = [
    q('geom1', 3, 'M3.3.1', 'structured', 4),
    q('geom2', 3, 'M3.3.7', 'structured', 4),
    q('alg', 1, 'M1.5.1', 'structured', 4),
    q('stats', 2, 'M2.1.1', 'structured', 4),
  ];
  const base = {
    candidates,
    perObjectiveMastery: new Map<string, number>(),
    m1Mastery: 0,
    targetModules: [1, 2, 3] as (1 | 2 | 3)[],
    topicWeightByPrefix: weights,
  };

  it('returns only questions from the topic asked for', () => {
    const picked = buildSession({ ...base, mode: 'topic', focusPrefixes: ['M3.3.'] });
    expect(picked.length).toBeGreaterThan(0);
    expect(picked.every((p) => p.objective_ids.some((o) => o.startsWith('M3.3.')))).toBe(true);
  });

  // The gate exists to stop the app sending a cold account to M3. A student who
  // typed "circle theorems" has overruled that on purpose.
  it('does not hold M3 back behind the M1 prerequisite', () => {
    const picked = buildSession({
      ...base,
      m1Mastery: M1_PREREQ_THRESHOLD - 0.1,
      mode: 'topic',
      focusPrefixes: ['M3.3.'],
    });
    expect(picked.length).toBeGreaterThan(0);
    expect(picked[0].module).toBe(3);
  });

  it('comes back empty for a topic with nothing in the bank', () => {
    expect(buildSession({ ...base, mode: 'topic', focusPrefixes: ['M2.9.'] })).toEqual([]);
  });
});

describe('buildSession — revisit mistakes', () => {
  const candidates = [
    q('missed-a', 1, 'M1.1.1', 'structured', 4),
    q('missed-b', 1, 'M1.5.1', 'structured', 4),
    q('never-wrong', 1, 'M1.1.9', 'structured', 4),
  ];
  const base = {
    candidates,
    perObjectiveMastery: new Map<string, number>(),
    m1Mastery: 1,
    targetModules: [1, 2, 3] as (1 | 2 | 3)[],
    topicWeightByPrefix: weights,
    mode: 'revisit' as const,
  };

  it('only sets objectives the student actually lost marks on', () => {
    const picked = buildSession({ ...base, lostByObjective: new Map([['M1.1.1', 3]]) });
    expect(picked.map((p) => p.id)).toEqual(['missed-a']);
  });

  it('ranks by the marks that were lost', () => {
    const picked = buildSession({
      ...base,
      lostByObjective: new Map([
        ['M1.1.1', 1],
        ['M1.5.1', 9],
      ]),
    });
    expect(picked[0].id).toBe('missed-b');
  });

  // Re-showing the same question tests whether the answer was remembered, which
  // is not what was got wrong.
  it('never re-shows a question already attempted', () => {
    const picked = buildSession({
      ...base,
      lostByObjective: new Map([['M1.1.1', 3]]),
      attemptedIds: new Set(['missed-a']),
    });
    expect(picked).toEqual([]);
  });
});

describe('buildSession — diagnostic', () => {
  // Four topics, several questions each, so a session COULD sit inside one.
  const candidates = ['M1.1.', 'M1.5.', 'M2.3.', 'M3.1.'].flatMap((prefix) =>
    [1, 2, 3].map((n) => q(`${prefix}${n}`, 1, `${prefix}${n}`)),
  );
  const base = {
    candidates,
    perObjectiveMastery: new Map<string, number>(),
    m1Mastery: 0,
    targetModules: [1, 2, 3] as (1 | 2 | 3)[],
    topicWeightByPrefix: weights,
    mode: 'diagnostic' as const,
  };

  it('spreads across topics rather than drilling one', () => {
    const picked = buildSession(base);
    const topics = new Set(picked.map((p) => p.objective_ids[0].slice(0, 5)));
    expect(topics.size).toBe(4);
  });

  it('buys the cheap items, so the budget reports on more topics', () => {
    const withBoth = [...candidates, q('long', 1, 'M1.1.4', 'structured', 12)];
    const picked = buildSession({ ...base, candidates: withBoth });
    expect(picked.every((p) => p.kind === 'mcq')).toBe(true);
  });
});

// COVER BEFORE DEEPEN.
//
// Priority is (1 - mastery) x blueprint weight, and weight can cancel the
// mastery gap: a heavy topic already at 15% scores 0.85 x 10 = 8.5 an
// objective, an untouched lighter one 1.0 x 7.5 = 7.5. So the session kept
// returning to topics the student had seen. After sixteen sessions a real
// account had four topics it had never once been sent to, and the best
// candidate in an untouched topic sat at rank 12 of 216.
//
// Mastery cannot express this on its own: an objective never seen and one
// answered wrong both read 0. Which topics have been OPENED is separate
// evidence, and it decides first.
describe('buildSession — a topic never opened comes first', () => {
  const heavy = new Map([
    ['M1.1.', 10], // touched, and the heaviest topic
    ['M1.3.', 7.5], // never opened, and lighter
  ]);
  const candidates = [
    { id: 'touched', module: 1 as const, objective_ids: ['M1.1.1', 'M1.1.2', 'M1.1.3'], kind: 'structured' as const, marks: 6 },
    { id: 'unopened', module: 1 as const, objective_ids: ['M1.3.1', 'M1.3.2'], kind: 'structured' as const, marks: 6 },
  ];
  const base = {
    candidates,
    // The touched topic is part way through; the untouched one reads 0 because
    // nothing has been asked, which is the same number for a different reason.
    perObjectiveMastery: new Map([
      ['M1.1.1', 0.15],
      ['M1.1.2', 0.15],
      ['M1.1.3', 0.15],
    ]),
    m1Mastery: 0.15,
    targetModules: [1, 2, 3] as (1 | 2 | 3)[],
    topicWeightByPrefix: heavy,
  };

  it('sends the student to the unopened topic, not the heavier familiar one', () => {
    const picked = buildSession({
      ...base,
      attemptedObjectives: new Set(['M1.1.1', 'M1.1.2', 'M1.1.3']),
    });
    expect(picked[0].id).toBe('unopened');
  });

  it('falls back to weight times deficit once every topic has been opened', () => {
    const picked = buildSession({
      ...base,
      attemptedObjectives: new Set(['M1.1.1', 'M1.1.2', 'M1.1.3', 'M1.3.1', 'M1.3.2']),
    });
    // Both topics are started now, so the heavier one wins on its deficit.
    expect(picked[0].id).toBe('touched');
  });

  // Without the evidence it behaves as it did before, which keeps every other
  // caller and every stored session unchanged.
  it('is unchanged when no attempt history is supplied', () => {
    expect(buildSession(base)[0].id).toBe('touched');
  });
});
