// EVERY COMPARISON THE MARKER ACTUALLY MAKES, recorded and compared with what
// it made last time. Run: pnpm verdicts (check) or pnpm verdicts:update.
//
// The comparator is changed a great deal and each change is argued from the
// case in front of it. What none of those arguments can see is the answer that
// USED to be marked right and now is not — "20-29 min" became twenty minus
// twenty-nine and agreed with itself, so nothing in the suite or the sweep had
// a reason to object. This is the thing that objects: it replays the whole bank
// and every stored attempt through answersEquivalentAny and refuses a push
// where a verdict moved and the baseline was not updated to say so.
//
// Keys present on only one side are ignored. A student submitting an attempt
// adds one and a deleted attempt removes one, and neither is a code change.
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dbConnect, Attempt, Question } from '@/lib/db';
import { answersEquivalentAny } from '@/lib/grade/equivalence';
import { readInputShape } from '@/lib/grade/input-shape';
import { roundingOf } from '@/lib/grade/rounding';
import { splitStoredAnswer } from '@/lib/study/attempt-answers';
import { isEntryPoint } from './entry';

const BASELINE = 'scripts/verdicts.baseline.tsv';

/**
 * WHAT A STUDENT TYPED DOES NOT GO IN THE REPOSITORY. The bank's own answers
 * stay readable — they are ours, and a diff of them is the point — but the text
 * on the other side of an attempt comparison is a student's work, and the gate
 * only needs it to be the SAME text as last time.
 *
 * Not a secret: a short answer hashes to a value anyone can look up, and the
 * canonical is on the same line. It is not readable, which is what was asked
 * for, and it is stable, which is what the gate needs. The question and the
 * slot stay in the clear so a moved verdict says where to look.
 */
const typedByKey = new Map<string, string>();

function typedKey(answer: string): string {
  const key = createHash('sha256').update(answer).digest('hex').slice(0, 16);
  typedByKey.set(key, answer);
  return key;
}

/**
 * The hash is for the FILE, not for the person reading the failure. A regression
 * you cannot read is one you cannot act on, so the report puts the text back —
 * it is in memory from the run that just found it.
 */
function readable(line: string): string {
  return line.replace(/typed:([0-9a-f]{16})/, (whole, key: string) => {
    const typed = typedByKey.get(key);
    return typed === undefined ? whole : JSON.stringify(typed);
  });
}

interface Slot {
  ref: string;
  mode: string;
  answer?: string;
  accept?: string[];
  rounding: ReturnType<typeof roundingOf>;
}

function slotsOf(q: { parts?: unknown[] }): Slot[] {
  return (q.parts ?? []).flatMap((part) => {
    const p = part as { label: string; prompt?: string; slots?: Record<string, unknown>[] };
    return (p.slots ?? []).map((s) => ({
      ref: `${p.label}.${s.label as string}`,
      mode: (s.response_mode as string) ?? 'answer',
      answer: s.answer as string | undefined,
      accept: s.accept as string[] | undefined,
      rounding: roundingOf({
        answer_format: s.answer_format as string,
        prompts: [p.prompt, s.prompt as string],
        canonical: s.answer as string,
      }),
    }));
  });
}

