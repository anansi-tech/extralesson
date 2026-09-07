// The bank's hardest cases for a 320px page, as a fixture the width test
// renders: the twenty longest worked solutions, the five longest single runs
// of inline math, and every set written with three or more items.
// Run: pnpm tsx scripts/snapshot-long-math.ts
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dbConnect, Question } from '@/lib/db';

type Row = { _id: unknown; stem: string; stimulus?: string; worked_solution: string; misconceptions: { remediation: string }[] };

async function main() {
  await dbConnect();
  const rows = await Question.find({ status: 'approved' }).select('stem stimulus worked_solution misconceptions').lean<Row[]>();
  const text = (q: Row) => `${q.stimulus ?? ''} ${q.stem} ${q.worked_solution}`;
  const longestRun = (q: Row) => Math.max(0, ...[...q.worked_solution.matchAll(/\$([^$]+)\$/g)].map((m) => m[1].length));
  const hasSet = (q: Row) => [...text(q).matchAll(/\$[^$]*\\\{([^$]*)\\\}[^$]*\$/g)].some((m) => (m[1].match(/,/g) ?? []).length >= 2);
  const pick = new Map<string, { why: string; q: Row }>();
  const add = (why: string, list: Row[]) => list.forEach((q) => pick.has(String(q._id)) || pick.set(String(q._id), { why, q }));
  add('longest solution', [...rows].sort((a, b) => b.worked_solution.length - a.worked_solution.length).slice(0, 20));
  add('longest inline math', [...rows].sort((a, b) => longestRun(b) - longestRun(a)).slice(0, 5));
  add('set', rows.filter(hasSet));
  const out = [...pick.entries()].map(([id, { why, q }]) => ({
    id,
    why,
    stem: q.stem,
    stimulus: q.stimulus,
    worked_solution: q.worked_solution,
    remediations: q.misconceptions.map((m) => m.remediation),
  }));
  writeFileSync(join(process.cwd(), 'tests', 'fixtures', 'long-math.json'), JSON.stringify(out, null, 1));
  console.log(`${out.length} questions: ${out.filter((o) => o.why === 'longest solution').length} longest, ${out.filter((o) => o.why === 'longest inline math').length} inline, ${out.filter((o) => o.why === 'set').length} sets`);
  process.exit(0);
}
main();
