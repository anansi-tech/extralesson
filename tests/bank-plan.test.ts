import { describe, expect, it } from 'vitest';
import targetsJson from '@/design/research/question-bank-targets.json';
import { scaleBankPlan } from '@/lib/generation/bank-plan';
import { QuestionBankTargetsArtifactZ } from '@/lib/generation/question-bank-targets';

const targets = QuestionBankTargetsArtifactZ.parse(targetsJson);

describe('scalable question-bank plan', () => {
  it('reproduces the checked-in 400-question launch allocation', () => {
    const plan = scaleBankPlan(targets, 400);
    expect(plan.by_kind).toEqual({ mcq: 160, structured: 240 });
    expect(plan.topics.reduce((sum, topic) => sum + topic.total, 0)).toBe(400);
    expect(plan.visual_total).toBe(289);
  });

  it('scales beyond launch without changing the syllabus proportions', () => {
    const plan = scaleBankPlan(targets, 800);
    expect(plan.by_kind).toEqual({ mcq: 320, structured: 480 });
    expect(plan.topics.reduce((sum, topic) => sum + topic.total, 0)).toBe(800);
    expect(plan.visual_total).toBeGreaterThan(550);
    expect(plan.visual_by_type).not.toHaveProperty('other');
    expect(Object.values(plan.visual_by_type).reduce((sum, count) => sum + count, 0))
      .toBe(plan.visual_total);
  });

  it('uses exact largest-remainder totals for non-round sizes', () => {
    const plan = scaleBankPlan(targets, 501);
    expect(plan.by_kind.mcq + plan.by_kind.structured).toBe(501);
    expect(plan.topics.reduce((sum, topic) => sum + topic.total, 0)).toBe(501);
  });
});
