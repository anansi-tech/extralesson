// Re-run the visual gate over the pending queue.
//
// Both homes a figure or table can have: the `visual` slot, and the
// `stimulus_table` beside it. A sweep that knew only about the first would let
// a bad stimulus table sit in the queue unseen, which is the same shape of gap
// as a template hinted by no topic.
//
// The gate gains rules as live generation finds new ways to be wrong, and
// drafts written before a rule existed sit in the queue waiting for a reviewer
// to notice by eye. This applies today's rules to yesterday's drafts.
//
// Previews by default; --yes retires what fails. Approved questions are never
// touched: they passed the gate that existed when they were approved, and a
// reviewer has since read them.
//
// Run: pnpm tsx scripts/recheck-visuals.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { verifyQuestionVisual, verifyStimulusTable } from '@/lib/visuals/verify';
import type { StoredVisual } from '@/lib/visuals';

interface LeanDraft {
  _id: unknown;
  stem: string;
  stimulus?: string;
  parts?: { label: string; prompt: string; slots?: { label: string; prompt?: string }[] }[];
  visual?: StoredVisual;
  stimulus_table?: Record<string, unknown>;
  objective_ids: string[];
}

async function main() {
  const apply = process.argv.includes('--yes');
  await dbConnect();

  const drafts = await Question.find({
    status: 'draft',
    $or: [{ 'visual.template': { $exists: true } }, { stimulus_table: { $exists: true } }],
  })
    .select('stem stimulus parts visual stimulus_table objective_ids')
    .lean<LeanDraft[]>();

  const failed: { id: string; issues: string[] }[] = [];
  for (const q of drafts) {
    const context = {
      stimulus: q.stimulus,
      stem: q.stem,
      partPrompts: (q.parts ?? []).flatMap((p) => [p.prompt, ...(p.slots ?? []).map((s) => s.prompt ?? '')]),
      slotRefs: (q.parts ?? []).flatMap((p) => (p.slots ?? []).map((s) => `${p.label}.${s.label}`)),
    };
    const issues = [
      ...(q.visual ? verifyQuestionVisual(q.visual, context).issues : []),
      ...(q.stimulus_table
        ? verifyStimulusTable(q.stimulus_table, context).issues.map((i) => `stimulus table: ${i}`)
        : []),
    ];
    if (issues.length === 0) continue;
    failed.push({ id: String(q._id), issues });
    const carries = [q.visual?.template, q.stimulus_table ? 'stimulus_table' : undefined]
      .filter(Boolean)
      .join(' + ');
    console.log(`\n${String(q._id)} [${q.objective_ids[0]}] ${carries}`);
    console.log(`  ${q.stem.replace(/\s+/g, ' ').slice(0, 100)}`);
    for (const i of issues) console.log(`  ✗ ${i}`);
  }

  console.log(`\n${failed.length} of ${drafts.length} pending figures and tables fail today's gate.`);
  if (failed.length === 0) {
    process.exit(0);
  }
  if (!apply) {
    console.log('Re-run with --yes to retire them.');
    process.exit(0);
  }

  const res = await Question.updateMany(
    { _id: { $in: failed.map((f) => f.id) } },
    { $set: { status: 'retired', reject_reason: 'visual-gate-recheck' } },
  );
  console.log(`Retired ${res.modifiedCount}. Drafts remaining: ${await Question.countDocuments({ status: 'draft' })}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
