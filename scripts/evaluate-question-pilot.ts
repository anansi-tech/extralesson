// Blind evaluation of a small generated pilot. The evaluator sees the question
// presentation but not its requested recipe, recorded difficulty/profile,
// answers, solutions, generation model, or corpus targets. The saved artifact
// contains only abstract judgments and comparisons—never source-paper content.
import 'dotenv/config';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import targetsJson from '@/design/research/question-bank-targets.json';
import { dbConnect, Question } from '@/lib/db';
import { QuestionBankTargetsArtifactZ } from '@/lib/generation/question-bank-targets';
import {
  BlindPilotBatchZ,
  compareBlindEvaluation,
  expectedProfile,
} from '@/lib/generation/pilot-evaluation';
import { QuestionRecipeZ } from '@/lib/generation/question-recipe';
import { QuestionVisualZ } from '@/lib/validation/question-visual';

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
}).strict();

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const index = argv.indexOf(`--${flag}`);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  return ArgsZ.parse({ since: get('since'), limit: get('limit'), output: get('output') });
}

const StoredQuestionZ = z.object({
  _id: z.unknown().transform(String),
  objective_ids: z.array(z.string()).min(1),
  kind: z.enum(['mcq', 'structured']),
  stem: z.string(),
  options: z.array(z.string()).optional().default([]),
  marks: z.number().int().positive(),
  visual: QuestionVisualZ.nullable().optional().default(null),
  gen_meta: z.object({ recipe: QuestionRecipeZ }),
}).passthrough();

function buildPrompt(questions: z.infer<typeof StoredQuestionZ>[]) {
  const blindQuestions = questions.map((question) => ({
    question_id: question._id,
    kind: question.kind,
    stem: question.stem,
    options: question.kind === 'mcq' ? question.options : undefined,
    marks: question.marks,
    visual: question.visual,
  }));
  return `Act as an independent CSEC Mathematics assessment reviewer. Evaluate each ORIGINAL practice question blindly for difficulty and exam-paper presentation.

You are not given the author's intended difficulty, profile, archetype, recipe, answer, solution, source fingerprint, or generation model. Infer every judgment from the displayed question only.

Scale definitions:
- difficulty 1: routine single-step; 2: multi-step or meaningful interpretation; 3: demanding multi-concept/reasoning.
- profile CK: recall/recognition; AK: carry out a procedure; R: translate, justify, or integrate reasoning. Choose the dominant demand.
- exam_fidelity and clarity: 1 poor to 5 excellent.
- visual_legibility and visual_necessity: 1 poor/decorative to 5 excellent/essential; use null when there is no visual.
- readiness pass: could enter human content review unchanged; review: promising but needs editing; reject: materially misleading, ambiguous, malformed, or unlike the expected exam standard.

Renderer facts needed for a fair presentation judgment:
- diagram coordinates use a fixed 0–100 canvas and are not auto-zoomed;
- plot coordinates are auto-scaled with equal x/y unit scale;
- charts auto-scale their values;
- set diagrams use fixed centered set circles.

Use concerns sparingly and consistently. A visual is decorative when the stem repeats its decisive data or it does not materially support solving. A diagram has visual-scale-risk when its content occupies only a small fraction of its fixed canvas.

Questions:
${JSON.stringify(blindQuestions)}

Return exactly one evaluation for each question_id, in the same order.`;
}

function topicForObjective(objectiveId: string) {
  const modulePrefix = objectiveId.slice(0, 2);
  const section = objectiveId.split('.')[1];
  const byPrefix: Record<string, string> = {
    'M1.1': 'M1-NUM', 'M1.2': 'M1-COMP', 'M1.3': 'M1-SETS', 'M1.4': 'M1-MEAS', 'M1.5': 'M1-ALG1',
    'M2.1': 'M2-STAT1', 'M2.2': 'M2-STAT2', 'M2.3': 'M2-RFG1', 'M2.4': 'M2-GEO1', 'M2.5': 'M2-TRIG1',
    'M3.1': 'M3-SEQ', 'M3.2': 'M3-VAR', 'M3.3': 'M3-GEO2', 'M3.4': 'M3-VM2', 'M3.5': 'M3-PROB',
  };
  const topic = byPrefix[`${modulePrefix}.${section}`];
  if (!topic) throw new Error(`No topic mapping for ${objectiveId}`);
  return topic;
}

async function main() {
  const args = parseArgs();
  const env = EnvZ.parse(process.env);
  const targets = QuestionBankTargetsArtifactZ.parse(targetsJson);
  await dbConnect();
  const raw = await Question.find({
    status: 'draft',
    'gen_meta.prompt_version': 'v5',
    'gen_meta.ts': { $gte: new Date(args.since) },
  }).sort({ 'gen_meta.ts': 1 }).limit(args.limit).lean();
  const questions = z.array(StoredQuestionZ).length(args.limit).parse(raw);

  const openai = createOpenAI({ apiKey: env.AI_API_KEY });
  const { object, usage } = await generateObject({
    model: openai(env.PILOT_EVALUATOR_MODEL),
    schema: BlindPilotBatchZ,
    prompt: buildPrompt(questions),
    maxOutputTokens: 8_000,
    providerOptions: { openai: { reasoningEffort: 'low' } },
  });
  const expectedIds = questions.map((question) => question._id);
  const actualIds = object.evaluations.map((evaluation) => evaluation.question_id);
  if (new Set(actualIds).size !== expectedIds.length || actualIds.some((id, index) => id !== expectedIds[index])) {
    throw new Error('Blind evaluator returned missing, duplicate, or reordered question ids');
  }

  const rows = questions.map((question, index) => {
    const recipe = question.gen_meta.recipe;
    const evaluation = object.evaluations[index];
    const topicCode = topicForObjective(question.objective_ids[0]);
    return {
      question_id: question._id,
      topic_code: topicCode,
      kind: question.kind,
      intended_control: {
        difficulty: recipe.difficulty,
        archetype: recipe.archetype,
        profile: expectedProfile(recipe),
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
  const artifact = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    mode: 'unlicensed-metadata-only',
    source_classification_sha256: targets.source_classification_sha256,
    pilot: { since: args.since, question_count: rows.length, status_at_evaluation: 'draft' },
    evaluator: {
      model: env.PILOT_EVALUATOR_MODEL,
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
    },
    questions: rows,
  };
  await mkdir(dirname(args.output), { recursive: true });
  const temporary = `${args.output}.tmp`;
  await writeFile(temporary, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  await rename(temporary, args.output);
  console.log(`Evaluated ${rows.length} questions with ${env.PILOT_EVALUATOR_MODEL}.`);
  console.log(`Readiness: pass=${artifact.summary.pass}, review=${artifact.summary.review}, reject=${artifact.summary.reject}.`);
  console.log(`Token usage: input=${artifact.evaluator.usage.input_tokens}, cached=${artifact.evaluator.usage.cached_input_tokens}, output=${artifact.evaluator.usage.output_tokens}, reasoning=${artifact.evaluator.usage.reasoning_tokens}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
