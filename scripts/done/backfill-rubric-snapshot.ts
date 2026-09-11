// Same-commit backfill: Attempt.rubric_hash and the rubric snapshot.
// Run: pnpm tsx scripts/backfill-rubric-snapshot.ts
import 'dotenv/config';
import { dbConnect } from '@/lib/db';
import { backfillRubricSnapshot } from '@/lib/db/backfill-rubric-snapshot';
import { isEntryPoint } from '../entry';

async function main() {
  await dbConnect();
  const n = await backfillRubricSnapshot();
  console.log(`attempts stamped with their rubric: ${n.stamped} · question gone: ${n.orphaned}`);
  process.exit(0);
}

// Only when run as a script: an import must not start the work.
if (isEntryPoint(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