/** One line per comparison: what was compared, against what, and the verdict. */
export async function verdicts(): Promise<string[]> {
  await dbConnect();
  const out: string[] = [];
  const questions = await Question.find({}).select('parts kind status').lean<Record<string, unknown>[]>();
  const byId = new Map(questions.map((q) => [String(q._id), q]));

  for (const q of questions) {
    if (q.status !== 'approved') continue;
    for (const s of slotsOf(q)) {
      if (!s.answer || s.mode !== 'answer') continue;
      // AND WHAT THE COMPARATOR MAKES OF EACH VALUE, not only what it decides
      // about a pair. A verdict moving is the loud failure; a value being READ
      // differently is the quiet one, and the quiet one came first every time.
      // "20-29 min" became twenty minus twenty-nine — a quantity of -9 minutes
      // — and still agreed with "20-29 minutes", which was also -9. No verdict
      // moved. The shape did.
      for (const v of [s.answer, ...(s.accept ?? [])]) {
        out.push(`reading\t${String(q._id).slice(-6)}\t${s.ref}\t${JSON.stringify(v)}\t${readInputShape(v).shape}`);
      }
      for (const alt of s.accept ?? []) {
        const ok = answersEquivalentAny(alt, s.answer, undefined, s.rounding);
        out.push(`accept\t${String(q._id).slice(-6)}\t${s.ref}\t${JSON.stringify(alt)}\t${JSON.stringify(s.answer)}\t${ok}`);
      }
    }
  }

  const attempts = await Attempt.find({}).select('question_id answer').lean<Record<string, unknown>[]>();
  for (const a of attempts) {
    const q = byId.get(String(a.question_id));
    if (!q || q.kind === 'mcq') continue;
    const all = slotsOf(q);
    // EVERY ref, then filter. splitStoredAnswer cuts the stored string at the
    // refs it is handed, so leaving an explain slot out of the list glues its
    // text to the answer slot before it.
    const typed = splitStoredAnswer(String(a.answer), all.map((s) => s.ref));
    for (const s of all) {
      if (s.mode !== 'answer' || !s.answer) continue;
      const v = typed[s.ref] ?? '';
      if (v === '') continue;
      const ok = answersEquivalentAny(v, s.answer, s.accept, s.rounding);
      out.push(`attempt\t${String(q._id).slice(-6)}\t${s.ref}\ttyped:${typedKey(v)}\t${JSON.stringify(s.answer)}\t${ok}`);
    }
  }
  // Two students typing the same answer to the same slot is the same
  // comparison, and one line is what it is worth in a diff.
  return [...new Set(out)].sort();
}

const verdictOf = (line: string) => line.slice(line.lastIndexOf('\t') + 1);
const keyOf = (line: string) => line.slice(0, line.lastIndexOf('\t'));

async function main(): Promise<void> {
  const live = await verdicts();
  if (process.argv.includes('--update')) {
    writeFileSync(BASELINE, `${live.join('\n')}\n`);
    console.log(`wrote ${live.length} comparisons to ${BASELINE}`);
    process.exit(0);
  }

  let baseline: string[];
  try {
    baseline = readFileSync(BASELINE, 'utf8').split('\n').filter(Boolean);
  } catch {
    console.error(`no ${BASELINE} — run: pnpm verdicts:update`);
    process.exit(1);
  }
  const was = new Map(baseline.map((l) => [keyOf(l), verdictOf(l)]));

  const regressed: string[] = [];
  const improved: string[] = [];
  const reread: string[] = [];
  for (const line of live) {
    const before = was.get(keyOf(line));
    if (before === undefined || before === verdictOf(line)) continue;
    if (line.startsWith('reading\t')) reread.push(`${line}  (was ${before})`);
    else (before === 'true' ? regressed : improved).push(line);
  }

  if (regressed.length > 0) {
    console.error(`\n${regressed.length} VERDICT${regressed.length > 1 ? 'S' : ''} MOVED TRUE TO FALSE:\n`);
    for (const l of regressed) console.error(`  ${readable(l).split('\t').slice(0, 5).join('  ')}`);
  }
  if (improved.length > 0) {
    console.error(`\n${improved.length} moved false to true:\n`);
    for (const l of improved) console.error(`  ${readable(l).split('\t').slice(0, 5).join('  ')}`);
  }
  if (reread.length > 0) {
    console.error(`\n${reread.length} value${reread.length > 1 ? 's are' : ' is'} now read as a different shape:\n`);
    for (const l of reread) console.error(`  ${readable(l).split('\t').slice(1).join('  ')}`);
  }
  if (regressed.length + improved.length + reread.length > 0) {
    console.error(`\nEvery one of these is an answer the marker now reads differently.`);
    console.error(`Say why in the commit, then: pnpm verdicts:update`);
    process.exit(1);
  }
  console.log(`verdicts unchanged (${live.length} comparisons, ${was.size} in the baseline)`);
  process.exit(0);
}

if (isEntryPoint(import.meta.url)) {
  void main();
}
