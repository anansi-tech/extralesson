// Same-commit backfill for the R1.6 part fields (response_mode, answer_format).
//
// Existing parts were all auto-graded final answers, which is exactly what
// response_mode 'answer' means, so the backfill is a straight default. Nothing
// carries an answer_format: pre-R1.6 prompts never asked for one, and guessing
// a form from stored text would invent a requirement the question never made.
//
// Idempotent. Run: npx tsx scripts/backfill-r16-parts.ts
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';

async function main() {
  await dbConnect();
  const result = await Question.collection.updateMany(
    { 'parts.response_mode': { $exists: false } },
    { $set: { 'parts.$[part].response_mode': 'answer' } },
    { arrayFilters: [{ 'part.response_mode': { $exists: false } }] },
  );
  const total = await Question.countDocuments();
  console.log(`Backfilled response_mode on ${result.modifiedCount} of ${total} questions.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
