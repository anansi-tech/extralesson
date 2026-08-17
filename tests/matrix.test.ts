import { describe, expect, it } from 'vitest';
import {
  computeMatrix,
  largestDeficit,
  P1_PROFILE_SPLIT,
  p1TargetForTopic,
  p2MarksTargetForTopic,
  P1_TOTAL,
  P2_MARKS_TOTAL,
  P2_PROFILE_SPLIT,
  type QuestionFacts,
} from '@/lib/targets/matrix';
import {
  nextRecipe,
  rubricSplitFor,
  PAPER_MARKS,
  STRUCTURED_MARKS,
  type ObjectiveCoverage,
} from '@/lib/generation/recipe';
import { GRID_BIASED_OBJECTIVES, REPRESENTATION_TARGETS } from '@/lib/targets/representation';
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
    expect(geo).toBe(Math.round(0.1 * P2_MARKS_TOTAL));
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

describe('nextRecipe — overrides constrain the search, never patch its output', () => {
  // Regression: overrides used to be applied AFTER the deficit pick, so a
  // `--kind structured` run kept the archetype/difficulty chosen from the MCQ
  // tables. Every field must be derived from the constrained values.
  const emptyMatrix = () => computeMatrix(topics, seedBlueprints, []);

  it('a kind override picks the archetype from that kind\'s table', () => {
    // P1 is emptier, so an unconstrained pick would be mcq -> direct-procedure.
    const m = computeMatrix(topics, seedBlueprints, Array.from({ length: 40 }, () => fact({})));
    expect(nextRecipe(m, objectivesByTopic).recipe.kind).toBe('mcq');

    const forced = nextRecipe(m, objectivesByTopic, { kind: 'structured' }).recipe;
    expect(forced.kind).toBe('structured');
    // The 40 banked questions are all multi-step, so the largest STRUCTURED
    // deficit is reverse-reasoning — 22% since it was calibrated against the
    // papers, up from the 9% that made justification the answer here. The old
    // bug returned 'direct-procedure', the MCQ table's top entry, for every
    // structured run.
    expect(forced.archetype).toBe('reverse-reasoning');
    expect(forced.marks).toBe(PAPER_MARKS[forced.difficulty]);
  });

  it('a difficulty override drives marks', () => {
    const r = nextRecipe(emptyMatrix(), objectivesByTopic, {
      kind: 'structured',
      difficulty: 3,
    }).recipe;
    expect(r.difficulty).toBe(3);
    expect(r.marks).toBe(PAPER_MARKS[3]);
    // The short drill item is still generable, and keeps the smaller table.
    const drill = nextRecipe(emptyMatrix(), objectivesByTopic, {
      kind: 'structured',
      difficulty: 3,
      shape: 'drill',
    }).recipe;
    expect(drill.marks).toBe(STRUCTURED_MARKS[3]);
  });

  it('a topic override selects that topic and its representation targets', () => {
    const { recipe, context } = nextRecipe(emptyMatrix(), objectivesByTopic, {
      topic_code: 'M1-SETS',
      kind: 'structured',
    });
    expect(context.topic_code).toBe('M1-SETS');
    expect(recipe.objective_ids[0].startsWith('M1.3.')).toBe(true);
    const reps = REPRESENTATION_TARGETS['M1-SETS'].map((r) => r.representation);
    expect(reps).toContain(recipe.representation);
  });

  it('an unknown topic override is rejected, not silently ignored', () => {
    expect(() =>
      nextRecipe(emptyMatrix(), objectivesByTopic, { topic_code: 'M9-NOPE' }),
    ).toThrow(/unknown topic/);
  });
});

