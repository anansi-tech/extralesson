import { describe, expect, it } from 'vitest';
import {
  computeMatrix,
  largestDeficit,
  p1TargetForTopic,
  p2MarksTargetForTopic,
  P1_TOTAL,
  P2_TOTAL,
  type QuestionFacts,
} from '@/lib/targets/matrix';
import { nextRecipe, type ObjectiveCoverage } from '@/lib/generation/recipe';
import { REPRESENTATION_TARGETS } from '@/lib/targets/representation';
import { seedBlueprints } from '@/lib/seed/blueprints';
import { module1Topics } from '@/lib/seed/module1-topics';
import { module2Topics } from '@/lib/seed/module2-topics';
import { module3Topics } from '@/lib/seed/module3-topics';

const topics = [...module1Topics, ...module2Topics, ...module3Topics].map((t) => ({
  code: t.code,
  title: t.title,
  module: t.module,
  order: t.order,
}));

const objectivesByTopic = new Map<string, ObjectiveCoverage[]>(
  [...module1Topics, ...module2Topics, ...module3Topics].map((t) => [
    t.code,
    t.objectives.map((o) => ({ id: o.id, approved: 0 })),
  ]),
);

function fact(over: Partial<QuestionFacts>): QuestionFacts {
  return {
    kind: 'structured',
    module: 1,
    topic_code: 'M1-ALG1',
    representation: 'prose',
    archetype: 'multi-step-application',
    difficulty: 2,
    marks: 7,
    rubric_profile_marks: { CK: 2, AK: 3, R: 2 },
    ...over,
  };
}

describe('matrix targets', () => {
  it('representation targets sum to 100 per topic and cover all 15 topics', () => {
    expect(Object.keys(REPRESENTATION_TARGETS)).toHaveLength(15);
    for (const [code, targets] of Object.entries(REPRESENTATION_TARGETS)) {
      const sum = targets.reduce((s, t) => s + t.share, 0);
      expect(sum, code).toBe(100);
    }
  });

  it('P1 topic targets scale the seeded item table to 160', () => {
    // M1-NTC has 4 of 60 items -> round(4 × 160/60) = 11
    expect(p1TargetForTopic(seedBlueprints, 'M1-NTC')).toBe(11);
    expect(p1TargetForTopic(seedBlueprints, 'M1-GRAPHS')).toBe(5);
    const total = topics.reduce((s, t) => s + p1TargetForTopic(seedBlueprints, t.code), 0);
    expect(Math.abs(total - P1_TOTAL)).toBeLessThanOrEqual(3); // rounding drift only
  });

  it('P2 marks targets follow the blueprint mark shares', () => {
    // M2-GEO1 carries 9 of 90 blueprint marks -> 10% of the marks pool
    const geo = p2MarksTargetForTopic(seedBlueprints, 'M2-GEO1');
    expect(geo).toBe(Math.round(0.1 * P2_TOTAL * 7));
    // V&M1 (3 marks) must be well below RFG1 (half of 12-mark cluster)
    expect(p2MarksTargetForTopic(seedBlueprints, 'M2-VM1')).toBeLessThan(
      p2MarksTargetForTopic(seedBlueprints, 'M2-RFG1'),
    );
  });

  it('folds question facts into actuals', () => {
    const m = computeMatrix(topics, seedBlueprints, [
      fact({}),
      fact({ kind: 'mcq', topic_code: 'M1-SETS', representation: 'venn', marks: 1, rubric_profile_marks: { CK: 1, AK: 0, R: 0 }, difficulty: 1 }),
    ]);
    expect(m.p1_actual_total).toBe(1);
    expect(m.p2_actual_total).toBe(1);
    expect(m.p2_marks_actual_total).toBe(7);
    expect(m.mcq_visual_actual).toBe(1);
    expect(m.topics.find((t) => t.code === 'M1-ALG1')!.p2_marks_actual).toBe(7);
    expect(m.profile_actuals[1].p2.AK).toBe(3);
    expect(m.profile_actuals[1].p1.CK).toBe(1);
  });
});

describe('largestDeficit', () => {
  it('prefers the most under-covered heavy target', () => {
    expect(largestDeficit({ a: 70, b: 30 }, {})).toBe('a');
    expect(largestDeficit({ a: 70, b: 30 }, { a: 7, b: 0 })).toBe('b');
  });
});

describe('nextRecipe — deficit-driven', () => {
  it('is deterministic and starts with the heaviest structured deficit', () => {
    const empty = computeMatrix(topics, seedBlueprints, []);
    const one = nextRecipe(empty, objectivesByTopic);
    const two = nextRecipe(empty, objectivesByTopic);
    expect(one).toEqual(two);
    expect(one.recipe.kind).toBe('structured'); // tie -> P2
    expect(one.recipe.objective_ids.length).toBeGreaterThan(0);
    expect(one.recipe.marks).toBeGreaterThanOrEqual(4);
  });

  it('switches to mcq when P2 is comparatively ahead', () => {
    const facts = Array.from({ length: 24 }, () => fact({}));
    const m = computeMatrix(topics, seedBlueprints, facts);
    const { recipe } = nextRecipe(m, objectivesByTopic);
    expect(recipe.kind).toBe('mcq');
    expect(recipe.marks).toBe(1);
  });

  it('recipe representation respects topic targets', () => {
    const empty = computeMatrix(topics, seedBlueprints, []);
    const { recipe, context } = nextRecipe(empty, objectivesByTopic);
    const reps = (REPRESENTATION_TARGETS[context.topic_code] ?? []).map((r) => r.representation);
    expect(reps).toContain(recipe.representation);
  });

  it('objectives with fewest approvals are chosen first (floors)', () => {
    const skewed = new Map(objectivesByTopic);
    const code = nextRecipe(computeMatrix(topics, seedBlueprints, []), objectivesByTopic).context
      .topic_code;
    const objs = skewed.get(code)!.map((o, i) => ({ ...o, approved: i === 3 ? 0 : 5 }));
    skewed.set(code, objs);
    const { recipe } = nextRecipe(computeMatrix(topics, seedBlueprints, []), skewed);
    expect(recipe.objective_ids[0]).toBe(objs[3].id);
  });
});
