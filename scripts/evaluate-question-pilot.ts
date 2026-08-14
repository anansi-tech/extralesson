// Blind evaluation of a small generated pilot. The evaluator sees the question
// presentation but not its requested recipe, recorded difficulty/profile,
// answers, solutions, generation model, or corpus targets. The saved artifact
// contains only abstract judgments and comparisons—never source-paper content.
import 'dotenv/config';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import targetsJson from '@/design/research/question-bank-targets.json';
import { dbConnect, Question } from '@/lib/db';
import { QuestionBankTargetsArtifactZ } from '@/lib/generation/question-bank-targets';
import {
  BlindPilotBatchZ,
  BlindPilotEvaluationZ,
  compareBlindEvaluation,
  expectedProfile,
  expectedProfiles,
  summarizePilotComparisons,
} from '@/lib/generation/pilot-evaluation';
import { QuestionRecipeZ } from '@/lib/generation/question-recipe';
import { topicCodeForObjective } from '@/lib/generation/topic-lookup';
import { QuestionVisualZ } from '@/lib/validation/question-visual';
import { buildBlindBatchReviewPrompt } from '@/lib/prompts/question-review';

const DEFAULT_OUTPUT = 'design/research/question-bank-pilot-evaluation.json';
const DEFAULT_MODEL = 'gpt-5.6-luna';

const EnvZ = z.object({
  AI_API_KEY: z.string().min(1),
  PILOT_EVALUATOR_MODEL: z.string().min(1).default(DEFAULT_MODEL),
});

const ArgsZ = z.object({
  since: z.string().datetime(),
  limit: z.coerce.number().int().min(1).max(12).default(6),
  output: z.string().min(1).default(DEFAULT_OUTPUT),
  promptVersion: z.string().min(1).optional(),
  reuseEvaluationsFrom: z.string().min(1).optional(),
  reuseGenerationReviews: z.boolean(),
}).strict().refine(
  (args) => !(args.reuseEvaluationsFrom && args.reuseGenerationReviews),
  { message: 'choose only one evaluation reuse source' },
);

const ReusableEvaluationArtifactZ = z.object({
  evaluator: z.object({ model: z.string().min(1) }).passthrough(),
  questions: z.array(z.object({
    question_id: z.string().min(1),
    blind_evaluation: BlindPilotEvaluationZ,
  }).passthrough()).min(1),
}).passthrough();

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const index = argv.indexOf(`--${flag}`);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  return ArgsZ.parse({
    since: get('since'), limit: get('limit'), output: get('output'),
    promptVersion: get('prompt-version'),
    reuseEvaluationsFrom: get('reuse-evaluations-from'),
    reuseGenerationReviews: argv.includes('--reuse-generation-reviews'),
  });
}

const StoredQuestionZ = z.object({
  _id: z.unknown().transform(String),
  objective_ids: z.array(z.string()).min(1),
  kind: z.enum(['mcq', 'structured']),
  stem: z.string(),
  options: z.array(z.string()).optional().default([]),
  marks: z.number().int().positive(),
  visual: QuestionVisualZ.nullable().optional().default(null),
  gen_meta: z.object({
    recipe: QuestionRecipeZ,
    prompt_version: z.string().min(1),
    review: z.object({
      primary_model: z.string().min(1),
      primary: BlindPilotEvaluationZ,
    }).passthrough().nullable().optional(),
  }),
}).passthrough();

function blindQuestions(questions: z.infer<typeof StoredQuestionZ>[]) {
  return questions.map((question) => ({
    question_id: question._id,
    kind: question.kind,
    stem: question.stem,
    options: question.kind === 'mcq' ? question.options : undefined,
    marks: question.marks,
    visual: question.visual,
  }));
}

