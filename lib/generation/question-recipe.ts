import { z } from 'zod';
import { OBJECTIVE_ID_RE } from '@/lib/validation/question';
import type { QuestionDraft } from '@/lib/validation/question';

export const QuestionArchetypeZ = z.enum([
  'concept-recognition',
  'direct-procedure',
  'multi-step-application',
  'interpretation',
  'comparison',
  'justification',
  'reverse-reasoning',
]);

export const CommandVerbZ = z.enum([
  'calculate',
  'compare',
  'determine',
  'explain',
  'interpret',
  'justify',
  'show',
  'solve',
]);

export const RepresentationZ = z.enum([
  'symbolic',
  'short-prose',
  'inline-data',
  'coordinate-data',
]);

export const ContextCategoryZ = z.enum([
  'none',
  'consumer',
  'measurement',
  'data',
  'travel',
  'sport',
  'workplace',
  'environment',
]);

const RecipeBaseZ = z.object({
  objective_ids: z.array(z.string().regex(OBJECTIVE_ID_RE)).min(1).max(2),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  archetype: QuestionArchetypeZ,
  command_verb: CommandVerbZ,
  representation: RepresentationZ,
  context_category: ContextCategoryZ,
  misconception_families: z.array(z.string().min(1)).max(3).default([]),
});

const McqRecipeZ = RecipeBaseZ.extend({
  kind: z.literal('mcq'),
  marks: z.literal(1),
  profile: z.enum(['CK', 'AK', 'R']),
  part_count: z.literal(1),
});

const StructuredRecipeZ = RecipeBaseZ.extend({
  kind: z.literal('structured'),
  marks: z.number().int().min(2).max(9),
  profile_split: z.object({
    CK: z.number().int().min(0),
    AK: z.number().int().min(0),
    R: z.number().int().min(0),
  }),
  part_count: z.number().int().min(1).max(3),
}).refine(
  (recipe) => {
    const { CK, AK, R } = recipe.profile_split;
    return CK + AK + R === recipe.marks;
  },
  { message: 'profile_split must sum to marks', path: ['profile_split'] },
);

export const QuestionRecipeZ = z
  .union([McqRecipeZ, StructuredRecipeZ])
  .refine((recipe) => {
    const modulePrefix = recipe.objective_ids[0]?.slice(0, 2);
    return recipe.objective_ids.every((id) => id.startsWith(`${modulePrefix}.`));
  }, { message: 'all recipe objectives must belong to one module', path: ['objective_ids'] });

export type QuestionRecipe = z.infer<typeof QuestionRecipeZ>;

export function pickLeastCoveredObjective<T extends { id: string }>(
  objectives: T[],
  counts: ReadonlyMap<string, number>,
): T | undefined {
  return [...objectives].sort(
    (a, b) =>
      (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0) || a.id.localeCompare(b.id),
  )[0];
}

export function questionMatchesRecipe(question: QuestionDraft, recipe: QuestionRecipe): boolean {
  if (
    question.kind !== recipe.kind ||
    question.difficulty !== recipe.difficulty ||
    question.marks !== recipe.marks ||
    question.objective_ids.length !== recipe.objective_ids.length ||
    !question.objective_ids.every((id) => recipe.objective_ids.includes(id))
  ) {
    return false;
  }

  if (question.kind === 'mcq' && recipe.kind === 'mcq') {
    return question.profile === recipe.profile;
  }
  if (question.kind === 'structured' && recipe.kind === 'structured') {
    const actual = question.rubric.reduce((totals, item) => {
      totals[item.profile] += item.mark_value;
      return totals;
    }, { CK: 0, AK: 0, R: 0 });
    return (
      actual.CK === recipe.profile_split.CK &&
      actual.AK === recipe.profile_split.AK &&
      actual.R === recipe.profile_split.R
    );
  }
  return false;
}

export function buildDefaultQuestionRecipe(args: {
  objectiveIds: string[];
  kind: 'mcq' | 'structured';
  difficulty: 1 | 2 | 3;
}): QuestionRecipe {
  const common = {
    objective_ids: args.objectiveIds,
    difficulty: args.difficulty,
    representation: 'symbolic' as const,
    context_category: 'none' as const,
    misconception_families: [],
  };

  if (args.kind === 'mcq') {
    const byDifficulty = {
      1: { profile: 'CK', archetype: 'concept-recognition', command_verb: 'determine' },
      2: { profile: 'AK', archetype: 'direct-procedure', command_verb: 'calculate' },
      3: { profile: 'R', archetype: 'reverse-reasoning', command_verb: 'interpret' },
    } as const;
    return QuestionRecipeZ.parse({
      ...common,
      ...byDifficulty[args.difficulty],
      kind: 'mcq',
      marks: 1,
      part_count: 1,
    });
  }

  const byDifficulty = {
    1: {
      marks: 3,
      profile_split: { CK: 1, AK: 2, R: 0 },
      archetype: 'direct-procedure',
      command_verb: 'solve',
      part_count: 1,
    },
    2: {
      marks: 5,
      profile_split: { CK: 1, AK: 2, R: 2 },
      archetype: 'multi-step-application',
      command_verb: 'determine',
      part_count: 2,
    },
    3: {
      marks: 7,
      profile_split: { CK: 1, AK: 3, R: 3 },
      archetype: 'justification',
      command_verb: 'justify',
      part_count: 3,
    },
  } as const;
  return QuestionRecipeZ.parse({ ...common, ...byDifficulty[args.difficulty], kind: 'structured' });
}
