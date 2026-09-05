// Writes design/hints/batch-N.json: a second-person hint for the next 200
// method rows without one, every row PROPOSED, and its table in
// design/hints/APPROVAL_LOG.md. Nothing touches the bank until approval.
// Run: pnpm hints:generate <batch-number> [--size N] [--redo-tex | --redo-all]
//      pnpm hints:next [--size N]   — the next batch number, from the files present
import 'dotenv/config';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MODEL_ID } from '@/lib/ai';
import { dbConnect, Question } from '@/lib/db';
import { earnableByMethod } from '@/lib/grade/method-marks';
import { checkedHints, type HintTarget } from '@/lib/generation/hints';

const DIR = join(process.cwd(), 'design', 'hints');
const DEFAULT_BATCH = 200;
/** --size N sets the batch size; the default is 200. */
const BATCH = (() => {
  const at = process.argv.indexOf('--size');
  const n = at >= 0 ? Number(process.argv[at + 1]) : NaN;
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_BATCH;
})();

export interface HintRow {
  question_id: string;
  code: string;
  criterion: string;
  hint: string;
  status: 'proposed' | 'approved' | 'rejected';
}

function writeTable(n: number, rows: HintRow[]): void {
  const log = join(DIR, 'APPROVAL_LOG.md');
  const head = existsSync(log)
    ? readFileSync(log, 'utf8')
    : '# Hint approval log\n\nOne table per batch. A row is approved by setting its status in the batch file; `pnpm hints:approve <n>` writes approved hints to the bank.\n';
  const marker = `\n## Batch ${n} — `;
  const before = head.includes(marker) ? head.slice(0, head.indexOf(marker)) : head;
  const table =
    `${marker}proposed (${rows.length} rows, ${MODEL_ID}, ${new Date().toISOString().slice(0, 10)})\n\n| # | question | code | criterion | hint |\n|---|---|---|---|---|\n` +
    rows.map((r, i) => `| ${i + 1} | ${r.question_id.slice(-6)} | ${r.code} | ${r.criterion.replace(/\|/g, '\\|')} | ${r.hint.replace(/\|/g, '\\|')} |`).join('\n') +
    '\n';
  writeFileSync(log, before + table);
}

/** Regenerates the batch's rows — those with TeX, or all of them — keeping the row set and order, and rewrites the table. */
async function redo(n: number, file: string, all: boolean): Promise<void> {
  const rows = JSON.parse(readFileSync(file, 'utf8')) as HintRow[];
  const redo = all ? rows : rows.filter((r) => /\\/.test(r.criterion));
  const byQuestion = new Map<string, HintRow[]>();
  for (const r of redo) byQuestion.set(r.question_id, [...(byQuestion.get(r.question_id) ?? []), r]);
  for (const [qid, list] of byQuestion) {
    const q = await Question.findById(qid).select('stem worked_solution').lean<HintTarget | null>();
    if (!q) continue;
    const hints = await checkedHints(q, list);
    for (const r of list) if (hints.has(r.code)) r.hint = hints.get(r.code)!;
    process.stdout.write(`\r${qid.slice(-6)}: ${list.length} redone   `);
  }
  console.log();
  writeFileSync(file, JSON.stringify(rows, null, 1) + '\n');
  writeTable(n, rows);
  console.log(`${redo.length} ${all ? '' : 'TeX '}rows regenerated in ${file}; table rewritten`);
}

/** The next batch number: one more than the highest batch file present. */
function nextBatchNumber(): number {
  mkdirSync(DIR, { recursive: true });
  const nums = readdirSync(DIR).map((f) => /^batch-(\d+)\.json$/.exec(f)?.[1]).filter(Boolean).map(Number);
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

async function main() {
  const n = process.argv[2] === '--next' ? nextBatchNumber() : Number(process.argv[2]);
  if (!Number.isInteger(n) || n < 1) throw new Error('usage: pnpm hints:generate <batch-number> [--size N] [--redo-tex | --redo-all], or pnpm hints:next [--size N]');
  const file = join(DIR, `batch-${n}.json`);
  mkdirSync(DIR, { recursive: true });
  await dbConnect();
  if (process.argv.includes('--redo-tex') || process.argv.includes('--redo-all')) {
    await redo(n, file, process.argv.includes('--redo-all'));
    process.exit(0);
  }
  if (existsSync(file)) throw new Error(`${file} exists`);

  const done = new Set<string>();
  for (let i = 1; i < n; i++) {
    const prev = join(DIR, `batch-${i}.json`);
    if (existsSync(prev)) for (const r of JSON.parse(readFileSync(prev, 'utf8')) as HintRow[]) done.add(`${r.question_id}/${r.code}`);
  }
  const questions = await Question.find({ status: 'approved', kind: 'structured' })
    .select('stem parts rubric worked_solution')
    .sort({ _id: 1 })
    .lean<(HintTarget & { _id: unknown; parts?: never[]; rubric?: { code: string; criterion: string; hint?: string }[] })[]>();

  const rows: HintRow[] = [];
  for (const q of questions) {
    if (rows.length >= BATCH) break;
    const wanted = earnableByMethod(q as never, []).filter((r) => !r.hint && !done.has(`${String(q._id)}/${r.code}`));
    if (wanted.length === 0) continue;
    const byCode = await checkedHints(q, wanted);
    for (const r of wanted) {
      if (rows.length >= BATCH) break;
      const hint = byCode.get(r.code);
      if (!hint) continue;
      rows.push({ question_id: String(q._id), code: r.code, criterion: r.criterion, hint, status: 'proposed' });
    }
    process.stdout.write(`\r${rows.length}/${BATCH}`);
  }
  console.log();
  writeFileSync(file, JSON.stringify(rows, null, 1) + '\n');
  writeTable(n, rows);
  console.log(`${rows.length} hints proposed in ${file}; table written to APPROVAL_LOG.md`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
