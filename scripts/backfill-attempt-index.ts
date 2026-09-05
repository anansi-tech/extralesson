// Same-commit backfill: Attempt.question_index, unique with session_id.
// Run: pnpm tsx scripts/backfill-attempt-index.ts
import 'dotenv/config';
import { dbConnect } from '@/lib/db';
import { backfillAttemptIndex } from '@/lib/db/backfill-attempt-index';

async function main() {
  await dbConnect();
  const n = await backfillAttemptIndex();
  console.log(`attempts indexed from their session: ${n.indexed} · ranked by time (session gone): ${n.ranked}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
