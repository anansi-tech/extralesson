// Same-commit backfill for the venn2 -> vennDiagram rename (R1.8).
//
// The name was a claim the file did not honour: the third set and all seven of
// its regions have been supported throughout, and "venn2" had us auditing our
// own coverage as two-set-only against papers that set three-set questions.
//
// Stored questions carry the template name, and the registry is keyed by it, so
// a rename without this migration makes every existing Venn question
// unrenderable — the lookup simply misses.
//
// Previews by default; --yes applies. Idempotent.
// Run: pnpm tsx scripts/rename-venn-template.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';

async function main() {
  const apply = process.argv.includes('--yes');
  await dbConnect();

  const stale = await Question.countDocuments({ 'visual.template': 'venn2' });
  const renamed = await Question.countDocuments({ 'visual.template': 'vennDiagram' });
  console.log(`${stale} question(s) still say venn2; ${renamed} already say vennDiagram.`);

  if (stale === 0) {
    console.log('nothing to do');
    process.exit(0);
  }
  if (!apply) {
    console.log('preview only — re-run with --yes');
    process.exit(0);
  }
  const res = await Question.updateMany(
    { 'visual.template': 'venn2' },
    { $set: { 'visual.template': 'vennDiagram' } },
  );
  console.log(`applied: ${res.modifiedCount} updated`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
