// Same-commit backfill: reads keyed on {session_id, question_index, take}.
// Run: pnpm tsx scripts/backfill-read-keys.ts
import 'dotenv/config';
import { dbConnect } from '@/lib/db';
import { backfillReadKeys } from '@/lib/db/backfill-read-keys';

async function main() {
  await dbConnect();
  const n = await backfillReadKeys();
  console.log(`transcriptions keyed: ${n.Transcription} · images keyed: ${n.CapturedImage} · unresolved: ${n.unresolved}`);
  process.exit(n.unresolved ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
