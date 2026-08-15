// Recipe-driven question generation (R1.5 §5).
// Default: `pnpm generate -- --count 10` — each question's recipe comes from
// the largest target-matrix deficit. `--topic M1-ALG1` (and `--kind`,
// `--difficulty`) narrow the deficit search as overrides.
//
// Post-gen gate order (§5): Zod → visual verify → independent solve →
// internal dedup vs approved bank. Every rejection logs the full evidence.
//
// `--poison` (verification hook, §8.2): corrupts the validated draft's
// answers so the independent solve pass must disagree. Never for bank fill.
import 'dotenv/config';
import { z } from 'zod';
import { generateObject } from 'ai';
import { model, MODEL_ID } from '@/lib/ai';
import { dbConnect, Question, Topic } from '@/lib/db';
import { deriveFinalAnswer, QuestionDraftZ } from '@/lib/validation/question';
import { normalizeEscapedNewlines } from '@/lib/text';
import { buildDraftPrompt, PROMPT_VERSION } from '@/lib/prompts/question-gen';
import { getCoverage } from '@/lib/admin/coverage';
import { nextRecipe, type ObjectiveCoverage, type QuestionRecipe, type RecipeContext } from '@/lib/generation/recipe';
import { independentSolve } from '@/lib/generation/solve';
import { checkDuplicate } from '@/lib/generation/dedup';
import { verifyQuestionVisual } from '@/lib/visuals/verify';
import { paramsDocFor } from '@/lib/visuals';
import type { ModuleNumber } from '@/lib/types';

