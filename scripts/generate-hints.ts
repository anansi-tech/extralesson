// Writes design/hints/batch-N.json: a second-person hint for the next 200
// method rows without one, every row PROPOSED, and its table in
// design/hints/APPROVAL_LOG.md. Nothing touches the bank until approval.
// Run: pnpm hints:generate <batch-number>
import 'dotenv/config';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { generateObject } from 'ai';
import { model, MODEL_ID } from '@/lib/ai';
import { dbConnect, Question } from '@/lib/db';
import { earnableByMethod } from '@/lib/grade/method-marks';
import { MARK_SCHEME_CONVENTIONS } from '@/lib/prompts/mark-scheme';

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

async function main() {
  const n = Number(process.argv[2]);
  if (!Number.isInteger(n) || n < 1) throw new Error('usage: pnpm hints:generate <batch-number>');
  const file = join(DIR, `batch-${n}.json`);
  if (existsSync(file)) throw new Error(`${file} exists`);
  mkdirSync(DIR, { recursive: true });
  await dbConnect();

  const done = new Set<string>();
  for (let i = 1; i < n; i++) {
    const prev = join(DIR, `batch-${i}.json`);
    if (existsSync(prev)) for (const r of JSON.parse(readFileSync(prev, 'utf8')) as HintRow[]) done.add(`${r.question_id}/${r.code}`);
  }
  const questions = await Question.find({ status: 'approved', kind: 'structured' })
    .select('stem parts rubric worked_solution')
    .sort({ _id: 1 })
    .lean<{ _id: unknown; stem: string; parts?: never[]; rubric?: { code: string; criterion: string; hint?: string }[]; worked_solution: string }[]>();

  const rows: HintRow[] = [];
  for (const q of questions) {
    if (rows.length >= BATCH) break;
    const wanted = earnableByMethod(q as never, []).filter((r) => !r.hint && !done.has(`${String(q._id)}/${r.code}`));
    if (wanted.length === 0) continue;
    const result = await generateObject({
      model,
      schema: HintsZ,
      prompt:
        `You write ONE sentence per mark-scheme row for a CSEC Mathematics student who got that part wrong.\n` +
        `Second person, present tense, addressed to the student ("Find where the two lines cross — that's where the retained amounts are equal.").\n` +
        `Say what to DO, not what the scheme awards; never the words "mark", "criterion", "award", "their". No answer values.\n` +
        `Plain text with TeX only where the criterion has it.\n\n${MARK_SCHEME_CONVENTIONS}\n\n` +
        `QUESTION: ${q.stem}\n\nSOLUTION (for you, never quoted): ${q.worked_solution}\n\n` +
        `ROWS:\n${wanted.map((r) => `${r.code}: ${r.criterion}`).join('\n')}\n\nReturn one hint per row, by code.`,
    });
    const byCode = new Map(result.object.hints.map((h) => [h.code, h.hint.trim()]));
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

  const log = join(DIR, 'APPROVAL_LOG.md');
  const head = existsSync(log) ? readFileSync(log, 'utf8') : '# Hint approval log\n\nOne table per batch. A row is approved by setting its status in the batch file; `pnpm hints:approve <n>` writes approved hints to the bank.\n';
  const table =
    `\n## Batch ${n} — proposed (${rows.length} rows, ${MODEL_ID}, ${new Date().toISOString().slice(0, 10)})\n\n| # | question | code | criterion | hint |\n|---|---|---|---|---|\n` +
    rows.map((r, i) => `| ${i + 1} | ${r.question_id.slice(-6)} | ${r.code} | ${r.criterion.replace(/\|/g, '\\|')} | ${r.hint.replace(/\|/g, '\\|')} |`).join('\n') +
    '\n';
  writeFileSync(log, head + table);
  console.log(`${rows.length} hints proposed in ${file}; table appended to ${log}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
