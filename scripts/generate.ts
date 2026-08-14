// Question generation pipeline (ROUND_1 §4).
// Usage: pnpm generate -- --topic M1-ALG1 --difficulty 2 --count 10 --kind structured
//   [--presentation auto|visual|text] [--dry-run]
//
// `--count` is the TARGET number of questions for (topic, kind, difficulty):
// existing non-retired questions count toward it, so re-running is idempotent
// and an interrupted run is resumable.
//
// `--poison` is a verification hook (ROUND_1 §9.3): it instructs the draft
// model to embed a wrong answer, demonstrating that the independent solve
// pass rejects bad drafts. Never use it to fill the bank.
import 'dotenv/config';
import { z } from 'zod';
import { generateObject, NoObjectGeneratedError } from 'ai';
import targetsJson from '@/design/research/question-bank-targets.json';
import {
  escalationModel,
  ESCALATION_MODEL_ID,
  model,
  MODEL_ID,
  reviewModel,
  REVIEW_MODEL_ID,
} from '@/lib/ai';
import { dbConnect, Question, Topic } from '@/lib/db';
import { QuestionDraftZ } from '@/lib/validation/question';
import { answersEquivalent } from '@/lib/grade/equivalence';
import { normalizeEscapedNewlines } from '@/lib/text';
import { QuestionVisualZ } from '@/lib/validation/question-visual';
import { buildDraftPrompt, buildSolvePrompt, PROMPT_VERSION } from '@/lib/prompts/question-gen';
import {
  buildCorpusInformedQuestionRecipe,
  hasObservedDifficulty,
  pickCorpusInformedObjective,
  questionMatchesRecipe,
  RecipePresentationZ,
} from '@/lib/generation/question-recipe';
import { QuestionBankTargetsArtifactZ } from '@/lib/generation/question-bank-targets';
import { repairQuestionOutput } from '@/lib/generation/question-output';
import {
  blindReviewIssues,
  deterministicPresentationIssues,
  reviewRouteForModule,
} from '@/lib/generation/question-quality';
import { BlindPilotEvaluationZ } from '@/lib/generation/pilot-evaluation';
import {
  buildBlindSingleReviewPrompt,
  QUESTION_REVIEW_PROMPT_VERSION,
} from '@/lib/prompts/question-review';

const bankTargets = QuestionBankTargetsArtifactZ.parse(targetsJson);

