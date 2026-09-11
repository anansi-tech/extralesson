// Same-commit backfill: Student.access.sitting from the student's sitting.
// Run: pnpm tsx scripts/backfill-access-sitting.ts
import 'dotenv/config';
import { dbConnect } from '@/lib/db';
import { backfillAccessSitting } from '@/lib/db/backfill-access-sitting';
import { isEntryPoint } from '../entry';

async function main() {
  await dbConnect();
  const n = await backfillAccessSitting();
  console.log(`grants given a sitting: ${n.filled}`);
  process.exit(0);
}

// Only when run as a script: an import must not start the work.
if (isEntryPoint(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
