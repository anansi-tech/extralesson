// Writes design/hints/batch-N.json: a second-person hint for the next 200
// method rows without one, every row PROPOSED, and its table in
// design/hints/APPROVAL_LOG.md. Nothing touches the bank until approval.
// Run: pnpm hints:generate <batch-number> [--redo-tex | --redo-all]
import 'dotenv/config';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { generateObject } from 'ai';
import { model, MODEL_ID } from '@/lib/ai';
import { dbConnect, Question } from '@/lib/db';
import { earnableByMethod } from '@/lib/grade/method-marks';
import { MARK_SCHEME_CONVENTIONS } from '@/lib/prompts/mark-scheme';
import { hintProblems, plainYour, repairTex } from '@/lib/generation/hint-tex';

const DIR = join(process.cwd(), 'design', 'hints');
const BATCH = 200;

export interface HintRow {
  question_id: string;
  code: string;
  criterion: string;
  hint: string;
  status: 'proposed' | 'approved' | 'rejected';
}

const HintsZ = z.object({ hints: z.array(z.object({ code: z.string(), hint: z.string().min(1) })) });

const PROMPT_RULES =
  `You write ONE sentence per mark-scheme row for a CSEC Mathematics student who got that part wrong.\n` +
  `Second person, present tense, addressed to the student ("Find where the two lines cross — that's where the retained amounts are equal.").\n` +
  `Say what to DO, not what the scheme awards; never the words "mark", "criterion", "award", "their". No answer values.\n` +
  `Plain text with TeX only where the criterion has it, and every TeX command the criterion uses appears in the hint with its backslash. ` +
  `All TeX sits inside $...$ — never \\( \\) and never a bare command outside dollars. Write your without quotation marks. ` +
  `Inside the JSON string, write every backslash DOUBLED: "$\\\\overrightarrow{OA}$", "$x \\\\ge 20$".\n`;

type Row = { code: string; criterion: string };
type Q = { stem: string; worked_solution: string };

async function hintsFor(q: Q, wanted: Row[]): Promise<Map<string, string>> {
  const result = await generateObject({
    model,
    schema: HintsZ,
    prompt:
      PROMPT_RULES +
      `\n${MARK_SCHEME_CONVENTIONS}\n\n` +
      `QUESTION: ${q.stem}\n\nSOLUTION (for you, never quoted): ${q.worked_solution}\n\n` +
      `ROWS:\n${wanted.map((r) => `${r.code}: ${r.criterion}`).join('\n')}\n\nReturn one hint per row, by code.`,
  });
  const out = new Map<string, string>();
  for (const r of wanted) {
    const raw = result.object.hints.find((h) => h.code === r.code)?.hint.trim();
    if (raw) out.set(r.code, plainYour(repairTex(raw, r.criterion)));
  }
  return out;
}

/** One retry for a row still missing a command; a second miss fails the batch. */
async function checkedHints(q: Q, wanted: Row[]): Promise<Map<string, string>> {
  const hints = await hintsFor(q, wanted);
  const short = wanted.filter((r) => hints.has(r.code) && hintProblems(hints.get(r.code)!, r.criterion).length > 0);
  if (short.length) {
    const again = await hintsFor(q, short);
    for (const r of short) if (again.has(r.code)) hints.set(r.code, again.get(r.code)!);
  }
  for (const r of wanted) {
    const problems = hints.has(r.code) ? hintProblems(hints.get(r.code)!, r.criterion) : [];
    if (problems.length) throw new Error(`hint for ${r.code} "${hints.get(r.code)}" ${problems.join('; ')} (criterion "${r.criterion}")`);
  }
  return hints;
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
    const q = await Question.findById(qid).select('stem worked_solution').lean<Q | null>();
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

async function main() {
  const n = Number(process.argv[2]);
  if (!Number.isInteger(n) || n < 1) throw new Error('usage: pnpm hints:generate <batch-number> [--redo-tex | --redo-all]');
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
    .lean<(Q & { _id: unknown; parts?: never[]; rubric?: { code: string; criterion: string; hint?: string }[] })[]>();

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