const ArgsZ = z.object({
  count: z.coerce.number().int().min(1).max(50),
  topic: z.string().regex(/^M[123]-[A-Z0-9]+$/).optional(),
  kind: z.enum(['mcq', 'structured']).optional(),
  difficulty: z.coerce.number().pipe(z.union([z.literal(1), z.literal(2), z.literal(3)])).optional(),
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
    count: get('count') ?? '10',
    topic: get('topic'),
    kind: get('kind'),
    difficulty: get('difficulty'),
    dryRun: argv.includes('--dry-run'),
    poison: argv.includes('--poison'),
  });
  if (!parsed.success) {
    console.error('Usage: pnpm generate -- --count 10 [--topic M1-ALG1] [--kind structured] [--difficulty 2] [--dry-run]');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

// Loose structural schemas for model output; the strict Zod boundary runs
// afterwards (gate 1) so failures are logged, not thrown.
const MisconceptionLooseZ = z.object({ trigger: z.string(), name: z.string(), remediation: z.string() });
const PartLooseZ = z.object({ label: z.string(), prompt: z.string(), marks: z.number(), answer: z.string(), accept: z.array(z.string()).nullish() });
const VisualLooseZ = z.object({ template: z.string(), params: z.record(z.unknown()) }).nullable();

const McqLooseZ = z.object({
  stimulus: z.string().nullable(),
  stem: z.string(),
  options: z.array(z.string()),
  answer_key: z.number(),
  profile: z.enum(['CK', 'AK', 'R']),
  visual: VisualLooseZ,
  parts: z.array(PartLooseZ),
  worked_solution: z.string(),
  misconceptions: z.array(MisconceptionLooseZ),
});

const StructuredLooseZ = z.object({
  stimulus: z.string().nullable(),
  stem: z.string(),
  visual: VisualLooseZ,
  parts: z.array(PartLooseZ),
  rubric: z.array(
    z.object({
      code: z.string(),
      profile: z.enum(['CK', 'AK', 'R']),
      criterion: z.string(),
      mark_value: z.number(),
      part_label: z.string(),
    }),
  ),
  worked_solution: z.string(),
  misconceptions: z.array(MisconceptionLooseZ),
});

async function buildRecipe(args: ReturnType<typeof parseArgs>): Promise<{
  recipe: QuestionRecipe;
  context: RecipeContext;
  module: ModuleNumber;
  topicTitle: string;
  objectives: { id: string; text: string; notes?: string }[];
}> {
  const { matrix, objectiveApproved } = await getCoverage();
  const topics = await Topic.find().lean<
    { code: string; title: string; module: ModuleNumber; order: number; objectives: { id: string; text: string; notes?: string }[] }[]
  >();

  const objectivesByTopic = new Map<string, ObjectiveCoverage[]>(
    topics.map((t) => [
      t.code,
      t.objectives.map((o) => ({ id: o.id, approved: objectiveApproved.get(o.id) ?? 0 })),
    ]),
  );

  // Overrides are inputs to the deficit search, never patches applied to its
  // output — every field of the returned recipe is internally consistent.
  const { recipe, context } = nextRecipe(matrix, objectivesByTopic, {
    topic_code: args.topic,
    kind: args.kind,
    difficulty: args.difficulty,
  });
  const topicDoc = topics.find((t) => t.code === context.topic_code)!;
  const wanted = new Set(recipe.objective_ids);
  return {
    recipe,
    context,
    module: topicDoc.module,
    topicTitle: topicDoc.title,
    objectives: topicDoc.objectives.filter((o) => wanted.has(o.id)),
  };
}

async function main() {
  const args = parseArgs();
  if (!process.env.AI_API_KEY) throw new Error('AI_API_KEY is not set');
  await dbConnect();

  let inserted = 0;
  let rejected = 0;
  let attempts = 0;
  const maxAttempts = args.count * 3;

  while (inserted < args.count && attempts < maxAttempts) {
    attempts++;
    try {
      const { recipe, context, module, topicTitle, objectives } = await buildRecipe(args);
      const visualContract =
        recipe.representation === 'prose' ? '' : paramsDocFor(context.template_hints);
      console.log(
        `→ attempt ${attempts}: recipe ${recipe.kind} ${context.topic_code} d${recipe.difficulty} ${recipe.marks}mk ${recipe.archetype}/${recipe.representation} [${recipe.objective_ids.join(', ')}]`,
      );

      // Draft
      const { object: raw } = await generateObject({
        model,
        schema: recipe.kind === 'mcq' ? McqLooseZ : StructuredLooseZ,
        prompt: buildDraftPrompt({ topicTitle, objectives, recipe, context, module, visualContract }),
      });

      // Normalize prose fields, assemble candidate
      const clean = normalizeEscapedNewlines;
      const parts = raw.parts.map((p) => ({
        ...p,
        prompt: clean(p.prompt),
        answer: clean(p.answer),
        accept: p.accept?.length ? p.accept.map(clean) : undefined,
      }));
      const candidate = {
        ...raw,
        kind: recipe.kind,
        module,
        objective_ids: recipe.objective_ids,
        archetype: recipe.archetype,
        representation: recipe.representation,
        difficulty: recipe.difficulty,
        marks: recipe.marks,
        stimulus: raw.stimulus ? clean(raw.stimulus) : undefined,
        stem: clean(raw.stem),
        visual: raw.visual ?? undefined,
        parts,
        worked_solution: clean(raw.worked_solution),
        misconceptions: raw.misconceptions.map((m) => ({ ...m, remediation: clean(m.remediation) })),
        ...(recipe.kind === 'structured' ? { final_answer: deriveFinalAnswer(parts) } : {}),
      };

      // Gate 1: Zod
      const validated = QuestionDraftZ.safeParse(candidate);
      if (!validated.success) {
        rejected++;
        const issue = validated.error.issues[0];
        console.log(`  ✗ Zod: ${issue?.path.join('.')}: ${issue?.message}`);
        continue;
      }
      const draft = validated.data;

      // Gate 2: visual verify (auto-reject before the solve pass, §3)
      if (draft.visual) {
        const vres = verifyQuestionVisual(draft.visual as never, {
          stimulus: draft.stimulus,
          stem: draft.stem,
          partPrompts: draft.parts.map((p) => p.prompt),
        });
        if (!vres.ok) {
          rejected++;
          console.log(`  ✗ visual verify: ${vres.issues.join(' | ')}`);
          continue;
        }
        if (vres.advisories.length > 0) {
          console.log(`  · visual note: ${vres.advisories.join(' | ')}`);
        }
      }

      if (args.poison) {
        // Deterministic corruption so the solve pass provably disagrees.
        if (draft.kind === 'mcq') draft.answer_key = (draft.answer_key + 1) % 4;
        else {
          draft.parts[draft.parts.length - 1].answer += ' + 999';
          draft.final_answer = deriveFinalAnswer(draft.parts);
        }
      }

      // Gate 3: independent solve
      const solve = await independentSolve(draft);
      // Pair logging is permanent: every rejection prints both answers, and
      // every contested part prints how it was settled.
      if (!solve.agrees) {
        rejected++;
        console.log('  ✗ independent solve DISAGREED — auto-rejected');
        console.log(`      draft answer: ${JSON.stringify(solve.draftAnswer)}`);
        console.log(`      solve answer: ${JSON.stringify(solve.solveAnswer)}`);
        for (const n of solve.notes) console.log(`      ${n}`);
        continue;
      }
      for (const n of solve.notes) console.log(`  · ${n}`);

      // Gate 4: internal dedup vs approved bank
      const approvedStems = (
        await Question.find({ status: 'approved' }).select('stem').lean<{ stem: string }[]>()
      ).map((q) => q.stem);
      const dedup = await checkDuplicate(draft.stem, approvedStems);
      if (dedup.duplicate) {
        rejected++;
        console.log(`  ✗ dedup: ${dedup.reason} (score ${dedup.score})`);
        continue;
      }

      if (args.dryRun) {
        inserted++;
        console.log(`  ✓ verified (dry-run, not inserted): ${draft.stem.slice(0, 70)}…`);
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
          dedup_score: dedup.score,
        },
      });
      inserted++;
      console.log(`  ✓ inserted draft (${inserted}/${args.count}): ${draft.stem.slice(0, 70)}…`);
    } catch (err) {
      rejected++;
      console.log(`  ✗ error — ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(
    `Done. ${inserted} ${args.dryRun ? 'verified (dry-run)' : 'inserted'}, ${rejected} rejected across ${attempts} attempts.`,
  );
  process.exit(inserted >= args.count ? 0 : 2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
