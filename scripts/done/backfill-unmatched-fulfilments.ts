// Same-commit backfill: fulfilments left pending because the paying address
// had no account. Run: pnpm tsx scripts/done/backfill-unmatched-fulfilments.ts
import 'dotenv/config';
import { dbConnect } from '@/lib/db';
import { backfillUnmatchedFulfilments } from '@/lib/db/backfill-unmatched-fulfilments';

async function main() {
  await dbConnect();
  const { marked } = await backfillUnmatchedFulfilments();
  console.log(`fulfilments marked unmatched: ${marked}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