const ArgsZ = z.object({
  topic: z.string().regex(/^M[123]-[A-Z0-9]+$/),
  difficulty: z.coerce.number().pipe(z.union([z.literal(1), z.literal(2), z.literal(3)])),
  count: z.coerce.number().int().min(1).max(50),
  kind: z.enum(['mcq', 'structured']),
  presentation: RecipePresentationZ,
  maxAttempts: z.coerce.number().int().min(1).max(150).optional(),
  dryRun: z.boolean(),
  poison: z.boolean(),
});

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const i = argv.indexOf(`--${flag}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const parsed = ArgsZ.safeParse({
    topic: get('topic'),
    difficulty: get('difficulty'),
    count: get('count'),
    kind: get('kind'),
    presentation: get('presentation') ?? 'auto',
    maxAttempts: get('max-attempts'),
    dryRun: argv.includes('--dry-run'),
    poison: argv.includes('--poison'),
  });
  if (!parsed.success) {
    console.error('Usage: pnpm generate -- --topic M1-ALG1 --difficulty 2 --count 10 --kind structured [--presentation auto|visual|text] [--max-attempts N] [--dry-run]');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

// Loose structural schemas for model output; strict domain validation
// (rubric sums, profiles, module agreement) happens afterwards via Zod.
const MisconceptionLooseZ = z.object({
  trigger: z.string(),
  name: z.string(),
  remediation: z.string(),
});

const McqLooseZ = z.object({
  objective_ids: z.array(z.string()),
  stem: z.string(),
  options: z.array(z.string()),
  answer_key: z.number(),
  profile: z.enum(['CK', 'AK', 'R']),
  visual: QuestionVisualZ.nullable(),
  worked_solution: z.string(),
  misconceptions: z.array(MisconceptionLooseZ),
});

const StructuredLooseZ = z.object({
  objective_ids: z.array(z.string()),
  stem: z.string(),
  marks: z.number(),
  rubric: z.array(
    z.object({
      code: z.string(),
      profile: z.enum(['CK', 'AK', 'R']),
      criterion: z.string(),
      mark_value: z.number(),
    }),
  ),
  final_answer: z.string(),
  visual: QuestionVisualZ.nullable(),
  worked_solution: z.string(),
  misconceptions: z.array(MisconceptionLooseZ),
});

const McqSolveZ = z.object({ answer_index: z.number(), final_answer: z.string() });
const StructuredSolveZ = z.object({ final_answer: z.string() });

function closestIssues(issue: z.ZodIssue): z.ZodIssue[] {
  if (issue.code !== z.ZodIssueCode.invalid_union) return [issue];
  return issue.unionErrors
    .map((error) => error.issues.flatMap(closestIssues))
    .sort((a, b) => a.length - b.length)[0] ?? [issue];
}

function outputDiagnostics(raw: unknown, schema: typeof McqLooseZ | typeof StructuredLooseZ) {
  const parsed = schema.safeParse(raw);
  if (parsed.success) return '';
  const visual = typeof raw === 'object' && raw !== null && 'visual' in raw
    ? (raw as { visual?: unknown }).visual
    : undefined;
  const visualKind = typeof visual === 'object' && visual !== null
    ? `visual=${String((visual as { format?: unknown }).format)}/${String((visual as { visual_type?: unknown }).visual_type)}; `
    : '';
  const issues = parsed.error.issues
    .flatMap(closestIssues)
    .slice(0, 8)
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
    .join('; ');
  return ` — ${visualKind}${issues}`;
}

async function main() {
  const args = parseArgs();
  if (!process.env.AI_API_KEY) throw new Error('AI_API_KEY is not set');

  await dbConnect();
  const topic = await Topic.findOne({ code: args.topic }).lean<{
    module: 1 | 2 | 3;
    code: string;
    title: string;
    objectives: { id: string; text: string; notes?: string }[];
  } | null>();
  if (!topic) throw new Error(`Topic ${args.topic} not found — run pnpm seed:topics first`);
  if (!hasObservedDifficulty({
    targets: bankTargets,
    topicCode: topic.code,
    kind: args.kind,
    difficulty: args.difficulty,
  })) {
    throw new Error(
      `${topic.code} ${args.kind} has no eligible difficulty-${args.difficulty} real-paper fingerprint; choose an observed combination`,
    );
  }
  const topicObjectiveIds = new Set(topic.objectives.map((o) => o.id));

  // Pick the least-covered objective so generation closes objective-level
  // gaps instead of repeatedly asking the model to choose from the whole topic.
  const existingObjectiveRows = await Question.find({
    kind: args.kind,
    difficulty: args.difficulty,
    status: { $ne: 'retired' },
    objective_ids: { $in: [...topicObjectiveIds] },
  }).select('objective_ids').lean<{ objective_ids: string[] }[]>();
  const objectiveCounts = new Map(topic.objectives.map((objective) => [objective.id, 0]));
  for (const row of existingObjectiveRows) {
    for (const id of row.objective_ids) {
      if (objectiveCounts.has(id)) objectiveCounts.set(id, (objectiveCounts.get(id) ?? 0) + 1);
    }
  }
  const existing = await Question.countDocuments({
    kind: args.kind,
    difficulty: args.difficulty,
    status: { $ne: 'retired' },
    objective_ids: { $in: [...topicObjectiveIds] },
  });
  const shortfall = args.count - existing;
  console.log(`${args.topic} ${args.kind} d${args.difficulty}: ${existing} existing, target ${args.count}.`);
  if (shortfall <= 0) {
    console.log('Target already met — nothing to do.');
    process.exit(0);
  }

  let inserted = 0;
  let rejected = 0;
  let attempts = 0;
  const usageTotals = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, reasoningTokens: 0 };
  const addUsage = (usage: {
    inputTokens?: number;
    cachedInputTokens?: number;
    outputTokens?: number;
    reasoningTokens?: number;
  }) => {
    usageTotals.inputTokens += usage.inputTokens ?? 0;
    usageTotals.cachedInputTokens += usage.cachedInputTokens ?? 0;
    usageTotals.outputTokens += usage.outputTokens ?? 0;
    usageTotals.reasoningTokens += usage.reasoningTokens ?? 0;
  };
  const maxAttempts = args.maxAttempts ?? shortfall * 3; // give up rather than loop forever

  while (inserted < shortfall && attempts < maxAttempts) {
    attempts++;
    try {
      const targetObjective = pickCorpusInformedObjective({
        objectives: topic.objectives,
        counts: objectiveCounts,
        targets: bankTargets,
        topicCode: topic.code,
        kind: args.kind,
        difficulty: args.difficulty,
        ordinal: existing + inserted,
        presentation: args.presentation,
      });
      if (!targetObjective) {
        throw new Error(
          `${args.topic} has no objective with an eligible ${args.kind} difficulty-${args.difficulty} ${args.presentation} fingerprint`,
        );
      }
      const recipe = buildCorpusInformedQuestionRecipe({
        targets: bankTargets,
        topicCode: topic.code,
        objectiveIds: [targetObjective.id],
        kind: args.kind,
        difficulty: args.difficulty,
        ordinal: existing + inserted,
        presentation: args.presentation,
      });
      const recipeObjectives = recipe.objective_ids.map((objectiveId) => {
        const objective = topic.objectives.find((candidate) => candidate.id === objectiveId);
        if (!objective) throw new Error(`Recipe objective ${objectiveId} is outside ${topic.code}`);
        return objective;
      });
      const prompt = buildDraftPrompt({
        topicTitle: topic.title,
        objectives: recipeObjectives,
        recipe,
      });

      // 1. Draft
      const { object: raw, usage: draftUsage } = await generateObject({
        model,
        schema: args.kind === 'mcq' ? McqLooseZ : StructuredLooseZ,
        prompt,
        experimental_repairText: async ({ text }) => repairQuestionOutput(text),
      });
      addUsage(draftUsage);

      // 2. Strict Zod validation (rubric sums, profiles, module agreement)
      const candidate = {
        ...raw,
        kind: args.kind,
        module: topic.module,
        difficulty: args.difficulty,
        ...(args.kind === 'mcq' ? { marks: 1 } : {}),
      };
      const validated = QuestionDraftZ.safeParse(candidate);
      if (!validated.success) {
        rejected++;
        console.log(`  ✗ attempt ${attempts}: failed validation — ${validated.error.issues[0]?.message}`);
        continue;
      }
      const draft = validated.data;
      if (!questionMatchesRecipe(draft, recipe)) {
        rejected++;
        console.log(`  ✗ attempt ${attempts}: output did not match the requested question recipe`);
        continue;
      }
      // Some responses double-escape newlines (literal "\n" text); normalize
      // every prose field before the solve pass and insert.
      draft.stem = normalizeEscapedNewlines(draft.stem);
      draft.worked_solution = normalizeEscapedNewlines(draft.worked_solution);
      draft.misconceptions = draft.misconceptions.map((m) => ({
        trigger: m.trigger,
        name: m.name,
        remediation: normalizeEscapedNewlines(m.remediation),
      }));
      if (draft.kind === 'structured') {
        draft.rubric = draft.rubric.map((r) => ({
          ...r,
          criterion: normalizeEscapedNewlines(r.criterion),
        }));
      }
      if (args.poison) {
        // Deterministically corrupt the draft's answer so the independent
        // solve pass must disagree — proves the rejection gate fires (§9.3).
        if (draft.kind === 'mcq') draft.answer_key = (draft.answer_key + 1) % 4;
        else draft.final_answer = `${draft.final_answer} + 999`;
      }
      if (!draft.objective_ids.every((id) => topicObjectiveIds.has(id))) {
        rejected++;
        console.log(`  ✗ attempt ${attempts}: objective_ids outside topic ${args.topic}`);
        continue;
      }
      const presentationIssues = deterministicPresentationIssues(draft.visual);
      if (presentationIssues.length > 0) {
        rejected++;
        console.log(`  ✗ attempt ${attempts}: deterministic presentation gate — ${presentationIssues.join(', ')}`);
        continue;
      }

      // 3. Blind cognitive/presentation review. M1-M2 use the calibrated
      // Luna-first/Terra-escalation route. The M3 pilot found Terra required
      // for higher-module cognitive classification, so M3 goes directly to
      // Terra and a failed control is rejected without a weaker-model appeal.
      const reviewPrompt = buildBlindSingleReviewPrompt({
        question_id: 'candidate',
        kind: draft.kind,
        stem: draft.stem,
        options: draft.kind === 'mcq' ? draft.options : undefined,
        marks: draft.marks,
        visual: draft.visual,
      });
      const reviewRoute = reviewRouteForModule(topic.module);
      const primaryReviewModel = reviewRoute.primary === 'terra' ? escalationModel : reviewModel;
      const primaryReviewModelId = reviewRoute.primary === 'terra'
        ? ESCALATION_MODEL_ID
        : REVIEW_MODEL_ID;
      const { object: primaryReview, usage: primaryReviewUsage } = await generateObject({
        model: primaryReviewModel,
        schema: BlindPilotEvaluationZ,
        prompt: reviewPrompt,
        providerOptions: { openai: { reasoningEffort: 'low' } },
      });
      addUsage(primaryReviewUsage);
      if (primaryReview.question_id !== 'candidate') throw new Error('reviewer returned wrong candidate id');
      const primaryReviewIssues = blindReviewIssues(primaryReview, recipe);
      let comparatorReview: z.infer<typeof BlindPilotEvaluationZ> | null = null;
      let acceptedBy: 'primary' | 'comparator' = 'primary';
      if (primaryReviewIssues.length > 0) {
        if (reviewRoute.comparator === null) {
          rejected++;
          console.log(
            `  ✗ attempt ${attempts}: blind review rejected — ${primaryReviewModelId}=${primaryReviewIssues.join(',')}`,
          );
          continue;
        }
        const { object, usage } = await generateObject({
          model: escalationModel,
          schema: BlindPilotEvaluationZ,
          prompt: reviewPrompt,
          providerOptions: { openai: { reasoningEffort: 'low' } },
        });
        addUsage(usage);
        if (object.question_id !== 'candidate') throw new Error('escalation reviewer returned wrong candidate id');
        comparatorReview = object;
        const comparatorIssues = blindReviewIssues(comparatorReview, recipe);
        if (comparatorIssues.length > 0) {
          rejected++;
          console.log(
            `  ✗ attempt ${attempts}: blind review rejected — ${primaryReviewModelId}=${primaryReviewIssues.join(',')}; ${ESCALATION_MODEL_ID}=${comparatorIssues.join(',')}`,
          );
          continue;
        }
        acceptedBy = 'comparator';
      }
      const reviewRecord = {
        prompt_version: QUESTION_REVIEW_PROMPT_VERSION,
        primary_model: primaryReviewModelId,
        primary: primaryReview,
        comparator_model: comparatorReview ? ESCALATION_MODEL_ID : null,
        comparator: comparatorReview,
        accepted_by: acceptedBy,
      };

      // 4. Independent solve pass — fresh call, stem only
      let solved: boolean;
      let draftAnswer: string;
      let solveAnswer: string;
      if (draft.kind === 'mcq') {
        const { object: sol, usage: solveUsage } = await generateObject({
          model,
          schema: McqSolveZ,
          prompt: buildSolvePrompt({
            stem: draft.stem,
            kind: 'mcq',
            options: draft.options,
            visual: draft.visual,
          }),
        });
        addUsage(solveUsage);
        solved = sol.answer_index === draft.answer_key;
        draftAnswer = `key=${draft.answer_key} (${draft.options[draft.answer_key]})`;
        solveAnswer = `index=${sol.answer_index} (${draft.options[sol.answer_index] ?? '?'}) — "${sol.final_answer}"`;
      } else {
        const { object: sol, usage: solveUsage } = await generateObject({
          model,
          schema: StructuredSolveZ,
          prompt: buildSolvePrompt({ stem: draft.stem, kind: 'structured', visual: draft.visual }),
        });
        addUsage(solveUsage);
        solved = answersEquivalent(sol.final_answer, draft.final_answer);
        draftAnswer = draft.final_answer;
        solveAnswer = sol.final_answer;
      }
      if (!solved) {
        rejected++;
        // Always log the full pair verbatim so rejection quality stays
        // inspectable at a glance.
        console.log(`  ✗ attempt ${attempts}: independent solve DISAGREED — auto-rejected`);
        console.log(`      draft answer: ${JSON.stringify(draftAnswer)}`);
        console.log(`      solve answer: ${JSON.stringify(solveAnswer)}`);
        continue;
      }

      if (args.dryRun) {
        inserted++;
        for (const objectiveId of recipe.objective_ids) {
          objectiveCounts.set(objectiveId, (objectiveCounts.get(objectiveId) ?? 0) + 1);
        }
        console.log(`  ✓ attempt ${attempts}: verified (dry-run, not inserted): ${draft.stem.slice(0, 70)}…`);
        continue;
      }

      await Question.create({
        ...draft,
        status: 'draft',
        gen_meta: {
          model: MODEL_ID,
          prompt_version: PROMPT_VERSION,
          verified: true,
          ts: new Date(),
          recipe,
          review: reviewRecord,
        },
      });
      inserted++;
      for (const objectiveId of recipe.objective_ids) {
        objectiveCounts.set(objectiveId, (objectiveCounts.get(objectiveId) ?? 0) + 1);
      }
      console.log(`  ✓ attempt ${attempts}: inserted draft (${inserted}/${shortfall}): ${draft.stem.slice(0, 70)}…`);
    } catch (err) {
      rejected++;
      if (NoObjectGeneratedError.isInstance(err)) {
        if (err.usage) addUsage(err.usage);
        let diagnostics = '';
        if (err.text) {
          try {
            const raw: unknown = JSON.parse(err.text);
            diagnostics = outputDiagnostics(
              raw,
              args.kind === 'mcq' ? McqLooseZ : StructuredLooseZ,
            );
          } catch {
            diagnostics = ' — response was not valid JSON';
          }
        }
        console.log(
          `  ✗ attempt ${attempts}: model output failed schema validation (finish=${err.finishReason ?? 'unknown'})${diagnostics}`,
        );
      } else {
        console.log(`  ✗ attempt ${attempts}: error — ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  console.log(
    `Done. ${inserted} ${args.dryRun ? 'verified (dry-run)' : 'inserted'}, ${rejected} rejected across ${attempts} attempts.`,
  );
  console.log(
    `Token usage: input=${usageTotals.inputTokens}, cached=${usageTotals.cachedInputTokens}, output=${usageTotals.outputTokens}, reasoning=${usageTotals.reasoningTokens}.`,
  );
  process.exit(inserted >= shortfall ? 0 : 2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