describe('nextRecipe — a bank built from empty converges on the target shape', () => {
  it('60 consecutive recipes track the archetype and difficulty targets', () => {
    // Feed each recipe back in as a fact, exactly as the pipeline does.
    const facts: QuestionFacts[] = [];
    const recipes = [];
    for (let i = 0; i < 60; i++) {
      const m = computeMatrix(topics, seedBlueprints, facts);
      const { recipe, context } = nextRecipe(m, objectivesByTopic);
      recipes.push(recipe);
      const profile = recipe.kind === 'mcq' ? { CK: 1, AK: 0, R: 0 } : { CK: 2, AK: 3, R: 2 };
      facts.push({
        kind: recipe.kind,
        module: Number(context.topic_code[1]) as 1 | 2 | 3,
        topic_code: context.topic_code,
        representation: recipe.representation,
        archetype: recipe.archetype,
        difficulty: recipe.difficulty,
        marks: recipe.marks,
        rubric_profile_marks: profile,
      });
    }

    const structured = recipes.filter((r) => r.kind === 'structured');
    const mcq = recipes.filter((r) => r.kind === 'mcq');
    expect(structured.length).toBeGreaterThan(10);
    expect(mcq.length).toBeGreaterThan(10);

    // multi-step-application is 67% of the structured target — it must dominate,
    // and direct-procedure (2%) must be rare rather than the default.
    const multiStep = structured.filter((r) => r.archetype === 'multi-step-application').length;
    const directProc = structured.filter((r) => r.archetype === 'direct-procedure').length;
    expect(multiStep / structured.length).toBeGreaterThan(0.4);
    expect(directProc / structured.length).toBeLessThan(0.15);

    // all three difficulties appear, rather than everything landing on d2
    for (const d of [1, 2, 3] as const) {
      expect(recipes.some((r) => r.difficulty === d), `difficulty ${d}`).toBe(true);
    }

    // more than one topic gets served
    expect(new Set(recipes.map((r) => r.objective_ids[0].slice(0, 4))).size).toBeGreaterThan(3);
  });
});

// R1.7 §B5 — Paper 1 topic blocks climb CK -> AK -> R in the specimen key, and
// a practice set that samples profiles independently loses that ramp.
describe('nextRecipe — module override', () => {
  const empty = computeMatrix(topics, seedBlueprints, []);

  it('only ever returns topics from the requested module', () => {
    for (const module of [1, 2, 3] as const) {
      for (let i = 0; i < 12; i++) {
        const { context } = nextRecipe(empty, objectivesByTopic, { module });
        expect(context.topic_code.startsWith(`M${module}-`), context.topic_code).toBe(true);
      }
    }
  });

  it('still picks the largest deficit inside the module', () => {
    const facts: QuestionFacts[] = [];
    const first = nextRecipe(empty, objectivesByTopic, { module: 2, kind: 'structured' });
    // fill that topic well past its target, and the search must move on
    for (let i = 0; i < 40; i++) {
      facts.push({
        kind: 'structured',
        module: 2,
        topic_code: first.context.topic_code,
        representation: 'prose',
        archetype: 'multi-step-application',
        difficulty: 2,
        marks: 7,
        rubric_profile_marks: { CK: 2, AK: 3, R: 2 },
      });
    }
    const filled = computeMatrix(topics, seedBlueprints, facts);
    const second = nextRecipe(filled, objectivesByTopic, { module: 2, kind: 'structured' });
    expect(second.context.topic_code).not.toBe(first.context.topic_code);
    expect(second.context.topic_code.startsWith('M2-')).toBe(true);
  });

  it('composes with the other overrides', () => {
    const { recipe, context } = nextRecipe(empty, objectivesByTopic, {
      module: 3,
      kind: 'mcq',
      difficulty: 3,
    });
    expect(context.topic_code.startsWith('M3-')).toBe(true);
    expect(recipe.kind).toBe('mcq');
    expect(recipe.difficulty).toBe(3);
    expect(recipe.profile).toBeDefined(); // §B5 ramp still applies
  });
});

// Transformation work is coordinate work: an object and its image, a
// translation vector, a described transformation. A labelled sketch cannot
// place those points, so the search weights 'graph' up for those objectives —
// weighting, not gating, because a gate that rejects true questions teaches the
// model to avoid the shapes rather than to be correct.
describe('nextRecipe — coordinate work is biased toward the grid', () => {
  const empty = computeMatrix(topics, seedBlueprints, []);

  it('sends a transformation objective to a graph', () => {
    const onlyTransformations = new Map(objectivesByTopic);
    onlyTransformations.set(
      'M3-GEO2',
      ['M3.3.2', 'M3.3.3', 'M3.3.4'].map((id) => ({ id, approved: 0 })),
    );
    const { recipe, context } = nextRecipe(empty, onlyTransformations, {
      topic_code: 'M3-GEO2',
      kind: 'structured',
    });
    expect(recipe.objective_ids.some((id) => GRID_BIASED_OBJECTIVES.has(id))).toBe(true);
    expect(recipe.representation).toBe('graph');
    expect(context.template_hints).toContain('coordinateGrid');
  });

  it('leaves circle-theorem work on a diagram', () => {
    const circlesFirst = new Map(objectivesByTopic);
    circlesFirst.set('M3-GEO2', [
      { id: 'M3.3.1', approved: 0 },
      { id: 'M3.3.7', approved: 0 },
    ]);
    const { recipe } = nextRecipe(empty, circlesFirst, {
      topic_code: 'M3-GEO2',
      kind: 'structured',
    });
    expect(recipe.representation).toBe('diagram');
  });

  it('is a bias, not a rule: a large graph surplus still wins the argument', () => {
    const graphHeavy = computeMatrix(
      topics,
      seedBlueprints,
      Array.from({ length: 30 }, () => ({
        kind: 'structured' as const,
        module: 3 as const,
        topic_code: 'M3-GEO2',
        representation: 'graph' as const,
        archetype: 'multi-step-application' as const,
        difficulty: 2 as const,
        marks: 7,
        rubric_profile_marks: { CK: 2, AK: 3, R: 2 },
      })),
    );
    const onlyTransformations = new Map(objectivesByTopic);
    onlyTransformations.set('M3-GEO2', [{ id: 'M3.3.2', approved: 0 }]);
    const { recipe } = nextRecipe(graphHeavy, onlyTransformations, {
      topic_code: 'M3-GEO2',
      kind: 'structured',
    });
    expect(recipe.representation).toBe('diagram');
  });

  it('still lets a diagram recipe reach for the grid when it needs one', () => {
    expect(REPRESENTATION_TARGETS['M3-GEO2'][0].template_hints).toContain('coordinateGrid');
  });
});

