// Same-commit backfill: Attempt.rubric_hash and the rubric snapshot.
// Run: pnpm tsx scripts/backfill-rubric-snapshot.ts
import 'dotenv/config';
import { dbConnect } from '@/lib/db';
import { backfillRubricSnapshot } from '@/lib/db/backfill-rubric-snapshot';

async function main() {
  await dbConnect();
  const n = await backfillRubricSnapshot();
  console.log(`attempts stamped with their rubric: ${n.stamped} · question gone: ${n.orphaned}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
