// Same-commit backfill for the timestamps added to the Question schema.
//
// `created_at` is recoverable exactly: an ObjectId encodes the second it was
// minted, so this is a restatement of what the row already carried rather than
// a guess. `updated_at` is NOT backfilled — nothing recorded when a row was
// last written, which is the whole reason the field now exists, and writing
// created_at into it would assert that no question has ever been edited. An
// absent updated_at reads as "not written since the trail began", which is
// true.
//
// The write goes through the DRIVER, not the model. A backfill that stamped
// every row as updated today would destroy the trail on the day it created it,
// and mongoose's own `timestamps: false` cannot be used to avoid that: it
// strips the timestamp field out of the update instead, returning an
// unacknowledged no-op. The driver knows nothing about timestamps, which is
// exactly what is wanted here.
//
// Previews by default; --yes applies.
// Run: pnpm tsx scripts/done/backfill-question-timestamps.ts [--yes]
import 'dotenv/config';
import mongoose from 'mongoose';
import { dbConnect, Question } from '@/lib/db';
import { isEntryPoint } from '../entry';

async function main() {
  await dbConnect();
  const missing = await Question.find({ created_at: { $exists: false } }).select('_id').lean<{ _id: unknown }[]>();
  const total = await Question.countDocuments({});
  console.log(`questions: ${total} · without created_at: ${missing.length}`);
  if (missing.length === 0) {
    console.log('nothing to backfill');
    process.exit(0);
  }
  const at = (id: unknown) => (id as mongoose.Types.ObjectId).getTimestamp();
  const sorted = [...missing].sort((a, b) => at(a._id).getTime() - at(b._id).getTime());
  console.log(`oldest ${at(sorted[0]._id).toISOString().slice(0, 10)} · newest ${at(sorted[sorted.length - 1]._id).toISOString().slice(0, 10)}`);

  if (!process.argv.includes('--yes')) {
    console.log('preview only; pass --yes to apply');
    process.exit(0);
  }

  let written = 0;
  for (const row of missing) {
    const res = await Question.collection.updateOne(
      { _id: row._id as mongoose.Types.ObjectId },
      { $set: { created_at: at(row._id) } },
    );
    written += res.modifiedCount;
  }
  const left = await Question.countDocuments({ created_at: { $exists: false } });
  console.log(`written: ${written} · still missing: ${left}`);
  const stamped = await Question.countDocuments({ updated_at: { $exists: true } });
  console.log(`carrying updated_at (deliberately none yet): ${stamped}`);
  process.exit(left === 0 ? 0 : 1);
}

// Only when run as a script: an import must not start the work.
if (isEntryPoint(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
