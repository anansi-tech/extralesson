import { describe, expect, it } from 'vitest';
import targetsJson from '@/design/research/question-bank-targets.json';
import {
  buildCorpusInformedQuestionRecipe,
  buildDefaultQuestionRecipe,
  difficultyAllowsArchetype,
  hasObservedDifficulty,
  pickCorpusInformedObjective,
  pickLeastCoveredObjective,
  questionMatchesRecipe,
  QuestionRecipeZ,
  structuredProfileSplit,
} from '@/lib/generation/question-recipe';
import { QuestionBankTargetsArtifactZ } from '@/lib/generation/question-bank-targets';

const bankTargets = QuestionBankTargetsArtifactZ.parse(targetsJson);

describe('QuestionRecipeZ', () => {
  it('selects the least-covered objective with a deterministic tie break', () => {
    const objectives = [{ id: 'M1.1.2' }, { id: 'M1.1.1' }, { id: 'M1.1.3' }];
    const counts = new Map([['M1.1.1', 2], ['M1.1.2', 0], ['M1.1.3', 0]]);
    expect(pickLeastCoveredObjective(objectives, counts)?.id).toBe('M1.1.2');
    counts.set('M1.1.2', 1);
    expect(pickLeastCoveredObjective(objectives, counts)?.id).toBe('M1.1.3');
  });

  it('builds a controlled MCQ recipe for each difficulty', () => {
    const profiles = ['CK', 'AK', 'R'];
    for (const difficulty of [1, 2, 3] as const) {
      const recipe = buildDefaultQuestionRecipe({
        objectiveIds: ['M2.3.4'],
        kind: 'mcq',
        difficulty,
      });
      expect(recipe.kind).toBe('mcq');
      expect(recipe.marks).toBe(1);
      expect(recipe.part_count).toBe(1);
      if (recipe.kind === 'mcq') expect(recipe.profile).toBe(profiles[difficulty - 1]);
    }
  });

  it('builds structured recipes whose profile marks sum to total marks', () => {
    for (const difficulty of [1, 2, 3] as const) {
      const recipe = buildDefaultQuestionRecipe({
        objectiveIds: ['M1.5.10'],
        kind: 'structured',
        difficulty,
      });
      expect(recipe.kind).toBe('structured');
      if (recipe.kind === 'structured') {
        const { CK, AK, R } = recipe.profile_split;
        expect(CK + AK + R).toBe(recipe.marks);
      }
    }
  });

  it('scales CK/AK/R exactly across real-paper-sized structured questions', () => {
    expect(structuredProfileSplit(15, 3)).toEqual({ CK: 3, AK: 6, R: 6 });
    expect(Object.values(structuredProfileSplit(12, 2)).reduce((sum, marks) => sum + marks, 0))
      .toBe(12);
  });

  it('rejects a structured profile split that does not sum to marks', () => {
    const recipe = buildDefaultQuestionRecipe({
      objectiveIds: ['M3.2.1'],
      kind: 'structured',
      difficulty: 2,
    });
    expect(QuestionRecipeZ.safeParse({
      ...recipe,
      profile_split: { CK: 1, AK: 1, R: 1 },
    }).success).toBe(false);
  });

  it('rejects objectives from different modules', () => {
    const recipe = buildDefaultQuestionRecipe({
      objectiveIds: ['M1.1.1'],
      kind: 'mcq',
      difficulty: 1,
    });
    expect(QuestionRecipeZ.safeParse({
      ...recipe,
      objective_ids: ['M1.1.1', 'M2.1.1'],
    }).success).toBe(false);
  });

  it('detects generated output that misses an exact recipe control', () => {
    const recipe = buildDefaultQuestionRecipe({
      objectiveIds: ['M2.1.3'],
      kind: 'mcq',
      difficulty: 2,
    });
    const question = {
      kind: 'mcq' as const,
      objective_ids: ['M2.1.3'],
      module: 2 as const,
      stem: 'What is the median of the five values shown?',
      options: ['2', '3', '4', '5'],
      answer_key: 1,
      profile: 'CK' as const,
      difficulty: 2 as const,
      marks: 1,
      worked_solution: 'The middle value is 3.',
      misconceptions: [],
    };
    expect(questionMatchesRecipe(question, recipe)).toBe(false);
    expect(questionMatchesRecipe({ ...question, profile: 'AK' }, recipe)).toBe(true);
  });

  it('checks exact structured profile totals against the recipe', () => {
    const recipe = buildDefaultQuestionRecipe({
      objectiveIds: ['M1.5.10'],
      kind: 'structured',
      difficulty: 1,
    });
    const question = {
      kind: 'structured' as const,
      objective_ids: ['M1.5.10'],
      module: 1 as const,
      stem: 'Solve the equation $2x + 3 = 11$.',
      difficulty: 1 as const,
      marks: 3,
      rubric: [
        { code: 'CK1', profile: 'CK' as const, criterion: 'Selects inverse operations', mark_value: 1 },
        { code: 'AK1', profile: 'AK' as const, criterion: 'Subtracts 3 correctly', mark_value: 1 },
        { code: 'AK2', profile: 'AK' as const, criterion: 'Divides by 2 correctly', mark_value: 1 },
      ],
      final_answer: 'x = 4',
      worked_solution: '$2x=8$, so $x=4$.',
      misconceptions: [],
    };
    expect(questionMatchesRecipe(question, recipe)).toBe(true);
    expect(questionMatchesRecipe({
      ...question,
      rubric: [
        { code: 'CK1', profile: 'CK', criterion: 'Selects inverse operations', mark_value: 1 },
        { code: 'R1', profile: 'R', criterion: 'Subtracts 3 correctly', mark_value: 1 },
        { code: 'AK1', profile: 'AK', criterion: 'Divides by 2 correctly', mark_value: 1 },
      ],
    }, recipe)).toBe(false);
  });

  it('selects deterministic corpus-informed styles while retaining official profile controls', () => {
    const topic = bankTargets.topics.find((entry) => entry.topic_code === 'M2-GEO1')!;
    const objectiveId = topic.observed_style.mcq.distributions.objective_id[0].value;
    const recipes = Array.from({ length: 20 }, (_, ordinal) => buildCorpusInformedQuestionRecipe({
      targets: bankTargets,
      topicCode: topic.topic_code,
      objectiveIds: [objectiveId],
      kind: 'mcq',
      difficulty: 2,
      ordinal,
    }));
    expect(recipes.every((recipe) => recipe.kind === 'mcq' && recipe.profile === 'AK')).toBe(true);
    expect(recipes.some((recipe) => recipe.visual_type !== null)).toBe(true);
    expect(recipes.some((recipe) => recipe.visual_type === null)).toBe(true);
    expect(buildCorpusInformedQuestionRecipe({
      targets: bankTargets,
      topicCode: topic.topic_code,
      objectiveIds: [objectiveId],
      kind: 'mcq',
      difficulty: 2,
      ordinal: 7,
    })).toEqual(recipes[7]);
  });

  it('supports controlled visual and text presentation for a review pilot', () => {
    const topic = bankTargets.topics.find((entry) => entry.topic_code === 'M2-GEO1')!;
    const objectiveId = topic.observed_style.mcq.distributions.objective_id[0].value;
    const common = {
      targets: bankTargets,
      topicCode: topic.topic_code,
      objectiveIds: [objectiveId],
      kind: 'mcq' as const,
      difficulty: 2 as const,
      ordinal: 0,
    };

    expect(buildCorpusInformedQuestionRecipe({ ...common, presentation: 'visual' }).visual_type)
      .not.toBeNull();
    expect(buildCorpusInformedQuestionRecipe({ ...common, presentation: 'text' }).visual_type)
      .toBeNull();
  });

  it('does not borrow an easier cognitive pattern when a difficulty is unobserved', () => {
    const recipe = buildCorpusInformedQuestionRecipe({
      targets: bankTargets,
      topicCode: 'M3-VM2',
      objectiveIds: ['M3.4.1'],
      kind: 'mcq',
      difficulty: 3,
      ordinal: 0,
      presentation: 'text',
    });

    expect(recipe.archetype).toBe('reverse-reasoning');
    expect(recipe.command_verb).toBe('interpret');
    expect(difficultyAllowsArchetype(recipe.difficulty, recipe.archetype)).toBe(true);
  });

  it('selects objectives from matching difficulty and presentation evidence', () => {
    const objectives = Array.from({ length: 11 }, (_, index) => ({ id: `M2.1.${index + 1}` }));
    const selected = pickCorpusInformedObjective({
      objectives,
      counts: new Map(objectives.map((objective) => [objective.id, 0])),
      targets: bankTargets,
      topicCode: 'M2-STAT1',
      kind: 'mcq',
      difficulty: 2,
      ordinal: 1,
      presentation: 'visual',
    });
    expect(selected?.id).toBe('M2.1.7');
  });

  it('detects unobserved topic, kind, and difficulty combinations', () => {
    expect(hasObservedDifficulty({
      targets: bankTargets, topicCode: 'M3-VM2', kind: 'mcq', difficulty: 3,
    })).toBe(false);
    expect(hasObservedDifficulty({
      targets: bankTargets, topicCode: 'M3-VM2', kind: 'structured', difficulty: 3,
    })).toBe(true);
  });

  it('inherits observed Paper 2 marks, linked objectives, and part count', () => {
    const recipe = buildCorpusInformedQuestionRecipe({
      targets: bankTargets,
      topicCode: 'M3-VM2',
      objectiveIds: ['M3.4.1'],
      kind: 'structured',
      difficulty: 3,
      ordinal: 0,
      presentation: 'text',
    });
    expect(recipe.kind).toBe('structured');
    expect(recipe.marks).toBeGreaterThanOrEqual(12);
    expect(recipe.objective_ids.length).toBeGreaterThan(1);
    expect(recipe.archetype).toBe('justification');
    expect(recipe.command_verb).toBe('justify');
    if (recipe.kind === 'structured') {
      expect(recipe.profile_split.CK + recipe.profile_split.AK + recipe.profile_split.R)
        .toBe(recipe.marks);
    }
  });

  it('rejects weak archetypes in demanding recipes', () => {
    const recipe = buildDefaultQuestionRecipe({
      objectiveIds: ['M3.4.1'], kind: 'mcq', difficulty: 3,
    });
    expect(QuestionRecipeZ.safeParse({ ...recipe, archetype: 'concept-recognition' }).success)
      .toBe(false);
  });
});
