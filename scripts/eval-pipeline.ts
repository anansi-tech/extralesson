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

  const rows: { id: string; read: boolean; lines: number; rows: number; agree: number; earned: number; assessed: number; unassessed: number; note?: string }[] = [];
  try {
    for (const p of pages) {
      const q = await Question.findById(p.question_id).lean<any>();
      if (!q) {
        rows.push({ id: p.id, read: false, lines: 0, rows: 0, agree: 0, earned: 0, assessed: 0, unassessed: 0, note: 'question not in the bank' });
        continue;
      }
      const session = await PracticeSession.create({ student_id: student._id, question_ids: [q._id], mode: 'adaptive' });
      const sessionId = String(session._id);
      const read = await readWorking({ sessionId, questionIndex: 0, contentType: 'image/jpeg', data: readFileSync(p.image).toString('base64') });
      if ('error' in read) {
        rows.push({ id: p.id, read: false, lines: 0, rows: 0, agree: 0, earned: 0, assessed: 0, unassessed: 0, note: read.error });
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
      const outcome = attemptOutcome({ rubric_awarded: [] }, q, reads);
      const truth = p.truth ?? [];
      const agree = truth.filter((t) => marked?.method.find((m) => m.code === t.code)?.awarded === t.awarded).length;
      rows.push({
        id: p.id,
        read: true,
        lines: read.transcription.lines.length,
        rows: truth.length,
        agree,
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
    console.log(`   ${r.id.padEnd(10)} ${r.read ? `read ${r.lines} lines` : 'NOT READ'} · marker agreed ${r.agree}/${r.rows} rows · fold ${r.earned}/${r.assessed}, ${r.unassessed} unassessed${r.note ? ` · ${r.note}` : ''}`);
  }
  const judged = rows.filter((r) => r.rows > 0);
  const agree = judged.reduce((s, r) => s + r.agree, 0);
  const of = judged.reduce((s, r) => s + r.rows, 0);
  const passes = rows.every((r) => r.read && !r.note) && (of === 0 || agree / of >= 0.8);
  const file = writeResults('eval-pipeline', { ...(await provenance()), pages: rows, agreement: of ? agree / of : null, passes });
  console.log(`   ${passes ? 'PASS' : 'BELOW GATE'} — every page read and marked, agreement ${of ? `${agree}/${of}` : 'n/a'} (bar 80%). results: ${file}`);
  await mongoose.disconnect();
  process.exit(passes ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