async function main() {
  const args = parseArgs();
  const targets = QuestionBankTargetsArtifactZ.parse(targetsJson);
  await dbConnect();
  const query: Record<string, unknown> = {
    status: 'draft',
    'gen_meta.ts': { $gte: new Date(args.since) },
  };
  if (args.promptVersion) query['gen_meta.prompt_version'] = args.promptVersion;
  const raw = await Question.find(query).sort({ 'gen_meta.ts': 1 }).limit(args.limit).lean();
  const questions = z.array(StoredQuestionZ).length(args.limit).parse(raw);

  let object: z.infer<typeof BlindPilotBatchZ>;
  let usage = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, reasoningTokens: 0 };
  let evaluatorModel: string;
  let reusedSource: string | null = null;
  if (args.reuseEvaluationsFrom) {
    const stored = ReusableEvaluationArtifactZ.parse(
      JSON.parse(await readFile(args.reuseEvaluationsFrom, 'utf8')),
    );
    const byId = new Map(stored.questions.map((row) => [row.question_id, row.blind_evaluation]));
    const reused = questions.map((question) => byId.get(question._id));
    if (reused.some((evaluation) => !evaluation)) {
      throw new Error('Reusable artifact does not contain every selected question id');
    }
    object = BlindPilotBatchZ.parse({ evaluations: reused });
    evaluatorModel = stored.evaluator.model;
    reusedSource = args.reuseEvaluationsFrom;
  } else if (args.reuseGenerationReviews) {
    const models = new Set(questions.map((question) => question.gen_meta.review?.primary_model));
    if (models.size !== 1 || models.has(undefined)) {
      throw new Error('Selected questions do not share one stored primary review model');
    }
    object = BlindPilotBatchZ.parse({
      evaluations: questions.map((question) => ({
        ...question.gen_meta.review!.primary,
        question_id: question._id,
      })),
    });
    evaluatorModel = [...models][0]!;
    reusedSource = 'gen_meta.review.primary';
  } else {
    const env = EnvZ.parse(process.env);
    const openai = createOpenAI({ apiKey: env.AI_API_KEY });
    const result = await generateObject({
      model: openai(env.PILOT_EVALUATOR_MODEL),
      schema: BlindPilotBatchZ,
      prompt: buildBlindBatchReviewPrompt(blindQuestions(questions)),
      maxOutputTokens: 8_000,
      providerOptions: { openai: { reasoningEffort: 'low' } },
    });
    object = result.object;
    usage = {
      inputTokens: result.usage.inputTokens ?? 0,
      cachedInputTokens: result.usage.cachedInputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
      reasoningTokens: result.usage.reasoningTokens ?? 0,
    };
    evaluatorModel = env.PILOT_EVALUATOR_MODEL;
  }
  const expectedIds = questions.map((question) => question._id);
  const actualIds = object.evaluations.map((evaluation) => evaluation.question_id);
  if (new Set(actualIds).size !== expectedIds.length || actualIds.some((id, index) => id !== expectedIds[index])) {
    throw new Error('Blind evaluator returned missing, duplicate, or reordered question ids');
  }

  const rows = questions.map((question, index) => {
    const recipe = question.gen_meta.recipe;
    const evaluation = object.evaluations[index];
    const topicCode = topicCodeForObjective(question.objective_ids[0]);
    return {
      question_id: question._id,
      topic_code: topicCode,
      kind: question.kind,
      intended_control: {
        difficulty: recipe.difficulty,
        archetype: recipe.archetype,
        profile: expectedProfile(recipe),
        acceptable_profiles: expectedProfiles(recipe),
        part_count: recipe.part_count,
        context_category: recipe.context_category,
        visual_type: recipe.visual_type,
      },
      blind_evaluation: evaluation,
      comparison: compareBlindEvaluation({
        targets,
        topicCode,
        kind: question.kind,
        recipe,
        evaluation,
      }),
    };
  });
  const scores = rows.flatMap((row) => [row.blind_evaluation.exam_fidelity, row.blind_evaluation.clarity]);
  const gateSummary = summarizePilotComparisons(rows);
  const artifact = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    mode: 'unlicensed-metadata-only',
    source_classification_sha256: targets.source_classification_sha256,
    pilot: {
      since: args.since,
      question_count: rows.length,
      status_at_evaluation: 'draft',
      generation_prompt_filter: args.promptVersion ?? null,
      generation_prompt_versions: [...new Set(questions.map((question) => question.gen_meta.prompt_version))]
        .sort(),
    },
    evaluator: {
      model: evaluatorModel,
      reused_evaluations_from: reusedSource,
      blind_inputs_excluded: ['recipe', 'recorded-difficulty', 'recorded-profile', 'answer', 'solution', 'corpus-targets', 'generation-model'],
      usage: {
        input_tokens: usage.inputTokens ?? 0,
        cached_input_tokens: usage.cachedInputTokens ?? 0,
        output_tokens: usage.outputTokens ?? 0,
        reasoning_tokens: usage.reasoningTokens ?? 0,
      },
    },
    summary: {
      pass: rows.filter((row) => row.blind_evaluation.readiness === 'pass').length,
      review: rows.filter((row) => row.blind_evaluation.readiness === 'review').length,
      reject: rows.filter((row) => row.blind_evaluation.readiness === 'reject').length,
      exact_intended_control_matches: rows.filter((row) => row.comparison.exact_intended_control_match).length,
      mean_fidelity_and_clarity_bps: Math.round(scores.reduce((sum, score) => sum + score, 0) * 10_000 / (scores.length * 5)),
      ...gateSummary,
    },
    questions: rows,
  };
  await mkdir(dirname(args.output), { recursive: true });
  const temporary = `${args.output}.tmp`;
  await writeFile(temporary, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  await rename(temporary, args.output);
  console.log(`Evaluated ${rows.length} questions with ${evaluatorModel}${reusedSource ? ' (stored judgments; zero new model calls)' : ''}.`);
  console.log(`Readiness: pass=${artifact.summary.pass}, review=${artifact.summary.review}, reject=${artifact.summary.reject}.`);
  console.log(`Token usage: input=${artifact.evaluator.usage.input_tokens}, cached=${artifact.evaluator.usage.cached_input_tokens}, output=${artifact.evaluator.usage.output_tokens}, reasoning=${artifact.evaluator.usage.reasoning_tokens}.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
