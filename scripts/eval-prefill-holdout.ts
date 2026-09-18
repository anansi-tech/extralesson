// THE PREFILL HOLDOUT: what the reader suggested for each box, against what a
// person said belonged in it. Run: pnpm eval:holdout
//
// Not scripts/eval-prefill.ts, which is a different question and a different
// bill: that one re-runs the READER against stored photographs, several times
// over, to see how much its answer moves between runs. This one calls no model
// and costs nothing — it scores suggestions already stored — which is why it
// can sit in the push gate and that one cannot.
//
// The labels in design/research/prefill-holdout-labels.md are hand-written from
// the photographed pages, not from the answer key: they say what the STUDENT
// wrote, so a read that "corrects" a wrong answer fails here rather than
// looking right. Nothing in this file consults the answer key either.
//
// Four verdicts per labelled slot:
//   match      the boxes hold exactly what was written
//   rewritten  a different spelling of the same value — 40 <= m < 50 for 40 ≤ m < 50
//   wrong      a value that is not the one on the page
//   missing    nothing offered for a box that had something in it
//
// Rewritten is REPORTED, NOT FAILED, until there is enough of it to say whether
// a student would object to the rewriting. The bar is the other two.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dbConnect, Student, Question, Transcription, PracticeSession } from '@/lib/db';
import { structuredPrefill } from '@/lib/grade/prefill';
import { isMultiValue, readInputShape } from '@/lib/grade/input-shape';
import { answersEquivalentAny } from '@/lib/grade/equivalence';
import { isEntryPoint } from './entry';

const LABELS = join(process.cwd(), 'design', 'research', 'prefill-holdout-labels.md');
/**
 * The account the holdout was sat on, named in the labels file beside the
 * labels themselves: one file describes the whole holdout, and an address
 * written into scripts/ would be a second address in a tree that allows one.
 */
function holdoutAccount(text: string): string {
  const named = /^#\s*account:\s*(\S+)\s*$/m.exec(text);
  if (!named) throw new Error(`${LABELS} names no "# account:" to read the holdout from`);
  return named[1];
}
/** A slot answered on paper: the label says so, and no box may be offered. */
const PAPER = '(paper)';
const MAX_MISSING = 1;

export type Verdict = 'match' | 'rewritten' | 'wrong' | 'missing';
interface Label { short: string; ref: string; want: string[] | null }

/** "037c66 · d.i · 23" — the commentary in brackets is for the reader, not the parser. */
export function parseLabels(text: string): { short: string; slot: string; value: string }[] {
  const out: { short: string; slot: string; value: string }[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [short, slot, ...rest] = line.split('·').map((s) => s.trim());
    if (!short || !slot || !rest.length) continue;
    out.push({ short, slot, value: rest.join('·').trim() });
  }
  return out;
}

/** A label's slot name against the bank's own: exact, else the nth slot of the part. */
const POSITION: Record<string, number> = { i: 0, ii: 1, iii: 2, iv: 3, v: 4 };
export function resolve(parts: { label: string; slots: { label: string }[] }[], slot: string): string | null {
  const [partLabel, slotLabel] = slot.includes('.') ? slot.split('.') : [slot, null];
  const part = parts.find((p) => p.label === partLabel);
  if (!part) return null;
  if (!slotLabel) return part.slots.length === 1 ? `${part.label}.${part.slots[0].label}` : null;
  const exact = part.slots.find((s) => s.label === slotLabel);
  if (exact) return `${part.label}.${exact.label}`;
  const nth = part.slots[POSITION[slotLabel] ?? -1];
  return nth ? `${part.label}.${nth.label}` : null;
}

/**
 * One line's boxes. "9 ; 2" is two boxes of one slot; "d.i · 10 ; d.ii · not
 * parallel" is two slots. A ref that resolves to nothing is not a slot at all —
 * "b.i · 9 ; b.ii · 2" on a part with one column-vector slot — so it is the
 * next box of the slot before it.
 */
