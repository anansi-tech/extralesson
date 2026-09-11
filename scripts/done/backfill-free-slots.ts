// Same-commit backfill: PracticeSession.free_slot, unique per student.
// Run: pnpm tsx scripts/backfill-free-slots.ts
import 'dotenv/config';
import { dbConnect } from '@/lib/db';
import { backfillFreeSlots } from '@/lib/db/backfill-free-slots';
import { isEntryPoint } from '../entry';

async function main() {
  await dbConnect();
  const n = await backfillFreeSlots();
  console.log(`sessions numbered: ${n.numbered} across ${n.students} students`);
  process.exit(0);
}

// Only when run as a script: an import must not start the work.
if (isEntryPoint(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
