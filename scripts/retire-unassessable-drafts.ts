// Retire drafts written against objectives we cannot assess (R1.6 §3).
//
// The generator used to draw from every objective in a topic, including the
// construction and measurement ones. Questions written to those objectives ask
// the student to measure a figure that is not to scale, or to name the
// instruments they would use — neither of which we can mark. The tag now filters
// the recipe pool; this clears what was written before it did.
//
// Idempotent. Reads the tags from the seeds, not a hardcoded list, so it stays
// correct as the tags change. Run: pnpm tsx scripts/retire-unassessable-drafts.ts
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { module1Topics } from '@/lib/seed/module1-topics';
import { module2Topics } from '@/lib/seed/module2-topics';
import { module3Topics } from '@/lib/seed/module3-topics';

async function main() {
  const unassessable = [...module1Topics, ...module2Topics, ...module3Topics]
    .flatMap((t) => t.objectives)
    .filter((o) => (o as { assessable?: boolean }).assessable === false)
    .map((o) => o.id);

  await dbConnect();
  const affected = await Question.find({
    status: 'draft',
    objective_ids: { $in: unassessable },
  }).lean<{ _id: unknown; objective_ids: string[]; stem: string }[]>();

  for (const q of affected) {
    console.log(`  ${String(q._id)} [${q.objective_ids.join(', ')}] ${q.stem.slice(0, 70)}…`);
  }

  const res = await Question.updateMany(
    { status: 'draft', objective_ids: { $in: unassessable } },
    { $set: { status: 'retired', reject_reason: 'unassessable-objective' } },
  );
  console.log(`Retired ${res.modifiedCount} draft(s) written against ${unassessable.length} unassessable objectives.`);
  console.log(`Drafts remaining: ${await Question.countDocuments({ status: 'draft' })}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