export function boxes(value: string, parts: { label: string; slots: { label: string }[] }[]) {
  // Only PROSE in brackets is commentary. A trailing bracket with no space and
  // no word in it is part of the answer: stripping it turned the label
  // (3x/(4pi))^(1/3) into (3x/(4pi))^ and failed a read that was right.
  const clean = value.replace(/\s*\((?=[^()]*\s)(?=[^()]*[A-Za-z]{2})[^()]*\)\s*$/, '').trim();
  if (clean === PAPER || clean.startsWith(PAPER)) return { paper: true, groups: [] as { ref: string | null; values: string[] }[] };
  const groups: { ref: string | null; values: string[] }[] = [{ ref: null, values: [] }];
  for (const piece of clean.split(';').map((s) => s.trim()).filter(Boolean)) {
    const named = /^([a-z]+(?:\.[a-z0-9_]+)?)\s*·\s*(.+)$/i.exec(piece);
    const ref = named ? resolve(parts, named[1]) : null;
    if (named && ref) groups.push({ ref, values: [named[2].trim()] });
    else groups[groups.length - 1].values.push(named ? named[2].trim() : piece);
  }
  return { paper: false, groups: groups.filter((g) => g.values.length) };
}

/**
 * The boxes a label means. Most say them outright — "4 ; -2" is two boxes. A
 * slot that takes several values may instead be labelled as the whole answer,
 * "{1, 2, 3, 6}", and its boxes are its members. Splitting that is the one
 * thing here the bank's own code decides rather than the person who wrote the
 * label, so it is used ONLY on a one-box label for a many-box slot, and never
 * to re-split a label that already said what each box holds.
 */
export function wanted(target: Label, parts: { label: string; slots: { label: string; answer?: string }[] }[]): string[] | null {
  if (target.want === null || target.want.length !== 1) return target.want;
  const slot = parts.flatMap((p) => p.slots.map((s) => [`${p.label}.${s.label}`, s] as const)).find(([ref]) => ref === target.ref)?.[1];
  if (!slot?.answer || !isMultiValue(readInputShape(slot.answer).shape)) return target.want;
  const split = readInputShape(target.want[0]).values;
  return split.length > 1 ? split : target.want;
}

export function verdictFor(want: string[] | null, got: string[]): Verdict {
  if (want === null) return got.length ? 'wrong' : 'match';
  if (!got.length) return 'missing';
  if (got.length !== want.length) return 'wrong';
  if (got.every((g, i) => g.trim() === want[i].trim())) return 'match';
  return got.every((g, i) => answersEquivalentAny(g, want[i])) ? 'rewritten' : 'wrong';
}

