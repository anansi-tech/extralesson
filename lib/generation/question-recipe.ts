import { z } from 'zod';
import { OBJECTIVE_ID_RE } from '@/lib/validation/question';
import { RenderableVisualTypeZ } from '@/lib/validation/question-visual';
import type { QuestionBankTargetsArtifact } from '@/lib/generation/question-bank-targets';

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
  'complete',
  'construct',
  'describe',
  'determine',
  'draw',
  'estimate',
  'evaluate',
  'explain',
  'express',
  'factorise',
  'factorize',
  'find',
  'identify',
  'interpret',
  'justify',
  'label',
  'list',
  'measure',
  'plot',
  'prove',
  'represent',
  'shade',
  'show',
  'simplify',
  'sketch',
  'solve',
  'state',
  'write',
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
  'school',
  'other',
]);

const RecipeBaseZ = z.object({
  objective_ids: z.array(z.string().regex(OBJECTIVE_ID_RE)).min(1).max(2),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  archetype: QuestionArchetypeZ,
  command_verb: CommandVerbZ.nullable(),
  representation: RepresentationZ,
  context_category: ContextCategoryZ,
  visual_type: RenderableVisualTypeZ.nullable().default(null),
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

export function questionMatchesRecipe(
  question: {
    kind: 'mcq' | 'structured';
    difficulty: 1 | 2 | 3;
    marks: number;
    objective_ids: string[];
    profile?: 'CK' | 'AK' | 'R';
    rubric?: {
      profile: 'CK' | 'AK' | 'R';
      mark_value: number;
      code?: string;
      criterion?: string;
    }[];
    visual?: { visual_type: string } | null;
  },
  recipe: QuestionRecipe,
): boolean {
  if (
    question.kind !== recipe.kind ||
    question.difficulty !== recipe.difficulty ||
    question.marks !== recipe.marks ||
    question.objective_ids.length !== recipe.objective_ids.length ||
    !question.objective_ids.every((id) => recipe.objective_ids.includes(id)) ||
    (question.visual?.visual_type ?? null) !== recipe.visual_type
  ) {
    return false;
  }

  if (question.kind === 'mcq' && recipe.kind === 'mcq') {
    return question.profile === recipe.profile;
  }
  if (question.kind === 'structured' && recipe.kind === 'structured') {
    if (!question.rubric) return false;
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
    visual_type: null,
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

function isVisualPattern(pattern: { visual_types: string[] }): boolean {
  return pattern.visual_types.some((visualType) => RenderableVisualTypeZ.safeParse(visualType).success);
}

function visualDue(ordinal: number, shareBps: number): boolean {
  return Math.floor((ordinal + 1) * shareBps / 10_000) > Math.floor(ordinal * shareBps / 10_000);
}

function weightedPattern<T extends { count: number }>(patterns: T[], ordinal: number): T | undefined {
  const total = patterns.reduce((sum, pattern) => sum + pattern.count, 0);
  if (total <= 0) return undefined;
  let slot = ordinal % total;
  for (const pattern of patterns) {
    if (slot < pattern.count) return pattern;
    slot -= pattern.count;
  }
  return patterns[0];
}

function representationForVisual(
  visualType: z.infer<typeof RenderableVisualTypeZ> | null,
): z.infer<typeof RepresentationZ> {
  if (!visualType) return 'symbolic';
  if (['data-table', 'statistical-chart', 'matrix-diagram'].includes(visualType)) return 'inline-data';
  return 'coordinate-data';
}

export function buildCorpusInformedQuestionRecipe(args: {
  targets: QuestionBankTargetsArtifact;
  topicCode: string;
  objectiveIds: string[];
  kind: 'mcq' | 'structured';
  difficulty: 1 | 2 | 3;
  ordinal: number;
}): QuestionRecipe {
  const fallback = buildDefaultQuestionRecipe({
    objectiveIds: args.objectiveIds,
    kind: args.kind,
    difficulty: args.difficulty,
  });
  const topic = args.targets.topics.find((candidate) => candidate.topic_code === args.topicCode);
  if (!topic) return fallback;
  const style = topic.observed_style[args.kind];
  let pool = style.representative_patterns.filter((pattern) => pattern.difficulty === args.difficulty);
  if (pool.length === 0) pool = style.representative_patterns;

  const wantsVisual = visualDue(args.ordinal, style.visual_question_share_bps);
  const presentationPool = pool.filter((pattern) => isVisualPattern(pattern) === wantsVisual);
  if (presentationPool.length > 0) pool = presentationPool;
  const objectivePool = pool.filter((pattern) =>
    args.objectiveIds.some((objectiveId) => pattern.objective_ids.includes(objectiveId)));
  if (objectivePool.length > 0) pool = objectivePool;
  const pattern = weightedPattern(pool, args.ordinal);
  if (!pattern) return fallback;

  const command = pattern.primary_command_verb === 'none'
    ? null
    : CommandVerbZ.safeParse(pattern.primary_command_verb);
  const context = ContextCategoryZ.safeParse(pattern.context_category === 'finance'
    ? 'consumer'
    : pattern.context_category);
  const renderableVisuals = pattern.visual_types
    .map((visualType) => RenderableVisualTypeZ.safeParse(visualType))
    .filter((result): result is { success: true; data: z.infer<typeof RenderableVisualTypeZ> } => result.success)
    .map((result) => result.data);
  const visualType = wantsVisual && renderableVisuals.length > 0
    ? renderableVisuals[args.ordinal % renderableVisuals.length]
    : null;

  return QuestionRecipeZ.parse({
    ...fallback,
    archetype: pattern.archetype,
    command_verb: command === null ? null : command.success ? command.data : fallback.command_verb,
    context_category: context.success ? context.data : fallback.context_category,
    representation: representationForVisual(visualType),
    visual_type: visualType,
  });
}
