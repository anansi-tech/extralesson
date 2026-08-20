// One sweep of the live bank for the defect classes that have reached a review
// queue and been caught by eye.
//
// The checks themselves live in lib/admin/review-flags.ts, beside the dashboard
// that shows them on each question. They were duplicated here for one batch and
// immediately drifted — this script tightened its linear-programming detector
// while the dashboard kept the loose one, so the same question was flagged in
// one place and not the other. One definition, two readers.
//
// It REPORTS. It retires nothing and gates nothing: what is already in the bank
// is a review decision. Drafts written after a sweep are invisible to it, so it
// wants running after every batch — which the generator now does for its own
// output.
//
// Run: pnpm tsx scripts/audit-module-fidelity.ts
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { reviewFlags, type FlaggableQuestion } from '@/lib/admin/review-flags';

async function main() {
  await dbConnect();
  const qs = await Question.find({ status: { $in: ['draft', 'approved'] } }).lean<
    (FlaggableQuestion & { _id: unknown; status: string; objective_ids: string[] })[]
  >();

  const hits = qs
    .map((q) => ({ q, flags: reviewFlags(q).filter((f) => f.level === 'warn') }))
    .filter((h) => h.flags.length > 0);

  console.log(`Swept ${qs.length} live questions — ${hits.length} carry at least one flag.\n`);
  for (const status of ['draft', 'approved']) {
    const rows = hits.filter((h) => h.q.status === status);
    if (rows.length === 0) continue;
    console.log(`${status.toUpperCase()} — ${rows.length}${status === 'approved' ? ' (already reviewed and passed)' : ''}`);
    for (const { q, flags } of rows) {
      console.log(`  ${String(q._id)}  ${q.objective_ids.join(',')}`);
      for (const f of flags) console.log(`    · ${f.text}`);
    }
    console.log('');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
