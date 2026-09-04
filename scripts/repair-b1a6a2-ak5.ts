// One rubric row: b1a6a2's AK5 said "Calculates $4\div2=2$" with no "their",
// so a student halving their own interquartile range was refused the method
// mark the row exists to pay (APPROVAL_LOG Batch 7). Previews by default; --yes applies.
// Run: pnpm tsx scripts/repair-b1a6a2-ak5.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';

const QUESTION = '6a865a280dea6d2763b1a6a2';
const CODE = 'AK5';
const CRITERION = 'Halves "their" interquartile range: $4\\div2=2$';

async function main() {
  await dbConnect();
  const q = await Question.findById(QUESTION).select('rubric').lean<{ rubric: { code: string; criterion: string }[] } | null>();
  const row = q?.rubric.find((r) => r.code === CODE);
  if (!row) throw new Error('row not found');
  console.log(`before: ${row.criterion}\nafter:  ${CRITERION}`);
  if (!process.argv.includes('--yes')) {
    console.log('preview only; pass --yes to apply');
    process.exit(0);
  }
  const res = await Question.updateOne({ _id: QUESTION, 'rubric.code': CODE }, { $set: { 'rubric.$.criterion': CRITERION } });
  console.log(`modified: ${res.modifiedCount}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
