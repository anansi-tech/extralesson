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
import { deriveFinalAnswer, McqQuestionZ, StructuredQuestionZ } from '@/lib/validation/question';
import { normalizeEscapedNewlines } from '@/lib/text';
import { buildDraftPrompt, PROMPT_VERSION } from '@/lib/prompts/question-gen';
import { getCoverage } from '@/lib/admin/coverage';
import { nextRecipe, type ObjectiveCoverage, type QuestionRecipe, type RecipeContext } from '@/lib/generation/recipe';
import { independentSolve } from '@/lib/generation/solve';
import { McqLooseZ, StructuredLooseZ } from '@/lib/generation/draft-schema';
import { checkDuplicate } from '@/lib/generation/dedup';
import { reviewFlags, type FlaggableQuestion } from '@/lib/admin/review-flags';
import { CONTEXT_FREE_MCQ_SHARE } from '@/lib/generation/contexts';
import { neediestContext } from '@/lib/generation/context-targets';
import { verifyQuestionVisual } from '@/lib/visuals/verify';
import { lintCriteria } from '@/lib/prompts/mark-scheme';
import { paramsDocFor } from '@/lib/visuals';
import type { ModuleNumber } from '@/lib/types';

const ArgsZ = z.object({
  count: z.coerce.number().int().min(1).max(50),
  topic: z.string().regex(/^M[123]-[A-Z0-9]+$/).optional(),
  kind: z.enum(['mcq', 'structured']).optional(),
  difficulty: z.coerce.number().pipe(z.union([z.literal(1), z.literal(2), z.literal(3)])).optional(),
  module: z.coerce.number().pipe(z.union([z.literal(1), z.literal(2), z.literal(3)])).optional(),
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
    module: get('module'),
    dryRun: argv.includes('--dry-run'),
    poison: argv.includes('--poison'),
  });
  if (!parsed.success) {
    console.error('Usage: pnpm generate -- --count 10 [--topic M1-ALG1] [--module 1] [--kind structured] [--difficulty 2] [--dry-run]');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}


