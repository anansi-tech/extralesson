// THE PRODUCTION PATH, END TO END (ROUND_6 Task 7): photo -> readWorking ->
// markWorking, exactly as a student's page travels, on committed pages with
// approved verdicts. Reported apart from the isolated marker score, because
// the isolated score marks golden TRANSCRIPTS and this marks what the reader
// actually produced. Writes only to a throwaway student it creates and
// deletes. Run: pnpm tsx scripts/eval-pipeline.ts [pages]
import 'dotenv/config';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { goldenSetExists, loadGoldenSet } from './golden-set';
import { provenance, writeResults } from './eval-provenance';
import { dbConnect, Attempt, CapturedImage, PracticeSession, Question, Student, Transcription } from '@/lib/db';
import { attemptOutcome } from '@/lib/study/outcome';
import { markableSlots } from '@/lib/grade/mark';
import { supportedSlips } from '@/lib/grade/method-marks';

const GOLDEN = join(process.cwd(), 'design', 'golden');
const CASES = join(process.cwd(), 'calibration', 'reads');
const PAGES = Number(process.argv[2] ?? 5);

async function main() {
  if (!goldenSetExists()) {
    console.error('No golden set. The gate FAILS.');
    process.exit(1);
  }
  await dbConnect();
  const golden = loadGoldenSet();
  // The committed calibration case first, then committed golden photographs
  // with approved verdicts, up to PAGES.
  const cases = existsSync(join(CASES, 'cocoa-b1.json')) ? [JSON.parse(readFileSync(join(CASES, 'cocoa-b1.json'), 'utf8')) as { id: string; question_id: string }] : [];
  const pages = [
    ...cases.map((c) => ({ id: c.id, question_id: c.question_id, image: join(CASES, `${c.id}.jpg`), truth: null as null | { code: string; awarded: boolean }[] })),
    ...golden.inputs
      .filter((e) => e.mode === 'photo' && e.image && !e.image.startsWith('field/') && existsSync(join(GOLDEN, e.image)))
      .map((e) => ({ id: e.id, question_id: e.question_id, image: join(GOLDEN, e.image!), truth: golden.verdicts.get(e.id) ?? [] })),
  ].slice(0, PAGES);

  const student = await Student.create({
    email: `eval-${Date.now()}@extralesson.invalid`,
    name: 'Pipeline eval',
    exam_sitting: 'may-june-2027',
    syllabus_mode: 'modular-2027',
    target_modules: [1, 2, 3],
  });
  process.env.RUN_AS_STUDENT = `${String(student._id)}:${student.email}`;
  const { readWorking } = await import('@/app/study/session/[id]/capture');
  const { markWorking } = await import('@/app/study/session/[id]/mark-working');

  interface RowVerdict { code: string; cao: boolean; truth: boolean; got: boolean | null }
  interface SlipReport { part: string; quote: string; sentence: string; supported: boolean }
  const rows: { id: string; read: boolean; lines: number; rows: number; agree: number; cao_false: number; method_false: number; verdicts: RowVerdict[]; slips: SlipReport[]; earned: number; assessed: number; unassessed: number; note?: string }[] = [];
  try {
    for (const p of pages) {
      const q = await Question.findById(p.question_id).lean<any>();
      if (!q) {
        rows.push({ id: p.id, read: false, lines: 0, rows: 0, agree: 0, cao_false: 0, method_false: 0, verdicts: [], slips: [], earned: 0, assessed: 0, unassessed: 0, note: 'question not in the bank' });
        continue;
      }
      const session = await PracticeSession.create({ student_id: student._id, question_ids: [q._id], mode: 'adaptive' });
      const sessionId = String(session._id);
      const read = await readWorking({ sessionId, questionIndex: 0, contentType: 'image/jpeg', data: readFileSync(p.image).toString('base64') });
      if ('error' in read) {
        rows.push({ id: p.id, read: false, lines: 0, rows: 0, agree: 0, cao_false: 0, method_false: 0, verdicts: [], slips: [], earned: 0, assessed: 0, unassessed: 0, note: read.error });
        continue;
      }
      // The typed answers are the reader's own prefill: what a student who
      // trusts the read would hand in.
      const refs = markableSlots(q.parts ?? []);
      const answer = refs.map((r) => `(${r}) ${read.prefill[r] ?? ''}`).join('; ');
      const attempt = await Attempt.create({
        student_id: student._id,
        question_id: q._id,
        session_id: session._id,
        question_index: 0,
        answer,
        rubric_awarded: [],
        profile_marks: { CK: 0, AK: 0, R: 0 },
        correct: false,
        duration_ms: 0,
      });
      const marked = await markWorking(String(attempt._id));
      const reads = await Transcription.find({ attempt_id: attempt._id }).lean<any[]>();
      // Every stored slip must quote a line on the read; markWorking drops the
      // rest, so a stored unsupported slip is a defect in that guard.
      const slips: SlipReport[] = (marked?.slips ?? []).map((s) => ({ ...s, supported: supportedSlips([s], read.transcription.lines.map((l) => l.text)).length === 1 }));
      const outcome = attemptOutcome({ rubric_awarded: [] }, q, reads);
      const truth = p.truth ?? [];
      // Per row, as the marker eval counts them: a false award on a CAO row is
      // the hard failure; on a method row it is tracked.
      const verdicts: RowVerdict[] = truth.map((t) => {
        const criterion = (q.rubric ?? []).find((r: any) => r.code === t.code)?.criterion ?? '';
        const got = marked?.method.find((m) => m.code === t.code)?.awarded ?? null;
        return { code: t.code, cao: /\bCAO\b/.test(criterion), truth: t.awarded, got };
      });
      const agree = verdicts.filter((v) => v.got === v.truth).length;
      const cao_false = verdicts.filter((v) => v.cao && v.got === true && !v.truth).length;
      const method_false = verdicts.filter((v) => !v.cao && v.got === true && !v.truth).length;
      rows.push({
        id: p.id,
        read: true,
        lines: read.transcription.lines.length,
        rows: truth.length,
        agree,
        cao_false,
        method_false,
        verdicts,
        slips,
        earned: outcome.earned,
        assessed: outcome.assessed,
        unassessed: outcome.unassessedMarks,
        note: marked?.marked === false ? `marking failed: ${marked.failure}` : undefined,
      });
    }
  } finally {
    await Promise.all([
      Attempt.deleteMany({ student_id: student._id }),
      Transcription.deleteMany({ student_id: student._id }),
      CapturedImage.deleteMany({ student_id: student._id }),
      PracticeSession.deleteMany({ student_id: student._id }),
      Student.deleteOne({ _id: student._id }),
    ]);
  }

  console.log('PIPELINE — photo -> readWorking -> markWorking, per page (reported apart from the isolated marker score)');
  for (const r of rows) {
    console.log(`   ${r.id.padEnd(10)} ${r.read ? `read ${r.lines} lines` : 'NOT READ'} · marker agreed ${r.agree}/${r.rows} rows · false awards CAO ${r.cao_false} / method ${r.method_false} · fold ${r.earned}/${r.assessed}, ${r.unassessed} unassessed${r.note ? ` · ${r.note}` : ''}`);
    for (const v of r.verdicts.filter((v) => v.got === true && !v.truth)) console.log(`      false award on ${v.cao ? 'CAO' : 'method'} row ${r.id}/${v.code}`);
    for (const s of r.slips) console.log(`      slip (${s.part})${s.supported ? '' : ' UNSUPPORTED QUOTE'}: ${s.sentence}`);
  }
  const unsupported = rows.reduce((n, r) => n + r.slips.filter((s) => !s.supported).length, 0);
  const judged = rows.filter((r) => r.rows > 0);
  const agree = judged.reduce((s, r) => s + r.agree, 0);
  const of = judged.reduce((s, r) => s + r.rows, 0);
  const caoFalse = judged.reduce((s, r) => s + r.cao_false, 0);
  const methodFalse = judged.reduce((s, r) => s + r.method_false, 0);
  // The gate here is the PATH: every page read and marked through production
  // code. Agreement is reported and written, not gated — over 28 rows one
  // marker flip moves it 3.6 points, and the marker has its own bar.
  // A CAO false award is the one thing the production path may never do.
  const passes = rows.every((r) => r.read && !r.note) && caoFalse === 0 && unsupported === 0;
  const file = writeResults('eval-pipeline', { ...(await provenance()), pages: rows, agreement: of ? agree / of : null, cao_false: caoFalse, method_false: methodFalse, slips: rows.reduce((n, r) => n + r.slips.length, 0), unsupported_slips: unsupported, passes });
  console.log(`   ${passes ? 'PASS' : 'BELOW GATE'} — every page read and marked, CAO false awards 0, unsupported slips ${unsupported}. Agreement ${of ? `${agree}/${of}` : 'n/a'}, method false awards ${methodFalse}, reported apart from the marker gate. results: ${file}`);
  await mongoose.disconnect();
  process.exit(passes ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
