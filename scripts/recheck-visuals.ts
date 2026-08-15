// Re-run the visual gate over the pending queue.
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
import { verifyQuestionVisual } from '@/lib/visuals/verify';
import type { StoredVisual } from '@/lib/visuals';

interface LeanDraft {
  _id: unknown;
  stem: string;
  stimulus?: string;
  parts?: { prompt: string }[];
  visual: StoredVisual;
  objective_ids: string[];
}

async function main() {
  const apply = process.argv.includes('--yes');
  await dbConnect();

  const drafts = await Question.find({ status: 'draft', 'visual.template': { $exists: true } })
    .select('stem stimulus parts visual objective_ids')
    .lean<LeanDraft[]>();

  const failed: { id: string; issues: string[] }[] = [];
  for (const q of drafts) {
    const res = verifyQuestionVisual(q.visual, {
      stimulus: q.stimulus,
      stem: q.stem,
      partPrompts: (q.parts ?? []).map((p) => p.prompt),
    });
    if (res.ok) continue;
    failed.push({ id: String(q._id), issues: res.issues });
    console.log(`\n${String(q._id)} [${q.objective_ids[0]}] ${q.visual.template}`);
    console.log(`  ${q.stem.replace(/\s+/g, ' ').slice(0, 100)}`);
    for (const i of res.issues) console.log(`  ✗ ${i}`);
  }

  console.log(`\n${failed.length} of ${drafts.length} pending visuals fail today's gate.`);
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
