import { z } from 'zod';
import {
  AbstractArchetypeZ,
  CorpusClassificationArtifactZ,
  VisualArchetypeZ,
  type CorpusClassificationArtifact,
} from '@/lib/generation/corpus-classification';
import type { SeedTopic } from '@/lib/seed/types';

export const BANK_TARGET_SCHEMA_VERSION = 1;
export const BANK_TARGET_TOTAL = 400;
export const BANK_TARGET_BY_KIND = { mcq: 160, structured: 240 } as const;
export const MIN_STYLE_CONFIDENCE = 0.75;

const KindZ = z.enum(['mcq', 'structured']);
const ProfileZ = z.enum(['CK', 'AK', 'R']);

const DistributionEntryZ = z.object({
  value: z.string().min(1),
  count: z.number().int().positive(),
  share_bps: z.number().int().min(0).max(10_000),
}).strict();

const DistributionZ = z.array(DistributionEntryZ).superRefine((entries, context) => {
  if (entries.length > 0 && entries.reduce((sum, entry) => sum + entry.share_bps, 0) !== 10_000) {
    context.addIssue({ code: 'custom', message: 'distribution shares must sum to 10000 basis points' });
  }
});

const RepresentativePatternZ = z.object({
  objective_ids: z.array(z.string().regex(/^M[123]\.\d+\.\d+$/)).min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  archetype: AbstractArchetypeZ,
  profile: ProfileZ,
  primary_command_verb: z.string().min(1),
  context_category: z.string().min(1),
  part_count: z.number().int().positive(),
  marks: z.number().int().positive().nullable(),
  visual_types: z.array(VisualArchetypeZ),
  count: z.number().int().positive(),
  share_bps: z.number().int().min(0).max(10_000),
}).strict();

const ObservedStyleZ = z.object({
  question_count: z.number().int().nonnegative(),
  source_papers: z.number().int().nonnegative(),
  visual_question_share_bps: z.number().int().min(0).max(10_000),
  pattern_coverage_bps: z.number().int().min(0).max(10_000),
  distributions: z.object({
    objective_id: DistributionZ,
    difficulty: DistributionZ,
    archetype: DistributionZ,
    profile: DistributionZ,
    primary_command_verb: DistributionZ,
    context_category: DistributionZ,
    part_count: DistributionZ,
    marks: DistributionZ,
    visual_combination: DistributionZ,
    visual_type: DistributionZ,
  }).strict(),
  representative_patterns: z.array(RepresentativePatternZ).max(30),
}).strict();

const TopicTargetZ = z.object({
  topic_code: z.string().min(1),
  topic_title: z.string().min(1),
  module: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  order: z.number().int().positive(),
  official_weight: z.object({
    p1_items: z.number().nonnegative(),
    p2_marks: z.number().nonnegative(),
  }).strict(),
  target_questions: z.object({
    total: z.number().int().nonnegative(),
    mcq: z.number().int().nonnegative(),
    structured: z.number().int().nonnegative(),
  }).strict(),
  target_visual_questions: z.object({
    mcq: z.number().int().nonnegative(),
    structured: z.number().int().nonnegative(),
  }).strict(),
  observed_style: z.object({
    mcq: ObservedStyleZ,
    structured: ObservedStyleZ,
  }).strict(),
}).strict().refine(
  (topic) => topic.target_questions.total === topic.target_questions.mcq + topic.target_questions.structured,
  { message: 'topic target total must equal its kind targets', path: ['target_questions', 'total'] },
);

