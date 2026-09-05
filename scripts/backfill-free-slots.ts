// Same-commit backfill: PracticeSession.free_slot, unique per student.
// Run: pnpm tsx scripts/backfill-free-slots.ts
import 'dotenv/config';
import { dbConnect } from '@/lib/db';
import { backfillFreeSlots } from '@/lib/db/backfill-free-slots';

async function main() {
  await dbConnect();
  const n = await backfillFreeSlots();
  console.log(`sessions numbered: ${n.numbered} across ${n.students} students`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
