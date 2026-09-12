// Five structured questions store shape: 'drill' while their own gen_meta
// records recipe.shape: 'paper' — 10 to 12 marks over 4 parts, which is a paper
// question by any reading. Nothing reads the stored field at runtime, so no
// student saw anything wrong; what was corrupted is the bank's account of
// itself, which is what any drill-versus-paper measurement would read.
//
// The likely mechanism is the review editor's old hand-written field list,
// which omitted `shape` — a field carrying a default, so saving a paper
// question wrote 'drill' over it silently (fixed in 62db43d). It cannot be
// proved: the Question schema had no timestamps, so there was no edit trail.
//
// Previews by default; --yes applies.
// Run: pnpm tsx scripts/done/repair-paper-shape.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { isEntryPoint } from '../entry';

/**
 * THE GUARD IS THE QUESTION'S OWN RECIPE. Only a row whose recipe asked for
 * paper can be corrected to paper, so this can never invent a shape for a
 * question that was genuinely generated as a drill — of which there are 34,
 * and none of them are touched.
 */
const MISMATCH = {
  kind: 'structured',
  shape: 'drill',
  'gen_meta.recipe.shape': 'paper',
} as const;

async function main() {
  await dbConnect();
  const found = await Question.find(MISMATCH)
    .select('shape marks parts status gen_meta')
    .lean<{ _id: unknown; shape: string; marks: number; parts?: unknown[]; status: string; gen_meta: { ts: Date } }[]>();

  console.log(`questions whose recipe asked for paper and whose record says drill: ${found.length}\n`);
  for (const q of found) {
    console.log(
      `  ${String(q._id)}  ${q.status.padEnd(9)} ${q.marks}mk ${q.parts?.length}pt  generated ${new Date(q.gen_meta.ts).toISOString().slice(0, 10)}  ${q.shape} -> paper`,
    );
  }
  if (found.length === 0) {
    console.log('nothing to repair');
    process.exit(0);
  }
  if (!process.argv.includes('--yes')) {
    console.log('\npreview only; pass --yes to apply');
    process.exit(0);
  }

  const res = await Question.updateMany(MISMATCH, { $set: { shape: 'paper' } });
  console.log(`\nmodified: ${res.modifiedCount}`);
  const left = await Question.countDocuments(MISMATCH);
  console.log(`still mismatched: ${left}`);
  process.exit(left === 0 ? 0 : 1);
}

// Only when run as a script: an import must not start the work.
if (isEntryPoint(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