// R1.8 §2 — a question is what the paper sets, and the matrix counts P2 in the
// unit the paper does.
describe('nextRecipe — paper-shaped questions', () => {
  const emptyMatrix = () => computeMatrix(topics, seedBlueprints, []);

  it('makes a structured recipe paper-shaped by default, 9-12 marks', () => {
    const r = nextRecipe(emptyMatrix(), objectivesByTopic, { kind: 'structured' }).recipe;
    expect(r.shape).toBe('paper');
    expect(r.marks).toBeGreaterThanOrEqual(9);
    expect(r.marks).toBeLessThanOrEqual(12);
  });

  it('draws objectives from two or three topics of the SAME module', () => {
    const { recipe, context } = nextRecipe(emptyMatrix(), objectivesByTopic, {
      kind: 'structured',
    });
    expect(context.topic_codes.length).toBeGreaterThanOrEqual(2);
    expect(context.topic_codes[0]).toBe(context.topic_code);
    const modules = new Set(
      context.topic_codes.map((code) => topics.find((t) => t.code === code)!.module),
    );
    expect(modules.size).toBe(1);
    expect(recipe.objective_ids.length).toBe(context.topic_codes.length);
  });

  it('keeps an MCQ a single-topic drill item', () => {
    const { recipe, context } = nextRecipe(emptyMatrix(), objectivesByTopic, { kind: 'mcq' });
    expect(recipe.shape).toBe('drill');
    expect(context.topic_codes).toEqual([context.topic_code]);
    expect(recipe.marks).toBe(1);
  });

  it('measures the P2 shortfall in marks, so a 12-mark question is not one question', () => {
    // A bank of few but large questions is further along on P2 than the same
    // count of small ones, and the paper choice has to see that.
    const big = computeMatrix(
      topics,
      seedBlueprints,
      Array.from({ length: 30 }, () => fact({ kind: 'structured', marks: 12 })),
    );
    const small = computeMatrix(
      topics,
      seedBlueprints,
      Array.from({ length: 30 }, () => fact({ kind: 'structured', marks: 2 })),
    );
    expect(big.p2_marks_actual_total).toBeGreaterThan(small.p2_marks_actual_total);
    expect(big.p2_actual_total).toBe(small.p2_actual_total);
  });
});

