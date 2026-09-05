// One rubric row: the fish-vendor question's R3, "States the discount as a
// percentage", pays for the form of c.i and carried no for_format flag, so the
// marker awarded it on a wrong value (smoke #2). Previews by default; --yes applies.
// Run: pnpm tsx scripts/repair-821070-r3.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';

const CODE = 'R3';

async function main() {
  await dbConnect();
  const q = (await Question.find({ status: 'approved' }).select('rubric').lean<{ _id: unknown; rubric: { code: string; criterion: string; for_format?: boolean }[] }[]>()).find(
    (x) => String(x._id).endsWith('821070'),
  );
  const row = q?.rubric.find((r) => r.code === CODE);
  if (!q || !row) throw new Error('row not found');
  console.log(`${CODE}: "${row.criterion}" for_format ${row.for_format ?? false} → true`);
  if (!process.argv.includes('--yes')) {
    console.log('preview only; pass --yes to apply');
    process.exit(0);
  }
  const res = await Question.updateOne({ _id: q._id, 'rubric.code': CODE }, { $set: { 'rubric.$.for_format': true } });
  console.log(`modified: ${res.modifiedCount}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
