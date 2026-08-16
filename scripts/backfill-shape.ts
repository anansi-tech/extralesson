// Same-commit backfill for Question.shape (R1.8 §2).
//
// The bank was written before a question could be a whole Paper 2 question, so
// every row in it is a drill item — that is what the 123 approved questions
// ARE, and they stay: a short single-answer item between paper-shaped questions
// is genuinely useful practice. What they must not be is silently counted as
// the thing the papers set.
//
// A row is paper-shaped only if it could not be anything else: 9 marks or more,
// more than one part, and objectives from more than one topic. Everything else
// is a drill item, including the borderline cases — miscounting a paper
// question as drill costs nothing, while the reverse quietly tells the matrix
// we have paper coverage we do not have.
//
// Previews by default; --yes applies. Run: pnpm tsx scripts/backfill-shape.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';

interface Lean {
  _id: unknown;
  kind: 'mcq' | 'structured';
  marks: number;
  status: string;
  parts?: unknown[];
  objective_ids: string[];
  shape?: string;
}

/** The topic an objective belongs to: M1.5.13 -> M1.5. */
function topicOf(objectiveId: string): string {
  return objectiveId.slice(0, objectiveId.lastIndexOf('.'));
}

export function shapeOf(q: Pick<Lean, 'kind' | 'marks' | 'parts' | 'objective_ids'>): 'paper' | 'drill' {
  if (q.kind !== 'structured') return 'drill';
  const topics = new Set(q.objective_ids.map(topicOf));
  return q.marks >= 9 && (q.parts?.length ?? 0) > 1 && topics.size > 1 ? 'paper' : 'drill';
}

async function main() {
  const apply = process.argv.includes('--yes');
  await dbConnect();

  const qs = await Question.find({}).select('kind marks status parts objective_ids shape').lean<Lean[]>();
  const counts = { paper: 0, drill: 0 };
  const byStatus = new Map<string, { paper: number; drill: number }>();
  let changed = 0;

  for (const q of qs) {
    const shape = shapeOf(q);
    counts[shape]++;
    const row = byStatus.get(q.status) ?? { paper: 0, drill: 0 };
    row[shape]++;
    byStatus.set(q.status, row);
    if (q.shape === shape) continue;
    changed++;
    if (apply) await Question.updateOne({ _id: q._id }, { $set: { shape } });
  }

  console.log(`${qs.length} questions: ${counts.paper} paper-shaped, ${counts.drill} drill`);
  for (const [status, row] of [...byStatus].sort()) {
    console.log(`  ${status.padEnd(9)} ${row.paper} paper · ${row.drill} drill`);
  }
  console.log(`\n${changed} need updating. ${apply ? 'applied' : 'preview only — re-run with --yes'}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
