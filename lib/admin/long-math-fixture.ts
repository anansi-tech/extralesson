import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Question } from '@/lib/db';

/**
 * THE WIDTH FIXTURE: the bank's hardest cases for a 320px page — the twenty
 * longest worked solutions, the five longest runs of inline math, and every
 * set of three or more items — which tests/long-math-width.test.ts renders.
 * A snapshot of the bank, so it is taken again whenever the bank grows: on
 * approval, and by scripts/snapshot-long-math.ts by hand. On a deployment
 * there is no checkout to write into, and nothing is written.
 */
export const LONG_MATH_FIXTURE = join(process.cwd(), 'tests', 'fixtures', 'long-math.json');

type Row = { _id: unknown; stem: string; stimulus?: string; worked_solution: string; misconceptions: { remediation: string }[] };
export type LongMathRow = { id: string; why: string; stem: string; stimulus?: string; worked_solution: string; remediations: string[] };

export async function snapshotLongMath(path = LONG_MATH_FIXTURE): Promise<LongMathRow[] | null> {
  if (!existsSync(dirname(path))) return null;
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
    remediations: (q.misconceptions ?? []).map((m) => m.remediation),
  }));
  writeFileSync(path, JSON.stringify(out, null, 1));
  return out;
}
