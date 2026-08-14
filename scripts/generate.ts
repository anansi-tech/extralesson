// Question generation pipeline (ROUND_1 §4).
// Usage: pnpm generate -- --topic M1-ALG1 --difficulty 2 --count 10 --kind structured [--dry-run]
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
import { generateObject } from 'ai';
import { model, MODEL_ID } from '@/lib/ai';
import { dbConnect, Question, Topic } from '@/lib/db';
import { QuestionDraftZ } from '@/lib/validation/question';
import { answersEquivalent } from '@/lib/grade/equivalence';
import { buildDraftPrompt, buildSolvePrompt, PROMPT_VERSION } from '@/lib/prompts/question-gen';

const ArgsZ = z.object({
  topic: z.string().regex(/^M[123]-[A-Z0-9]+$/),
  difficulty: z.coerce.number().pipe(z.union([z.literal(1), z.literal(2), z.literal(3)])),
  count: z.coerce.number().int().min(1).max(50),
  kind: z.enum(['mcq', 'structured']),
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
    dryRun: argv.includes('--dry-run'),
    poison: argv.includes('--poison'),
  });
  if (!parsed.success) {
    console.error('Usage: pnpm generate -- --topic M1-ALG1 --difficulty 2 --count 10 --kind structured [--dry-run]');
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
  worked_solution: z.string(),
  misconceptions: z.array(MisconceptionLooseZ),
});

const McqSolveZ = z.object({ answer_index: z.number(), final_answer: z.string() });
const StructuredSolveZ = z.object({ final_answer: z.string() });

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
  const topicObjectiveIds = new Set(topic.objectives.map((o) => o.id));

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
  const maxAttempts = shortfall * 3; // give up rather than loop forever

  while (inserted < shortfall && attempts < maxAttempts) {
    attempts++;
    try {
      const prompt = buildDraftPrompt({
        topicTitle: topic.title,
        objectives: topic.objectives,
        kind: args.kind,
        difficulty: args.difficulty,
      });

      // 1. Draft
      const { object: raw } = await generateObject({
        model,
        schema: args.kind === 'mcq' ? McqLooseZ : StructuredLooseZ,
        prompt,
      });

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

      // 3. Independent solve pass — fresh call, stem only
      let solved: boolean;
      if (draft.kind === 'mcq') {
        const { object: sol } = await generateObject({
          model,
          schema: McqSolveZ,
          prompt: buildSolvePrompt({ stem: draft.stem, kind: 'mcq', options: draft.options }),
        });
        solved = sol.answer_index === draft.answer_key;
      } else {
        const { object: sol } = await generateObject({
          model,
          schema: StructuredSolveZ,
          prompt: buildSolvePrompt({ stem: draft.stem, kind: 'structured' }),
        });
        solved = answersEquivalent(sol.final_answer, draft.final_answer);
      }
      if (!solved) {
        rejected++;
        console.log(`  ✗ attempt ${attempts}: independent solve DISAGREED — auto-rejected`);
        continue;
      }

      if (args.dryRun) {
        inserted++;
        console.log(`  ✓ attempt ${attempts}: verified (dry-run, not inserted): ${draft.stem.slice(0, 70)}…`);
        continue;
      }

      await Question.create({
        ...draft,
        status: 'draft',
        gen_meta: { model: MODEL_ID, prompt_version: PROMPT_VERSION, verified: true, ts: new Date() },
      });
      inserted++;
      console.log(`  ✓ attempt ${attempts}: inserted draft (${inserted}/${shortfall}): ${draft.stem.slice(0, 70)}…`);
    } catch (err) {
      rejected++;
      console.log(`  ✗ attempt ${attempts}: error — ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(
    `Done. ${inserted} ${args.dryRun ? 'verified (dry-run)' : 'inserted'}, ${rejected} rejected across ${attempts} attempts.`,
  );
  process.exit(inserted >= shortfall ? 0 : 2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