export const QuestionBankTargetsArtifactZ = z.object({
  schema_version: z.literal(BANK_TARGET_SCHEMA_VERSION),
  generated_at: z.string().datetime(),
  source_classification_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  mode: z.literal('unlicensed-metadata-only'),
  policy: z.object({
    coverage_authority: z.literal('2027-official-blueprints'),
    style_source: z.literal('abstract-corpus-fingerprints'),
    source_content_retained: z.literal(false),
    generated_questions_must_be_original: z.literal(true),
  }).strict(),
  eligibility: z.object({
    minimum_confidence: z.literal(MIN_STYLE_CONFIDENCE),
    excluded_question_flags: z.tuple([
      z.literal('objective-ambiguous'),
      z.literal('numbering-ambiguous'),
      z.literal('legacy-only-content'),
      z.literal('other'),
    ]),
  }).strict(),
  summary: z.object({
    source_papers: z.number().int().nonnegative(),
    source_questions: z.number().int().nonnegative(),
    eligible_style_questions: z.number().int().nonnegative(),
    excluded_low_confidence: z.number().int().nonnegative(),
    excluded_missing_objective: z.number().int().nonnegative(),
    excluded_review_flag: z.number().int().nonnegative(),
    topic_attributions: z.number().int().nonnegative(),
    bank_target: z.literal(BANK_TARGET_TOTAL),
    mcq_target: z.literal(BANK_TARGET_BY_KIND.mcq),
    structured_target: z.literal(BANK_TARGET_BY_KIND.structured),
    visual_question_target: z.number().int().nonnegative(),
    visual_target_by_type: z.record(VisualArchetypeZ, z.number().int().nonnegative()),
  }).strict(),
  official_profile_grid: z.array(z.object({
    kind: KindZ,
    module: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    unit: z.enum(['items', 'marks']),
    CK: z.number().int().nonnegative(),
    AK: z.number().int().nonnegative(),
    R: z.number().int().nonnegative(),
  }).strict()).length(6),
  topics: z.array(TopicTargetZ).length(15),
}).strict().superRefine((artifact, context) => {
  const mcq = artifact.topics.reduce((sum, topic) => sum + topic.target_questions.mcq, 0);
  const structured = artifact.topics.reduce((sum, topic) => sum + topic.target_questions.structured, 0);
  if (mcq !== BANK_TARGET_BY_KIND.mcq) {
    context.addIssue({ code: 'custom', message: 'topic MCQ targets must sum to 160', path: ['topics'] });
  }
  if (structured !== BANK_TARGET_BY_KIND.structured) {
    context.addIssue({ code: 'custom', message: 'topic structured targets must sum to 240', path: ['topics'] });
  }
  const visualTypes = Object.values(artifact.summary.visual_target_by_type)
    .reduce((sum, count) => sum + count, 0);
  if (visualTypes !== artifact.summary.visual_question_target) {
    context.addIssue({
      code: 'custom',
      message: 'visual type targets must sum to the visual question target',
      path: ['summary', 'visual_target_by_type'],
    });
  }
});

export type QuestionBankTargetsArtifact = z.infer<typeof QuestionBankTargetsArtifactZ>;

interface BlueprintInput {
  paper: 'P1' | 'P2';
  module: 1 | 2 | 3;
  allocations: { topic_codes: string[]; items?: number; marks?: number }[];
  profile_split: { CK: number; AK: number; R: number };
}

interface StyleSample {
  paperId: string;
  objectiveIds: string[];
  difficulty: 1 | 2 | 3;
  archetype: z.infer<typeof AbstractArchetypeZ>;
  profile: 'CK' | 'AK' | 'R';
  primaryCommandVerb: string;
  contextCategory: string;
  partCount: number;
  marks: number | null;
  visualTypes: z.infer<typeof VisualArchetypeZ>[];
}