// A target the recipe does not consume is a wish. CK/AK/R was declared 30/40/30
// and sat at 21/55/24 — structured recipes carried no profile at all, and
// Paper 1 used a ten-item cycle that never completed at two to five items per
// topic, starving R.
describe('profile is a deficit the recipe consumes', () => {
  const emptyMatrix = () => computeMatrix(topics, seedBlueprints, []);

  it('splits a question\'s marks toward whichever profile the bank is short of', () => {
    const balanced = rubricSplitFor(10, P2_PROFILE_SPLIT, { CK: 30, AK: 40, R: 30 });
    expect(balanced.CK + balanced.AK + balanced.R).toBe(10);
    expect(balanced.CK).toBeGreaterThanOrEqual(2);

    // The mix we actually measured: CK starved, AK bloated.
    const correcting = rubricSplitFor(10, P2_PROFILE_SPLIT, { CK: 21, AK: 55, R: 24 });
    expect(correcting.CK + correcting.AK + correcting.R).toBe(10);
    expect(correcting.CK).toBeGreaterThan(balanced.CK);
    expect(correcting.AK).toBeLessThan(balanced.AK);
  });

  it('always spends every mark, at any question size', () => {
    for (const marks of [1, 2, 3, 5, 7, 9, 10, 12]) {
      const s = rubricSplitFor(marks, P2_PROFILE_SPLIT, { CK: 1, AK: 90, R: 9 });
      expect(s.CK + s.AK + s.R, `marks=${marks}`).toBe(marks);
      expect(Math.min(s.CK, s.AK, s.R)).toBeGreaterThanOrEqual(0);
    }
  });

  it('never abandons a profile the bank already has plenty of', () => {
    const s = rubricSplitFor(12, P2_PROFILE_SPLIT, { CK: 0, AK: 0, R: 100 });
    expect(s.R).toBeGreaterThan(0);
  });

  it('gives a structured recipe a split that sums to its marks', () => {
    const { recipe } = nextRecipe(emptyMatrix(), objectivesByTopic, { kind: 'structured' });
    expect(recipe.rubric_split).toBeDefined();
    const s = recipe.rubric_split!;
    expect(s.CK + s.AK + s.R).toBe(recipe.marks);
  });

  it('gives a Paper 1 item the profile the module is shortest of, at any topic size', () => {
    // One CK item banked and nothing else: the next item must not be CK.
    const m = computeMatrix(topics, seedBlueprints, [
      fact({ kind: 'mcq', marks: 1, module: 1, topic_code: 'M1-NTC', rubric_profile_marks: { CK: 1, AK: 0, R: 0 } }),
    ]);
    const { recipe } = nextRecipe(m, objectivesByTopic, { kind: 'mcq', module: 1 });
    expect(recipe.profile).not.toBe('CK');
  });
});

// The visual share is a target the recipe consumes, not a ceiling applied after
// the fact: as a ceiling it waited until 37% was passed and exempted nine of
// fifteen topics, and the bank reached 53%.
describe('Paper 1 visual share is a deficit', () => {
  const visualHeavy = (n: number) =>
    computeMatrix(
      topics,
      seedBlueprints,
      Array.from({ length: n }, () =>
        fact({ kind: 'mcq', marks: 1, topic_code: 'M2-GEO1', representation: 'diagram', rubric_profile_marks: { CK: 1, AK: 0, R: 0 } }),
      ),
    );

  it('asks for prose once the visual share is already past the target', () => {
    const { recipe } = nextRecipe(visualHeavy(20), objectivesByTopic, { kind: 'mcq' });
    expect(recipe.representation).toBe('prose');
  });

  it('asks for a visual while the share is below it', () => {
    const { recipe } = nextRecipe(
      computeMatrix(topics, seedBlueprints, []),
      objectivesByTopic,
      { kind: 'mcq', topic_code: 'M2-GEO1' },
    );
    expect(recipe.representation).not.toBe('prose');
  });
});

// Pairing is a deficit like everything else: pair only where the corpus pairs,
// and only while the bank is below the share the corpus shows.
describe('nextRecipe — topic pairing', () => {
  const emptyMatrix = () => computeMatrix(topics, seedBlueprints, []);

  it('never pairs a Module 3 topic, which is where the stapling came from', () => {
    for (const code of ['M3-VM2', 'M3-GEO2', 'M3-STAT2']) {
      const { context } = nextRecipe(emptyMatrix(), objectivesByTopic, {
        kind: 'structured',
        topic_code: code,
      });
      expect(context.topic_codes, code).toEqual([code]);
    }
  });

  it('pairs only with a partner the corpus was seen to pair with', () => {
    const { context } = nextRecipe(emptyMatrix(), objectivesByTopic, {
      kind: 'structured',
      topic_code: 'M2-ALG2',
    });
    if (context.topic_codes.length > 1) {
      expect(['M2-RFG1', 'M2-VM1', 'M2-GEO1']).toContain(context.topic_codes[1]);
    }
  });

  it('stops pairing once the bank is past the corpus share', () => {
    // A bank of questions that all span two topics: the next one must not.
    const paired = computeMatrix(
      topics,
      seedBlueprints,
      Array.from({ length: 20 }, () => fact({ kind: 'structured', topic_code: 'M2-ALG2', topic_span: 2 })),
    );
    const { context } = nextRecipe(paired, objectivesByTopic, {
      kind: 'structured',
      topic_code: 'M2-ALG2',
    });
    expect(context.topic_codes).toEqual(['M2-ALG2']);
  });
});