async function buildRecipe(
  args: ReturnType<typeof parseArgs>,
  exhausted: ReadonlySet<string> = new Set(),
): Promise<{
  recipe: QuestionRecipe;
  context: RecipeContext;
  module: ModuleNumber;
  topicTitle: string;
  objectives: { id: string; text: string; notes?: string }[];
}> {
  const { matrix, objectiveApproved, objectiveCovered } = await getCoverage();
  const topics = await Topic.find().lean<
    {
      code: string;
      title: string;
      module: ModuleNumber;
      order: number;
      objectives: { id: string; text: string; notes?: string; assessable?: boolean }[];
    }[]
  >();

  // R1.6 §3: an objective we told students we cannot assess must not be
  // generated against either. Construction and measurement objectives ask for
  // ruler-and-protractor work on paper, and a question written to them can only
  // fake it — by asking the student to measure a figure that is not to scale.
  const objectivesByTopic = new Map<string, ObjectiveCoverage[]>(
    topics.map((t) => [
      t.code,
      t.objectives
        .filter((o) => o.assessable !== false)
        .map((o) => ({
          id: o.id,
          approved: objectiveApproved.get(o.id) ?? 0,
          // Drafts count for STEERING: a run that ignored its own output kept
          // returning the same least-covered objective and wrote fifty
          // questions about it.
          covered: objectiveCovered.get(o.id) ?? 0,
        })),
    ]),
  );

  // A topic set aside for this run keeps its deficit but stops being chosen.
  const searchMatrix = exhausted.size
    ? { ...matrix, topics: matrix.topics.filter((t) => !exhausted.has(t.code)) }
    : matrix;

  // Overrides are inputs to the deficit search, never patches applied to its
  // output — every field of the returned recipe is internally consistent.
  const { recipe, context } = nextRecipe(searchMatrix, objectivesByTopic, {
    topic_code: args.topic,
    kind: args.kind,
    difficulty: args.difficulty,
    module: args.module,
  });
  // A paper-shaped recipe draws objectives from two or three topics of one
  // module, so the prompt's topic line and objective block are assembled from
  // every topic the recipe names, primary first.
  const topicDocs = context.topic_codes
    .map((code) => topics.find((t) => t.code === code))
    .filter((t): t is (typeof topics)[number] => Boolean(t));
  const primary = topicDocs[0];
  const wanted = new Set(recipe.objective_ids);
  return {
    recipe,
    context,
    module: primary.module,
    topicTitle: topicDocs.map((t) => t.title).join(' + '),
    objectives: topicDocs.flatMap((t) => t.objectives.filter((o) => wanted.has(o.id))),
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

  // Acceptance per topic, and why drafts were lost. Reported at the end.
  const byTopic = new Map<string, { attempts: number; inserted: number }>();
  // Topics that keep returning duplicates are skipped for the rest of the run.
  const DEDUP_STREAK_LIMIT = 3;
  const dedupStreak = new Map<string, number>();
  /** What this run wrote, so it can audit its own output before it exits. */
  const insertedIds: unknown[] = [];
  const exhausted = new Set<string>();
  const byReason = new Map<string, number>();
  const tally = (code: string) => {
    const row = byTopic.get(code) ?? { attempts: 0, inserted: 0 };
    byTopic.set(code, row);
    return row;
  };
  const lost = (topic: string, reason: string) => {
    byReason.set(reason, (byReason.get(reason) ?? 0) + 1);
    void topic;
  };

  while (inserted < args.count && attempts < maxAttempts) {
    attempts++;
    try {
      const { recipe, context, module, topicTitle, objectives } = await buildRecipe(args, exhausted);
      tally(context.topic_code).attempts++;
      const visualContract =
        recipe.representation === 'prose' ? '' : paramsDocFor(context.template_hints);
      // What this topic already holds, so the model writes something else. Read
      // fresh each attempt: a draft inserted a moment ago counts.
      //
      // STIMULUS AND STEM, because the stem is a lead-in. Ten questions on one
      // objective show ten stems reading "Use the graph to answer the parts
      // below", so a model told to write something else could not see that the
      // last four had all used x^2-4x+3 — the function lives in the stimulus,
      // and four near-identical questions reached the queue. The dedup gate
      // below already joins the two for exactly this reason.
      const recent = await Question.find({
        status: { $in: ['draft', 'approved'] },
        objective_ids: { $in: recipe.objective_ids },
      })
        .select('stem stimulus context_category')
        .sort({ _id: -1 })
        .limit(10)
        .lean<{ stem: string; stimulus?: string; context_category?: string }[]>();
      const existingStems = recent.map((q) => [q.stimulus, q.stem].filter(Boolean).join(' '));

      // WHICH SETTING THIS TOPIC IS SHORT OF (R4 calibration). Counted over the
      // topic's whole bank, not the last ten, because a share converges against
      // the total or it does not converge at all. The target is per topic and
      // measured from the papers; see lib/generation/context-targets.ts.
      const settingCounts = await Question.aggregate<{ _id: string; n: number }>([
        { $match: { topic_code: context.topic_code, status: { $in: ['draft', 'approved'] },
                    context_category: { $nin: [null, 'none'] } } },
        { $group: { _id: '$context_category', n: { $sum: 1 } } },
      ]);
      const neediest = neediestContext(
        context.topic_code,
        Object.fromEntries(settingCounts.map((r) => [r._id, r.n])),
      );

      // R1.8 Part 0: the papers write most Paper 1 items as bare symbolic work.
      // Aim for half, measured against what this paper already holds rather
      // than by coin flip, so the share converges instead of drifting.
      let contextFree = false;
      if (recipe.kind === 'mcq') {
        const [bare, all] = await Promise.all([
          Question.countDocuments({ kind: 'mcq', status: { $in: ['draft', 'approved'] }, context_category: 'none' }),
          Question.countDocuments({ kind: 'mcq', status: { $in: ['draft', 'approved'] } }),
        ]);
        contextFree = all === 0 || bare / all < CONTEXT_FREE_MCQ_SHARE;
      }
      console.log(
        `→ attempt ${attempts}: recipe ${recipe.kind} ${context.topic_code} d${recipe.difficulty} ${recipe.marks}mk ${recipe.archetype}/${recipe.representation}` +
          `${recipe.profile ? ` ${recipe.profile}` : ''}` +
          `${recipe.rubric_split ? ` CK${recipe.rubric_split.CK}/AK${recipe.rubric_split.AK}/R${recipe.rubric_split.R}` : ''}` +
          ` [${recipe.objective_ids.join(', ')}]`,
      );

      // Draft
      const { object: raw } = await generateObject({
        model,
        schema: recipe.kind === 'mcq' ? McqLooseZ : StructuredLooseZ,
        prompt: buildDraftPrompt({
          topicTitle,
          objectives,
          recipe,
          context,
          module,
          visualContract,
          existingStems,
          recentContexts: recent,
          contextFree,
          wantContext: contextFree ? null : neediest,
        }),
      });

      // Normalize prose fields, assemble candidate
      const clean = normalizeEscapedNewlines;
      const parts = raw.parts.map((p) => ({
        label: p.label,
        prompt: clean(p.prompt),
        marks: p.marks,
        ...(p.statement ? { statement: clean(p.statement) } : {}),
        slots: (p.slots?.length
          ? p.slots
          : [{ label: 'i', answer: p.answer ?? '', accept: p.accept, response_mode: p.response_mode, answer_format: p.answer_format }]
        ).map((slot) => ({
          ...slot,
          prompt: slot.prompt ? clean(slot.prompt) : undefined,
          answer: clean(slot.answer ?? ''),
          accept: slot.accept?.length ? slot.accept.map(clean) : undefined,
          response_mode: slot.response_mode ?? 'answer',
          answer_format: slot.answer_format ?? undefined,
        })),
      }));
      const candidate = {
        ...raw,
        kind: recipe.kind,
        module,
        objective_ids: recipe.objective_ids,
        archetype: recipe.archetype,
        shape: recipe.shape,
        // §B5: the recipe owns the cognitive level for Paper 1, not the model.
        ...(recipe.profile ? { profile: recipe.profile } : {}),
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

      // Gate 1: Zod. Validate against the branch the recipe asked for, not the
      // union: a failed union reports one root issue reading "Invalid input"
      // and buries every branch's real complaint, which cost one run 48
      // attempts against an unreadable message.
      const validated = (recipe.kind === 'mcq' ? McqQuestionZ : StructuredQuestionZ).safeParse(
        candidate,
      );
      if (!validated.success) {
        rejected++;
        lost(context.topic_code, 'schema');
        // Every issue, with its path: a top-level refine reports an empty path
        // and "Invalid input", which is unactionable on its own — one run lost
        // 48 attempts to a single unreadable cause.
        // Say what arrived, not only that it was wrong: "answer_format: Invalid"
        // does not tell you which value the model chose.
        const at = (path: PropertyKey[]) =>
          path.reduce<unknown>((v, k) => (v == null ? v : (v as Record<PropertyKey, unknown>)[k]), candidate);
        console.log(
          `  ✗ Zod: ${validated.error.issues
            .map((i) => {
              const where = i.path.length ? i.path.join('.') : '<root>';
              const got = i.path.length ? JSON.stringify(at(i.path))?.slice(0, 60) : undefined;
              return `${where}: ${i.message}${got === undefined ? '' : ` (got ${got})`}`;
            })
            .join(' | ')}`,
        );
        continue;
      }
      const draft = validated.data;

      // A dropped answer_format is not a rejection, but it is drift worth seeing.
      const droppedFormats = (candidate.parts ?? [])
        .flatMap((p, i) =>
          (p.slots ?? []).map((slot, j) => ({
            raw: slot.answer_format,
            kept: draft.parts[i]?.slots[j]?.answer_format,
            label: `${p.label}.${slot.label}`,
          })),
        )
        .filter((f) => f.raw && !f.kept);
      if (droppedFormats.length > 0) {
        console.log(
          `  · format note: unsupported answer_format dropped — ${droppedFormats
            .map((f) => `(${f.label}) ${JSON.stringify(f.raw)}`)
            .join(', ')}`,
        );
      }

      // Gate 2: visual verify (auto-reject before the solve pass, §3)
      if (draft.visual) {
        const vres = verifyQuestionVisual(draft.visual as never, {
          stimulus: draft.stimulus,
          stem: draft.stem,
          partPrompts: draft.parts.flatMap((p) => [p.prompt, ...p.slots.map((s) => s.prompt ?? '')]),
          slotRefs: draft.parts.flatMap((p) => p.slots.map((s) => `${p.label}.${s.label}`)),
        });
        if (!vres.ok) {
          rejected++;
          lost(context.topic_code, 'visual-verify');
          console.log(`  ✗ visual verify: ${vres.issues.join(' | ')}`);
          continue;
        }
        if (vres.advisories.length > 0) {
          console.log(`  · visual note: ${vres.advisories.join(' | ')}`);
        }
      }

      // R1.7 §B3: rubric wording is advisory, never a gate — a criterion can be
      // clumsy and still mark the right thing, and that call is the reviewer's.
      const criterionIssues = draft.kind === 'structured' ? lintCriteria(draft.rubric) : [];
      if (criterionIssues.length > 0) {
        console.log(
          `  · rubric note: ${criterionIssues.map((i) => `(${i.part_label}/${i.code}) ${i.issue}`).join(' | ')}`,
        );
      }

      if (args.poison) {
        // Deterministic corruption so the solve pass provably disagrees.
        if (draft.kind === 'mcq') draft.answer_key = (draft.answer_key + 1) % 4;
        else {
          const lastPart = draft.parts[draft.parts.length - 1];
          lastPart.slots[lastPart.slots.length - 1].answer += ' + 999';
          draft.final_answer = deriveFinalAnswer(draft.parts);
        }
      }

      // Gate 3: independent solve
      const solve = await independentSolve(draft);
      // Pair logging is permanent: every rejection prints both answers, and
      // every contested part prints how it was settled.
      if (!solve.agrees) {
        rejected++;
        lost(context.topic_code, 'solve-disagreed');
        console.log('  ✗ independent solve DISAGREED — auto-rejected');
        console.log(`      draft answer: ${JSON.stringify(solve.draftAnswer)}`);
        console.log(`      solve answer: ${JSON.stringify(solve.solveAnswer)}`);
        for (const n of solve.notes) console.log(`      ${n}`);
        continue;
      }
      for (const n of solve.notes) console.log(`  · ${n}`);


      // Gate 4: internal dedup vs approved bank
      // Compare on what identifies the question. When a stimulus carries the
      // scenario, the stem is a lead-in and says nothing about what is asked.
      const approvedStems = (
        await Question.find({ status: 'approved' })
          .select('stem stimulus')
          .lean<{ stem: string; stimulus?: string }[]>()
      ).map((q) => [q.stimulus, q.stem].filter(Boolean).join(' '));
      const dedup = await checkDuplicate(
        [draft.stimulus, draft.stem].filter(Boolean).join(' '),
        approvedStems,
      );
      if (dedup.duplicate) {
        rejected++;
        lost(context.topic_code, `dedup-${dedup.reason}`);
        console.log(`  ✗ dedup: ${dedup.reason} (score ${dedup.score})`);
        // The deficit search is deterministic, so a recipe that cannot clear
        // dedup returns for every remaining attempt: one run spent 25 of 60 on
        // a single M1-CONS recipe. Set the topic aside and fill elsewhere.
        const streak = (dedupStreak.get(context.topic_code) ?? 0) + 1;
        dedupStreak.set(context.topic_code, streak);
        if (streak >= DEDUP_STREAK_LIMIT && !args.topic) {
          exhausted.add(context.topic_code);
          console.log(
            `  · ${context.topic_code} set aside for this run — ${streak} duplicates in a row; it needs a new angle, not another attempt`,
          );
        }
        continue;
      }
      dedupStreak.set(context.topic_code, 0);

      if (args.dryRun) {
        inserted++;
        tally(context.topic_code).inserted++;
        console.log(`  ✓ verified (dry-run, not inserted): ${draft.stem.slice(0, 70)}…`);
        continue;
      }

      const created = await Question.create({
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
      insertedIds.push(created._id);
      inserted++;
      tally(context.topic_code).inserted++;
      console.log(`  ✓ inserted draft (${inserted}/${args.count}): ${draft.stem.slice(0, 70)}…`);
    } catch (err) {
      rejected++;
      lost('?', 'error');
      console.log(`  ✗ error — ${err instanceof Error ? err.message : err}`);
    }
  }

  // Per-topic acceptance: a topic well below the rest is a prompt/exemplar
  // problem, not luck, and the run is the only place that shows it.
  const rows = [...byTopic.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1);
  if (rows.length > 0) {
    console.log('\nAcceptance by topic:');
    for (const [code, t] of rows) {
      const rate = t.attempts === 0 ? 0 : Math.round((t.inserted / t.attempts) * 100);
      const flag = rate < 50 ? '  ← below 50%' : '';
      console.log(`  ${code.padEnd(10)} ${String(t.inserted).padStart(3)}/${String(t.attempts).padStart(3)} attempts  ${String(rate).padStart(3)}%${flag}`);
    }
    const reasons = [...byReason.entries()].sort((a, b) => b[1] - a[1]);
    if (reasons.length > 0) {
      console.log(`Rejections: ${reasons.map(([r, n]) => `${r} ${n}`).join(' · ')}`);
    }
  }

  // Audit what this run actually wrote. The standing sweep only ever saw the
  // bank as it stood when it ran, so a defect written after it was invisible
  // until someone thought to run it again — which is how a cross-module
  // question sat in the queue while the audit reported zero flags. A batch now
  // reports on itself, using the same checks the review card shows.
  if (insertedIds.length > 0) {
    const written = await Question.find({ _id: { $in: insertedIds } }).lean<
      (FlaggableQuestion & { _id: unknown; objective_ids: string[] })[]
    >();
    const flagged = written
      .map((q) => ({ q, flags: reviewFlags(q).filter((f) => f.level === 'warn') }))
      .filter((h) => h.flags.length > 0);
    if (flagged.length > 0) {
      console.log(`\nFLAGGED FOR REVIEW — ${flagged.length} of ${written.length} written this run:`);
      for (const { q, flags } of flagged) {
        console.log(`  ${String(q._id)}  ${q.objective_ids.join(',')}`);
        for (const f of flags) console.log(`    · ${f.text}`);
      }
    } else {
      console.log(`\nNo review flags on the ${written.length} written this run.`);
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
