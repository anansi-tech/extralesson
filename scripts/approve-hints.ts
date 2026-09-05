// Writes every APPROVED hint in design/hints/batch-N.json onto its rubric
// row in the bank. Proposed and rejected rows are left alone.
// Run: pnpm hints:approve <batch-number> [--yes]
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dbConnect, Question } from '@/lib/db';
import type { HintRow } from './generate-hints';

async function main() {
  const n = Number(process.argv[2]);
  if (!Number.isInteger(n) || n < 1) throw new Error('usage: pnpm hints:approve <batch-number> [--yes]');
  const rows = (JSON.parse(readFileSync(join(process.cwd(), 'design', 'hints', `batch-${n}.json`), 'utf8')) as HintRow[]).filter((r) => r.status === 'approved');
  const apply = process.argv.includes('--yes');
  await dbConnect();
  let written = 0;
  for (const r of rows) {
    if (apply) {
      const res = await Question.updateOne({ _id: r.question_id, 'rubric.code': r.code }, { $set: { 'rubric.$.hint': r.hint } });
      written += res.modifiedCount;
    }
  }
  console.log(`${rows.length} approved in batch ${n}; ${apply ? `${written} written to the bank` : 'pass --yes to write them'}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
