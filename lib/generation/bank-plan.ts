import { z } from 'zod';
import {
  QuestionBankTargetsArtifactZ,
  type QuestionBankTargetsArtifact,
} from '@/lib/generation/question-bank-targets';
import { RenderableVisualTypeZ } from '@/lib/validation/question-visual';

export const MINIMUM_BANK_TARGET = 400;
export const STRUCTURED_TARGET_SHARE = 0.6;

const PlannedTopicZ = z.object({
  topic_code: z.string().min(1),
  module: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  total: z.number().int().nonnegative(),
  mcq: z.number().int().nonnegative(),
  structured: z.number().int().nonnegative(),
  visual_mcq: z.number().int().nonnegative(),
  visual_structured: z.number().int().nonnegative(),
}).strict().refine((topic) => topic.total === topic.mcq + topic.structured, {
  message: 'topic total must equal its kind totals',
  path: ['total'],
});

export const BankPlanZ = z.object({
  total: z.number().int().positive(),
  launch_minimum: z.literal(MINIMUM_BANK_TARGET),
  by_kind: z.object({
    mcq: z.number().int().nonnegative(),
    structured: z.number().int().nonnegative(),
  }).strict(),
  visual_total: z.number().int().nonnegative(),
  visual_by_type: z.record(RenderableVisualTypeZ, z.number().int().nonnegative()),
  topics: z.array(PlannedTopicZ).length(15),
}).strict().superRefine((plan, context) => {
  const topicTotal = plan.topics.reduce((sum, topic) => sum + topic.total, 0);
  const mcq = plan.topics.reduce((sum, topic) => sum + topic.mcq, 0);
  const structured = plan.topics.reduce((sum, topic) => sum + topic.structured, 0);
  const visualTypes = Object.values(plan.visual_by_type).reduce((sum, count) => sum + count, 0);
  if (topicTotal !== plan.total || mcq !== plan.by_kind.mcq || structured !== plan.by_kind.structured) {
    context.addIssue({ code: 'custom', message: 'topic allocations must match plan totals', path: ['topics'] });
  }
  if (visualTypes !== plan.visual_total) {
    context.addIssue({ code: 'custom', message: 'visual allocations must match visual total', path: ['visual_by_type'] });
  }
});

export type BankPlan = z.infer<typeof BankPlanZ>;

function apportion(total: number, weights: ReadonlyMap<string, number>): Map<string, number> {
  const entries = [...weights.entries()].sort(([a], [b]) => a.localeCompare(b));
  const weightTotal = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (weightTotal <= 0) return new Map(entries.map(([key]) => [key, 0]));
  const quotas = entries.map(([key, weight]) => {
    const exact = total * weight / weightTotal;
    return { key, count: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  const remaining = total - quotas.reduce((sum, quota) => sum + quota.count, 0);
  quotas.sort((a, b) => b.remainder - a.remainder || a.key.localeCompare(b.key));
  for (let index = 0; index < remaining; index++) quotas[index].count++;
  return new Map(quotas.map((quota) => [quota.key, quota.count]));
}

function visualCount(target: number, baselineTarget: number, baselineVisual: number): number {
  if (baselineTarget === 0) return 0;
  return Math.round(target * baselineVisual / baselineTarget);
}

export function scaleBankPlan(
  targets: QuestionBankTargetsArtifact,
  total: number,
): BankPlan {
  QuestionBankTargetsArtifactZ.parse(targets);
  const parsedTotal = z.number().int().positive().max(100_000).parse(total);
  const structured = Math.round(parsedTotal * STRUCTURED_TARGET_SHARE);
  const mcq = parsedTotal - structured;
  const mcqWeights = new Map(targets.topics.map((topic) => [topic.topic_code, topic.official_weight.p1_items]));
  const structuredWeights = new Map(
    targets.topics.map((topic) => [topic.topic_code, topic.official_weight.p2_marks]),
  );
  const mcqByTopic = apportion(mcq, mcqWeights);
  const structuredByTopic = apportion(structured, structuredWeights);
  const topics = targets.topics.map((topic) => {
    const topicMcq = mcqByTopic.get(topic.topic_code) ?? 0;
    const topicStructured = structuredByTopic.get(topic.topic_code) ?? 0;
    return {
      topic_code: topic.topic_code,
      module: topic.module,
      total: topicMcq + topicStructured,
      mcq: topicMcq,
      structured: topicStructured,
      visual_mcq: visualCount(
        topicMcq,
        topic.target_questions.mcq,
        topic.target_visual_questions.mcq,
      ),
      visual_structured: visualCount(
        topicStructured,
        topic.target_questions.structured,
        topic.target_visual_questions.structured,
      ),
    };
  });
  const visualTotal = topics.reduce(
    (sum, topic) => sum + topic.visual_mcq + topic.visual_structured,
    0,
  );
  const visualWeights = new Map(
    Object.entries(targets.summary.visual_target_by_type)
      .filter(([visualType]) => RenderableVisualTypeZ.safeParse(visualType).success),
  );
  const visualByType = Object.fromEntries(apportion(visualTotal, visualWeights));

  return BankPlanZ.parse({
    total: parsedTotal,
    launch_minimum: MINIMUM_BANK_TARGET,
    by_kind: { mcq, structured },
    visual_total: visualTotal,
    visual_by_type: visualByType,
    topics,
  });
}
