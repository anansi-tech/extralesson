import { describe, expect, it } from 'vitest';
import { attributeBySlot, computeStudyState } from '@/lib/study/state';
import { attemptOutcome } from '@/lib/study/outcome';
import { buildSession } from '@/lib/session/builder';

// ROUND_6 Task 6: mastery is attributed per slot, and unseen is unknown.
const question = {
  objective_ids: ['M1.1.1', 'M1.1.2'],
  parts: [
    { label: 'a', slots: [{ label: 'i', response_mode: 'answer', objective_id: 'M1.1.1' }] },
    { label: 'b', slots: [{ label: 'i', response_mode: 'answer', objective_id: 'M1.1.2' }] },
  ],
  rubric: [
    { code: 'A1', profile: 'AK' as const, mark_value: 2, slot_ref: 'a.i' },
    { code: 'B1', profile: 'AK' as const, mark_value: 3, slot_ref: 'b.i' },
  ],
};

describe('a two-objective attempt', () => {
  it('moves (a) right and (b) wrong in opposite directions', () => {
    const outcome = attemptOutcome({ rubric_awarded: ['A1'] }, question);
    const by = attributeBySlot(outcome, question);
    expect(by.get('M1.1.1')).toEqual({ earned: 2, assessed: 2 });
    expect(by.get('M1.1.2')).toEqual({ earned: 0, assessed: 3 });
  });

  it('falls back to the question’s first objective for a slot that names none', () => {
    const bare = { ...question, parts: [{ label: 'a', slots: [{ label: 'i' }] }, { label: 'b', slots: [{ label: 'i' }] }] };
    const by = attributeBySlot(attemptOutcome({ rubric_awarded: ['A1'] }, bare), bare);
    expect(by.get('M1.1.1')).toEqual({ earned: 2, assessed: 5 });
    expect(by.has('M1.1.2')).toBe(false);
  });

  it('keeps an unassessed row out of both', () => {
    const withPaper = {
      ...question,
      parts: [...question.parts, { label: 'c', slots: [{ label: 'i', response_mode: 'show_that', objective_id: 'M1.2.1' }] }],
      rubric: [...question.rubric, { code: 'R1', profile: 'R' as const, mark_value: 1, slot_ref: 'c.i' }],
    };
    const by = attributeBySlot(attemptOutcome({ rubric_awarded: ['A1'] }, withPaper), withPaper);
    expect(by.has('M1.2.1')).toBe(false);
  });
});

describe('unseen is unknown', () => {
  const topics = [
    { code: 'T1', title: 'One', module: 1 as const, order: 1, objectives: [{ id: 'M1.1.1', text: 'a' }, { id: 'M1.1.2', text: 'b' }] },
    { code: 'T2', title: 'Two', module: 1 as const, order: 2, objectives: [{ id: 'M1.2.1', text: 'c' }] },
  ];
  const blueprints = [{ paper: 'P1' as const, module: 1, allocations: [{ topic_codes: ['T1'], items: 4 }, { topic_codes: ['T2'], items: 4 }] }];

  it('a topic with one objective seen is judged on that objective alone, and an unseen topic is not started', () => {
    const state = computeStudyState([{ objective_ids: ['M1.1.1'], score: 1, marks: 2, ts: 1 }], topics, blueprints, [1]);
    expect(state.topics.find((t) => t.code === 'T1')).toMatchObject({ mastery: 1, band: 'STRONG' });
    expect(state.topics.find((t) => t.code === 'T2')).toMatchObject({ mastery: 0, band: 'NOT_STARTED' });
    // The module mean is over what was seen, so the unseen topic does not halve it.
    expect(state.moduleMastery[1]).toBe(1);
  });

  it('steering ranks the unseen objective above a weak seen one', () => {
    const candidates = [
      { id: 'seen-weak', objective_ids: ['M1.1.1'], module: 1 as const, kind: 'structured' as const, marks: 9 },
      { id: 'unseen', objective_ids: ['M1.1.2'], module: 1 as const, kind: 'structured' as const, marks: 9 },
    ];
    const picked = buildSession({
      candidates,
      perObjectiveMastery: new Map([['M1.1.1', 0.3]]),
      attemptedObjectives: new Set(['M1.1.1']),
      m1Mastery: 0.9,
      targetModules: [1],
      topicWeightByPrefix: new Map([['M1.1.', 1]]),
      mode: 'adaptive',
    });
    expect(picked[0].id).toBe('unseen');
  });
});
