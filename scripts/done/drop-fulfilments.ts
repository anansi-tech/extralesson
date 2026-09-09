// ROUND_11 cutover: the second record is gone from the code, so the collection
// goes too. Run once, after the deploy that removed every reader and writer.
// Run: pnpm tsx scripts/done/drop-fulfilments.ts
import 'dotenv/config';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';

async function main() {
  await dbConnect();
  const db = mongoose.connection.db!;
  const found = await db.listCollections({ name: 'fulfilments' }).toArray();
  if (found.length === 0) {
    console.log('fulfilments: already gone');
    process.exit(0);
  }
  const n = await db.collection('fulfilments').countDocuments();
  await db.collection('fulfilments').drop();
  console.log(`fulfilments: dropped, ${n} documents`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