export async function evalPrefill() {
  await dbConnect();
  const text = readFileSync(LABELS, 'utf8');
  const account = holdoutAccount(text);
  const student = await Student.findOne({ email: account }).select('_id').lean<{ _id: unknown } | null>();
  if (!student) throw new Error(`no holdout account ${account}`);
  const sessions = await PracticeSession.find({ student_id: student._id })
    .select('_id question_ids').lean<{ _id: unknown; question_ids: unknown[] }[]>();

  const rows: { short: string; ref: string; verdict: Verdict; want: string[] | null; got: string[]; read: string[] }[] = [];
  const unresolved: string[] = [];
  const noRead: string[] = [];

  const parsed = parseLabels(text);
  for (const short of [...new Set(parsed.map((l) => l.short))]) {
    const question = await Question.findOne({
      $expr: { $eq: [{ $substrCP: [{ $toString: '$_id' }, 18, 6] }, short] },
    }).select('parts').lean<{ parts?: { label: string; prompt: string; statement?: string; slots: { label: string; prompt?: string; answer?: string; response_mode?: string }[] }[] } | null>();
    if (!question?.parts) { unresolved.push(`${short}: not in the bank`); continue; }
    const parts = question.parts.map((p) => ({ ...p, slots: p.slots ?? [] }));

    const slots = sessions
      .filter((s) => s.question_ids.some((x) => String(x) === String((question as { _id?: unknown })._id)))
      .map((s) => ({ session_id: s._id, question_index: s.question_ids.findIndex((x) => String(x) === String((question as { _id?: unknown })._id)) }));
    const reads = slots.length
      ? await Transcription.find({ $or: slots }).sort({ take: 1 })
          .select('lines answers legible').lean<{ lines: { text: string }[]; answers?: { slot_ref: string; entries?: string[]; source_lines?: number[] }[]; legible: boolean }[]>()
      : [];
    const read = [...reads].reverse().find((r) => (r.answers ?? []).length > 0);
    if (!read) { noRead.push(short); continue; }

    const prefill = structuredPrefill(parts, { legible: read.legible, lines: read.lines, answers: read.answers ?? [] });
    const suggested = new Map((read.answers ?? []).map((a) => [a.slot_ref, a.entries ?? []]));

    for (const label of parsed.filter((l) => l.short === short)) {
      const parsedBoxes = boxes(label.value, parts);
      const targets: Label[] = parsedBoxes.paper
        ? [{ short, ref: resolve(parts, label.slot) ?? '', want: null }]
        : parsedBoxes.groups.map((g, i) => ({
            short,
            ref: (i === 0 ? resolve(parts, label.slot) : g.ref) ?? '',
            want: g.values,
          }));
      for (const t of targets) {
        if (!t.ref) { unresolved.push(`${short} · ${label.slot}: no slot in the bank`); continue; }
        const got = prefill.values[t.ref] ?? (prefill.answers[t.ref] ? [prefill.answers[t.ref]] : []);
        rows.push({ short, ref: t.ref, verdict: verdictFor(wanted(t, parts), got), want: wanted(t, parts), got, read: suggested.get(t.ref) ?? [] });
      }
    }
  }
  return { rows, unresolved, noRead };
}

async function main() {
  const { rows, unresolved, noRead } = await evalPrefill();
  const count = (v: Verdict) => rows.filter((r) => r.verdict === v).length;
  const paper = rows.filter((r) => r.want === null).length;

  for (const row of rows.filter((r) => r.verdict !== 'match')) {
    console.log(`${row.verdict.toUpperCase().padEnd(9)} ${row.short} · ${row.ref}`);
    console.log(`          page said : ${row.want === null ? PAPER : row.want.join(' ; ')}`);
    console.log(`          box got   : ${row.got.length ? row.got.join(' ; ') : '(nothing)'}`);
    if (!row.got.length && row.read.length) console.log(`          reader had: ${row.read.join(' ; ')} — dropped before the box`);
  }
  for (const u of unresolved) console.log(`UNRESOLVED ${u}`);
  for (const n of noRead) console.log(`NO READ   ${n}: nothing photographed on the holdout account`);

  console.log(
    `\n${rows.length} labelled slots over ${new Set(rows.map((r) => r.short)).size} questions: ` +
      `${count('match')} match (${paper} of them a slot answered on paper, where the right answer is no box at all), ` +
      `${count('wrong')} wrong, ${count('missing')} missing, ${count('rewritten')} rewritten.`,
  );

  const failures = [
    count('wrong') > 0 ? `${count('wrong')} wrong, and the bar is none` : '',
    count('missing') > MAX_MISSING ? `${count('missing')} missing, and the bar is at most ${MAX_MISSING}` : '',
    unresolved.length ? `${unresolved.length} label(s) naming no slot in the bank` : '',
    noRead.length ? `${noRead.length} labelled question(s) with no read to score` : '',
  ].filter(Boolean);
  if (failures.length) {
    console.error(`\nprefill holdout FAILED: ${failures.join('; ')}`);
    process.exit(1);
  }
  console.log('prefill holdout passes.');
  process.exit(0);
}

if (isEntryPoint(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
