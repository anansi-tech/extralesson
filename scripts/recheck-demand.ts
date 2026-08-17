// Re-run the solve gate over unreviewed drafts, with the new-work check.
//
// A part that demands nothing is a part the student cannot get wrong, and it
// passes every structural gate: depends_on proves the parts CONNECT, and a
// question whose (b) restates its own premise and whose (c) inverts (a)
// satisfies that perfectly. It was found by reading, which is the expensive way.
//
// This is not a migration — the gate will keep gaining judgement, and drafts
// written before it should be re-tested rather than reviewed by hand. Approved
// questions are never touched: a reviewer has read them.
//
// Previews by default; --yes retires what fails.
// Run: pnpm tsx scripts/recheck-demand.ts [--yes] [--limit 20]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { independentSolve } from '@/lib/generation/solve';
import { QuestionDraftZ } from '@/lib/validation/question';

async function main() {
  const apply = process.argv.includes('--yes');
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg === -1 ? 0 : Number(process.argv[limitArg + 1]);
  await dbConnect();

  const drafts = await Question.find({ status: 'draft', kind: 'structured' })
    .sort({ _id: 1 })
    .limit(limit || 0)
    .lean<Record<string, unknown>[]>();

  console.log(`re-adjudicating ${drafts.length} unreviewed structured drafts\n`);

  const failed: { id: string; stem: string; notes: string[] }[] = [];
  let checked = 0;
  let unparsed = 0;

  for (const raw of drafts) {
    const parsed = QuestionDraftZ.safeParse(raw);
    if (!parsed.success) {
      unparsed++;
      continue;
    }
    checked++;
    let outcome;
    try {
      outcome = await independentSolve(parsed.data);
    } catch (err) {
      console.log(`  ! ${String(raw._id).slice(-6)} solve error: ${(err as Error).message}`);
      continue;
    }
    // Only the new check retires here. A plain disagreement on a draft that
    // already passed the gate once is the model differing from itself, and
    // retiring on that would churn the queue for no gain.
    const empty = outcome.notes.filter((n) => n.includes('demands no new work'));
    if (empty.length === 0) continue;
    failed.push({ id: String(raw._id), stem: String(raw.stem).replace(/\s+/g, ' ').slice(0, 84), notes: empty });
    console.log(`  ✗ ${String(raw._id).slice(-6)} ${String(raw.stem).replace(/\s+/g, ' ').slice(0, 70)}`);
    for (const n of empty) console.log(`      ${n}`);
  }

  console.log(
    `\n${failed.length} of ${checked} carry a part that demands nothing` +
      (unparsed ? ` (${unparsed} could not be parsed and were skipped)` : ''),
  );
  if (failed.length === 0 || !apply) {
    console.log(apply ? 'nothing to retire' : 'preview only — re-run with --yes to retire them');
    process.exit(0);
  }
  const res = await Question.updateMany(
    { _id: { $in: failed.map((f) => f.id) } },
    { $set: { status: 'retired', reject_reason: 'part-demands-no-new-work' } },
  );
  console.log(`retired ${res.modifiedCount}; drafts remaining: ${await Question.countDocuments({ status: 'draft' })}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
