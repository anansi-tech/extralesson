// Same-commit backfill: Student.access.sitting from the student's sitting.
// Run: pnpm tsx scripts/backfill-access-sitting.ts
import 'dotenv/config';
import { dbConnect } from '@/lib/db';
import { backfillAccessSitting } from '@/lib/db/backfill-access-sitting';

async function main() {
  await dbConnect();
  const n = await backfillAccessSitting();
  console.log(`grants given a sitting: ${n.filled}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
