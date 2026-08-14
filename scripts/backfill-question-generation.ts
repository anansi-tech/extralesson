// Same-commit backfill for structured visuals and recorded generation controls.
// Existing questions remain text-only and have no recoverable historic recipe. Idempotent.
import 'dotenv/config';
import { z } from 'zod';
import { dbConnect, Question } from '@/lib/db';

z.object({ MONGODB_URI: z.string().min(1) }).parse(process.env);

async function main() {
  await dbConnect();
  const [visuals, recipes, reviews] = await Promise.all([
    Question.updateMany({ visual: { $exists: false } }, { $set: { visual: null } }),
    Question.updateMany(
      { 'gen_meta.recipe': { $exists: false } },
      { $set: { 'gen_meta.recipe': null } },
    ),
    Question.updateMany(
      { 'gen_meta.review': { $exists: false } },
      { $set: { 'gen_meta.review': null } },
    ),
  ]);
  console.log(
    `Backfilled ${visuals.modifiedCount} visual fields, ${recipes.modifiedCount} recipe fields, and ${reviews.modifiedCount} review fields.`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'unknown failure');
  process.exit(1);
});
