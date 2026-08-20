import { describe, expect, it } from 'vitest';
import { computeMatrix, type QuestionFacts } from '@/lib/targets/matrix';
import { nextRecipe, type ObjectiveCoverage } from '@/lib/generation/recipe';
import { OBJECTIVE_FLOOR } from '@/lib/targets/objectives';
import { seedBlueprints } from '@/lib/seed/blueprints';
import { module1Topics } from '@/lib/seed/module1-topics';
import { module2Topics } from '@/lib/seed/module2-topics';
import { module3Topics } from '@/lib/seed/module3-topics';

// ROUND_1_5_FINAL §4 asked for two approved questions per assessable objective
// and nothing consumed it, so 65 of 150 objectives had never been assessed at
// all while their topics sat at 185% of their MARK targets. A topic total
// cannot see a hole inside the topic.

const topics = [...module1Topics, ...module2Topics, ...module3Topics].map((t) => ({
  code: t.code,
  title: t.title,
  module: t.module,
  order: t.order,
}));

const coverage = (covered: Record<string, number>): Map<string, ObjectiveCoverage[]> =>
  new Map(
    [...module1Topics, ...module2Topics, ...module3Topics].map((t) => [
      t.code,
      t.objectives.map((o) => ({
        id: o.id,
        approved: covered[o.id] ?? 0,
        covered: covered[o.id] ?? 0,
      })),
    ]),
  );

/** Every objective covered except those named. */
const allCoveredBut = (bare: string[]) => {
  const map: Record<string, number> = {};
  for (const t of [...module1Topics, ...module2Topics, ...module3Topics]) {
    for (const o of t.objectives) map[o.id] = bare.includes(o.id) ? 0 : OBJECTIVE_FLOOR;
  }
  return coverage(map);
};

// A bank whose marks are long past target everywhere — the state that made an
// over-quota topic unreachable.
const saturated = () => {
  const facts: QuestionFacts[] = topics.flatMap((t) =>
    Array.from({ length: 30 }, () => ({
      kind: 'structured' as const,
      module: t.module,
      topic_code: t.code,
      representation: 'prose' as const,
      archetype: 'multi-step-application' as const,
      difficulty: 2 as const,
      marks: 11,
      rubric_profile_marks: { CK: 3, AK: 5, R: 3 },
    })),
  );
  return computeMatrix(topics, seedBlueprints, facts);
};

describe('objective coverage outranks topic marks', () => {
  it('returns to a topic that is over its mark target but has an untouched objective', () => {
    // M3.4.7 (inverse of a 2x2 matrix) is the real case: zero approved, in a
    // topic well past its marks, so it could never be chosen again.
    const { context, recipe } = nextRecipe(saturated(), allCoveredBut(['M3.4.7']), {
      kind: 'structured',
    });
    expect(context.topic_code).toBe('M3-VM2');
    expect(recipe.objective_ids).toContain('M3.4.7');
  });

  it('takes an objective at zero before one merely below the floor', () => {
    const map: Record<string, number> = {};
    for (const t of [...module1Topics, ...module2Topics, ...module3Topics]) {
      for (const o of t.objectives) map[o.id] = OBJECTIVE_FLOOR;
    }
    map['M1.1.4'] = 1; // below floor, but asked about once
    map['M3.4.7'] = 0; // never asked about
    const { recipe } = nextRecipe(saturated(), coverage(map), { kind: 'structured' });
    expect(recipe.objective_ids).toContain('M3.4.7');
    expect(recipe.objective_ids).not.toContain('M1.1.4');
  });

  it('falls back to the marks deficit once every objective is at the floor', () => {
    const all = allCoveredBut([]);
    const { context } = nextRecipe(computeMatrix(topics, seedBlueprints, []), all, {
      kind: 'structured',
    });
    // No coverage gap left to rank by, so the old rule decides — and on an
    // empty bank that is a real topic rather than a throw.
    expect(context.topic_code).toMatch(/^M[123]-/);
  });

  it('pairs three uncovered objectives into one integrated question', () => {
    const { recipe } = nextRecipe(saturated(), allCoveredBut(['M3.4.6', 'M3.4.7', 'M3.4.8']), {
      kind: 'structured',
    });
    expect(recipe.difficulty).toBe(3);
    expect(recipe.integrate).toBe(true);
    expect(recipe.objective_ids.sort()).toEqual(['M3.4.6', 'M3.4.7', 'M3.4.8']);
  });

  it('does not let cheap coverage break the difficulty band', () => {
    // Every objective uncovered, so every topic could integrate. Difficulty 3
    // is a quarter of the bank, not all of it.
    const facts: QuestionFacts[] = Array.from({ length: 40 }, () => ({
      kind: 'structured' as const,
      module: 1 as const,
      topic_code: 'M1-NTC',
      representation: 'prose' as const,
      archetype: 'multi-step-application' as const,
      difficulty: 3 as const,
      marks: 12,
      rubric_profile_marks: { CK: 3, AK: 5, R: 4 },
    }));
    const { recipe } = nextRecipe(computeMatrix(topics, seedBlueprints, facts), coverage({}), {
      kind: 'structured',
    });
    expect(recipe.difficulty).not.toBe(3);
  });
});