function distribute(total: number, weights: ReadonlyMap<string, number>): Map<string, number> {
  const entries = [...weights.entries()].sort(([a], [b]) => a.localeCompare(b));
  const denominator = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (denominator <= 0) return new Map(entries.map(([key]) => [key, 0]));
  const quotas = entries.map(([key, weight]) => {
    const exact = total * weight / denominator;
    return { key, floor: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  const remaining = total - quotas.reduce((sum, item) => sum + item.floor, 0);
  quotas.sort((a, b) => b.remainder - a.remainder || a.key.localeCompare(b.key));
  for (let index = 0; index < remaining; index++) quotas[index].floor++;
  return new Map(quotas.map((item) => [item.key, item.floor]));
}

function makeDistribution(values: string[]): z.infer<typeof DistributionZ> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const shares = distribute(10_000, counts);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count, share_bps: shares.get(value) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function distributeWithMinimum(total: number, weights: ReadonlyMap<string, number>): Map<string, number> {
  if (total < weights.size) return distribute(total, weights);
  const additional = distribute(total - weights.size, weights);
  return new Map([...weights.keys()].map((key) => [key, 1 + (additional.get(key) ?? 0)]));
}

function patternKey(sample: StyleSample): string {
  return JSON.stringify([
    [...sample.objectiveIds].sort(),
    sample.difficulty,
    sample.archetype,
    sample.profile,
    sample.primaryCommandVerb,
    sample.contextCategory,
    sample.partCount,
    sample.marks,
    [...sample.visualTypes].sort(),
  ]);
}

function observedStyle(samples: StyleSample[]): z.infer<typeof ObservedStyleZ> {
  const visualSamples = samples.filter((sample) => sample.visualTypes.length > 0);
  const grouped = new Map<string, { sample: StyleSample; count: number }>();
  for (const sample of samples) {
    const key = patternKey(sample);
    const current = grouped.get(key);
    grouped.set(key, current ? { ...current, count: current.count + 1 } : { sample, count: 1 });
  }
  const ordered = [...grouped.values()].sort(
    (a, b) => b.count - a.count || patternKey(a.sample).localeCompare(patternKey(b.sample)),
  );
  const selected = new Map(ordered.slice(0, 12).map((entry) => [patternKey(entry.sample), entry]));
  for (const visualType of VisualArchetypeZ.options) {
    const best = ordered.find((entry) => entry.sample.visualTypes.includes(visualType));
    if (best) selected.set(patternKey(best.sample), best);
  }
  const representative = [...selected.values()]
    .sort((a, b) => b.count - a.count || patternKey(a.sample).localeCompare(patternKey(b.sample)))
    .slice(0, 30);
  const denominator = Math.max(1, samples.length);
  const representativePatterns = representative.map(({ sample, count }) => ({
    objective_ids: [...sample.objectiveIds].sort(),
    difficulty: sample.difficulty,
    archetype: sample.archetype,
    profile: sample.profile,
    primary_command_verb: sample.primaryCommandVerb,
    context_category: sample.contextCategory,
    part_count: sample.partCount,
    marks: sample.marks,
    visual_types: [...sample.visualTypes].sort(),
    count,
    share_bps: Math.round(count * 10_000 / denominator),
  }));

  return ObservedStyleZ.parse({
    question_count: samples.length,
    source_papers: new Set(samples.map((sample) => sample.paperId)).size,
    visual_question_share_bps: Math.round(visualSamples.length * 10_000 / denominator),
    pattern_coverage_bps: Math.min(
      10_000,
      Math.round(representative.reduce((sum, entry) => sum + entry.count, 0) * 10_000 / denominator),
    ),
    distributions: {
      objective_id: makeDistribution(samples.flatMap((sample) => sample.objectiveIds)),
      difficulty: makeDistribution(samples.map((sample) => String(sample.difficulty))),
      archetype: makeDistribution(samples.map((sample) => sample.archetype)),
      profile: makeDistribution(samples.map((sample) => sample.profile)),
      primary_command_verb: makeDistribution(samples.map((sample) => sample.primaryCommandVerb)),
      context_category: makeDistribution(samples.map((sample) => sample.contextCategory)),
      part_count: makeDistribution(samples.map((sample) => String(sample.partCount))),
      marks: makeDistribution(samples.map((sample) => sample.marks === null ? 'unknown' : String(sample.marks))),
      visual_combination: makeDistribution(samples.map((sample) =>
        sample.visualTypes.length > 0 ? [...sample.visualTypes].sort().join('+') : 'none')),
      visual_type: makeDistribution(visualSamples.flatMap((sample) => sample.visualTypes)),
    },
    representative_patterns: representativePatterns,
  });
}

function paperWeights(blueprints: BlueprintInput[], paper: 'P1' | 'P2'): Map<string, number> {
  const weights = new Map<string, number>();
  for (const blueprint of blueprints.filter((entry) => entry.paper === paper)) {
    for (const allocation of blueprint.allocations) {
      const value = paper === 'P1' ? allocation.items ?? 0 : allocation.marks ?? 0;
      const share = value / allocation.topic_codes.length;
      for (const topicCode of allocation.topic_codes) {
        weights.set(topicCode, (weights.get(topicCode) ?? 0) + share);
      }
    }
  }
  return weights;
}

export function buildQuestionBankTargets(args: {
  classification: CorpusClassificationArtifact;
  classificationHash: string;
  topics: SeedTopic[];
  blueprints: BlueprintInput[];
  generatedAt?: string;
}): QuestionBankTargetsArtifact {
  CorpusClassificationArtifactZ.parse(args.classification);
  const objectiveToTopic = new Map(
    args.topics.flatMap((topic) => topic.objectives.map((objective) => [objective.id, topic.code] as const)),
  );
  const samples = new Map<string, { mcq: StyleSample[]; structured: StyleSample[] }>(
    args.topics.map((topic) => [topic.code, { mcq: [], structured: [] }]),
  );
  const excludedFlags = new Set(['objective-ambiguous', 'numbering-ambiguous', 'legacy-only-content', 'other']);
  let eligibleStyleQuestions = 0;
  let excludedLowConfidence = 0;
  let excludedMissingObjective = 0;
  let excludedReviewFlag = 0;
  let topicAttributions = 0;

  for (const paper of args.classification.papers) {
    for (const question of paper.classification.questions) {
      if (question.confidence < MIN_STYLE_CONFIDENCE) {
        excludedLowConfidence++;
        continue;
      }
      const topicCodes = new Set(
        question.objective_ids
          .map((id) => objectiveToTopic.get(id))
          .filter((topicCode): topicCode is string => topicCode !== undefined),
      );
      if (topicCodes.size === 0) {
        excludedMissingObjective++;
        continue;
      }
      if (question.review_flags.some((flag) => excludedFlags.has(flag))) {
        excludedReviewFlag++;
        continue;
      }
      eligibleStyleQuestions++;
      const kind = paper.paper === 1 ? 'mcq' : 'structured';
      for (const topicCode of topicCodes) {
        samples.get(topicCode)?.[kind].push({
          paperId: paper.corpus_entry_id,
          objectiveIds: question.objective_ids.filter((id) => objectiveToTopic.get(id) === topicCode),
          difficulty: question.difficulty,
          archetype: question.archetype,
          profile: question.inferred_profile,
          primaryCommandVerb: question.command_verbs[0] ?? 'none',
          contextCategory: question.context_category,
          partCount: question.part_count,
          marks: question.marks,
          visualTypes: question.visual_types,
        });
        topicAttributions++;
      }
    }
  }

  const p1Weights = paperWeights(args.blueprints, 'P1');
  const p2Weights = paperWeights(args.blueprints, 'P2');
  const mcqTargets = distribute(BANK_TARGET_BY_KIND.mcq, p1Weights);
  const structuredTargets = distribute(BANK_TARGET_BY_KIND.structured, p2Weights);

  const topics = args.topics
    .sort((a, b) => a.module - b.module || a.order - b.order)
    .map((topic) => {
      const observedMcq = observedStyle(samples.get(topic.code)?.mcq ?? []);
      const observedStructured = observedStyle(samples.get(topic.code)?.structured ?? []);
      const mcq = mcqTargets.get(topic.code) ?? 0;
      const structured = structuredTargets.get(topic.code) ?? 0;
      const targetVisualQuestions = {
        mcq: Math.round(mcq * observedMcq.visual_question_share_bps / 10_000),
        structured: Math.round(structured * observedStructured.visual_question_share_bps / 10_000),
      };
      return {
        topic_code: topic.code,
        topic_title: topic.title,
        module: topic.module,
        order: topic.order,
        official_weight: {
          p1_items: p1Weights.get(topic.code) ?? 0,
          p2_marks: p2Weights.get(topic.code) ?? 0,
        },
        target_questions: { total: mcq + structured, mcq, structured },
        target_visual_questions: targetVisualQuestions,
        observed_style: { mcq: observedMcq, structured: observedStructured },
      };
    });

  const visualWeights = new Map<string, number>();
  for (const topic of topics) {
    for (const kind of ['mcq', 'structured'] as const) {
      const target = topic.target_visual_questions[kind];
      for (const visual of topic.observed_style[kind].distributions.visual_type) {
        const expected = target * visual.share_bps / 10_000;
        visualWeights.set(visual.value, (visualWeights.get(visual.value) ?? 0) + expected);
      }
    }
  }
  const visualQuestionTarget = topics.reduce(
    (sum, topic) => sum + topic.target_visual_questions.mcq + topic.target_visual_questions.structured,
    0,
  );
  const visualTargetByType = Object.fromEntries(
    [...distributeWithMinimum(visualQuestionTarget, visualWeights).entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
  );

  return QuestionBankTargetsArtifactZ.parse({
    schema_version: BANK_TARGET_SCHEMA_VERSION,
    generated_at: args.generatedAt ?? new Date().toISOString(),
    source_classification_sha256: args.classificationHash,
    mode: 'unlicensed-metadata-only',
    policy: {
      coverage_authority: '2027-official-blueprints',
      style_source: 'abstract-corpus-fingerprints',
      source_content_retained: false,
      generated_questions_must_be_original: true,
    },
    eligibility: {
      minimum_confidence: MIN_STYLE_CONFIDENCE,
      excluded_question_flags: [
        'objective-ambiguous',
        'numbering-ambiguous',
        'legacy-only-content',
        'other',
      ],
    },
    summary: {
      source_papers: args.classification.summary.classified_papers,
      source_questions: args.classification.summary.classified_questions,
      eligible_style_questions: eligibleStyleQuestions,
      excluded_low_confidence: excludedLowConfidence,
      excluded_missing_objective: excludedMissingObjective,
      excluded_review_flag: excludedReviewFlag,
      topic_attributions: topicAttributions,
      bank_target: BANK_TARGET_TOTAL,
      mcq_target: BANK_TARGET_BY_KIND.mcq,
      structured_target: BANK_TARGET_BY_KIND.structured,
      visual_question_target: visualQuestionTarget,
      visual_target_by_type: visualTargetByType,
    },
    official_profile_grid: args.blueprints.map((blueprint) => ({
      kind: blueprint.paper === 'P1' ? 'mcq' : 'structured',
      module: blueprint.module,
      unit: blueprint.paper === 'P1' ? 'items' : 'marks',
      ...blueprint.profile_split,
    })),
    topics,
  });
}
