import { z } from 'zod';
import { AbstractArchetypeZ } from '@/lib/generation/corpus-classification';
import type { QuestionBankTargetsArtifact } from '@/lib/generation/question-bank-targets';
import { ContextCategoryZ, type QuestionRecipe } from '@/lib/generation/question-recipe';
import { RenderableVisualTypeZ } from '@/lib/validation/question-visual';

const ScoreZ = z.number().int().min(1).max(5);

export const PilotConcernZ = z.enum([
  'difficulty-mismatch',
  'profile-mismatch',
  'atypical-archetype',
  'wordy-stem',
  'weak-distractors',
  'decorative-visual',
  'visual-scale-risk',
  'visual-label-risk',
  'insufficient-information',
  'non-exam-tone',
  'other',
]);

export const BlindPilotEvaluationZ = z.object({
  question_id: z.string().min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  archetype: AbstractArchetypeZ,
  profile: z.enum(['CK', 'AK', 'R']),
  part_count: z.number().int().min(1).max(20),
  context_category: ContextCategoryZ,
  visual_type: RenderableVisualTypeZ.nullable(),
  exam_fidelity: ScoreZ,
  clarity: ScoreZ,
  visual_legibility: ScoreZ.nullable(),
  visual_necessity: ScoreZ.nullable(),
  readiness: z.enum(['pass', 'review', 'reject']),
  concerns: z.array(PilotConcernZ).max(8),
}).strict();

export const BlindPilotBatchZ = z.object({
  evaluations: z.array(BlindPilotEvaluationZ).min(1).max(12),
}).strict();

export type BlindPilotEvaluation = z.infer<typeof BlindPilotEvaluationZ>;

export function expectedProfile(recipe: QuestionRecipe): 'CK' | 'AK' | 'R' {
  if (recipe.kind === 'mcq') return recipe.profile;
  const maximum = Math.max(recipe.profile_split.CK, recipe.profile_split.AK, recipe.profile_split.R);
  if (recipe.difficulty === 3 && recipe.profile_split.R === maximum) return 'R';
  if (recipe.profile_split.AK === maximum) return 'AK';
  if (recipe.profile_split.R === maximum) return 'R';
  return 'CK';
}

function prevalence(
  distribution: { value: string; share_bps: number }[],
  value: string,
): number {
  return distribution.find((entry) => entry.value === value)?.share_bps ?? 0;
}

export function compareBlindEvaluation(args: {
  targets: QuestionBankTargetsArtifact;
  topicCode: string;
  kind: 'mcq' | 'structured';
  recipe: QuestionRecipe;
  evaluation: BlindPilotEvaluation;
}) {
  const topic = args.targets.topics.find((entry) => entry.topic_code === args.topicCode);
  if (!topic) throw new Error(`No corpus target for ${args.topicCode}`);
  const style = topic.observed_style[args.kind];
  const expected = {
    difficulty: args.recipe.difficulty,
    archetype: args.recipe.archetype,
    profile: expectedProfile(args.recipe),
    part_count: args.recipe.part_count,
    context_category: args.recipe.context_category,
    visual_type: args.recipe.visual_type,
  };
  const matches = {
    difficulty: args.evaluation.difficulty === expected.difficulty,
    archetype: args.evaluation.archetype === expected.archetype,
    profile: args.evaluation.profile === expected.profile,
    part_count: args.evaluation.part_count === expected.part_count,
    context_category: args.evaluation.context_category === expected.context_category,
    visual_type: args.evaluation.visual_type === expected.visual_type,
  };

  const visualValue = args.evaluation.visual_type ?? 'none';
  const nearest = style.representative_patterns
    .map((pattern) => {
      const dimensions = [
        pattern.difficulty === args.evaluation.difficulty,
        pattern.archetype === args.evaluation.archetype,
        pattern.profile === args.evaluation.profile,
        pattern.part_count === args.evaluation.part_count,
        pattern.context_category === args.evaluation.context_category,
        args.evaluation.visual_type === null
          ? pattern.visual_types.length === 0
          : pattern.visual_types.includes(args.evaluation.visual_type),
      ];
      return {
        similarity_bps: Math.round(dimensions.filter(Boolean).length * 10_000 / dimensions.length),
        source_share_bps: pattern.share_bps,
      };
    })
    .sort((a, b) => b.similarity_bps - a.similarity_bps || b.source_share_bps - a.source_share_bps)[0]
    ?? { similarity_bps: 0, source_share_bps: 0 };

  return {
    source_question_count: style.question_count,
    observed_visual_question_share_bps: style.visual_question_share_bps,
    prevalence_bps: {
      difficulty: prevalence(style.distributions.difficulty, String(args.evaluation.difficulty)),
      archetype: prevalence(style.distributions.archetype, args.evaluation.archetype),
      profile: prevalence(style.distributions.profile, args.evaluation.profile),
      part_count: prevalence(style.distributions.part_count, String(args.evaluation.part_count)),
      context_category: prevalence(style.distributions.context_category, args.evaluation.context_category),
      visual_presentation: prevalence(style.distributions.visual_combination, visualValue),
    },
    nearest_representative_pattern: nearest,
    intended_control_matches: matches,
    exact_intended_control_match: Object.values(matches).every(Boolean),
  };
}

export function summarizePilotComparisons(rows: Array<{
  blind_evaluation: BlindPilotEvaluation;
  comparison: ReturnType<typeof compareBlindEvaluation>;
}>) {
  const controlDimensions = rows.flatMap((row) => Object.values(row.comparison.intended_control_matches));
  const difficultyMatches = rows.filter((row) => row.comparison.intended_control_matches.difficulty).length;
  const profileMatches = rows.filter((row) => row.comparison.intended_control_matches.profile).length;
  const visualScores = rows
    .map((row) => row.blind_evaluation.visual_legibility)
    .filter((score): score is number => score !== null);
  const gate_failures: string[] = [];
  if (difficultyMatches < Math.ceil(rows.length * 5 / 6)) {
    gate_failures.push('difficulty-alignment-below-threshold');
  }
  if (profileMatches < Math.ceil(rows.length * 5 / 6)) {
    gate_failures.push('profile-alignment-below-threshold');
  }
  if (rows.some((row) => row.blind_evaluation.readiness === 'reject')) {
    gate_failures.push('blind-review-rejection');
  }
  if (visualScores.some((score) => score < 3)) {
    gate_failures.push('visual-legibility-below-threshold');
  }
  return {
    intended_control_dimension_matches: controlDimensions.filter(Boolean).length,
    intended_control_dimensions: controlDimensions.length,
    difficulty_matches: difficultyMatches,
    profile_matches: profileMatches,
    minimum_visual_legibility: visualScores.length > 0 ? Math.min(...visualScores) : null,
    pilot_gate: gate_failures.length === 0 ? 'pass' as const : 'fail' as const,
    gate_failures,
  };
}
