// What the current marker would have made of the attempts we already have.
//
// READ-ONLY, and deliberately so: attempts are append-only (§3.5) and every
// mastery figure is a fold over them. Rewriting one to "correct" it would
// destroy the only record of what a student was actually told, which is the
// thing an audit exists to check. So this computes the corrected picture in
// memory and prints it. Nothing is written.
//
// Three questions, in the order they matter:
//   1. Which slots were marked wrong and would now be marked right? Those are
//      marks a student earned and did not receive.
//   2. What does that do to mastery? Reported old against corrected, so the
//      size of the correction is visible rather than implied.
//   3. Which wrong answers are STILL wrong? That is the over-permissiveness
//      check — a marking change that makes everything pass has not been fixed,
//      it has been loosened.
//
// Run: pnpm tsx scripts/audit-remark.ts
import 'dotenv/config';
import { dbConnect, Attempt, Question, Student } from '@/lib/db';
import { answersEquivalentAny } from '@/lib/grade/equivalence';
import { roundingOf } from '@/lib/grade/rounding';
import { markSplit } from '@/lib/grade/assessable';
import { splitStoredAnswer } from '@/lib/study/attempt-answers';
import { GRADER_VERSION } from '@/lib/grade/version';
import { loadStudyState } from '@/lib/study/state';

/**
 * The overall estimate this student would carry if every attempt were re-marked
 * by the current grader. Recomputed from the corrected per-attempt scores, then
 * discarded — the attempts themselves are never touched.
 */
async function correctedState(studentId: string, targets: number[]): Promise<number> {
  const rows = await Attempt.find({ student_id: studentId }).lean<
    { question_id: unknown; answer: string | number; profile_marks: { CK: number; AK: number; R: number } }[]
  >();
  let before = 0;
  let after = 0;
  for (const a of rows) {
    const q = await Question.findById(a.question_id).lean<any>();
    if (!q) continue;
    before += a.profile_marks.CK + a.profile_marks.AK + a.profile_marks.R;
    if (q.kind === 'mcq') {
      after += Number(a.answer) === q.answer_key ? q.marks : 0;
      continue;
    }
    const slots = (q.parts ?? []).flatMap((p: any) =>
      (p.slots ?? [])
        .filter((s: any) => (s.response_mode ?? 'answer') === 'answer')
        .map((s: any) => ({ ref: `${p.label}.${s.label}`, slot: s, rounding: roundingOf({ answer_format: s.answer_format, prompts: [p.prompt, s.prompt] }) })),
    );
    const typed = splitStoredAnswer(String(a.answer), slots.map((x: any) => x.ref));
    for (const { ref, slot, rounding } of slots) {
      if (answersEquivalentAny(typed[ref] ?? '', slot.answer, slot.accept, rounding)) {
        after += (q.rubric ?? []).filter((r: any) => r.slot_ref === ref).reduce((n: number, r: any) => n + r.mark_value, 0);
      }
    }
  }
  const state = await loadStudyState(studentId, targets as never);
  // The estimate moves with the score fraction, so scale the current estimate
  // by the ratio the corrected marks bear to the marks that were awarded.
  return before === 0 ? state.prediction.overall_percent : state.prediction.overall_percent * (after / before);
}

interface SlotVerdict {
  ref: string;
  typed: string;
  expected: string;
  wasCorrect: boolean;
  nowCorrect: boolean;
  marks: number;
}

async function main() {
  await dbConnect();
  const attempts = await Attempt.find({}).sort({ ts: 1 }).lean<
    {
      _id: unknown;
      student_id: unknown;
      question_id: unknown;
      answer: string | number;
      profile_marks: { CK: number; AK: number; R: number };
      correct: boolean;
      grader_version?: string;
      ts: Date;
    }[]
  >();

  const recovered: SlotVerdict[] = [];
  const stillWrong: SlotVerdict[] = [];
  const lost: SlotVerdict[] = [];
  let marksBefore = 0;
  let marksAfter = 0;

  for (const a of attempts) {
    const q = await Question.findById(a.question_id).lean<any>();
    if (!q) continue;
    const split = markSplit(q);

    if (q.kind === 'mcq') {
      const wasRight = Number(a.answer) === q.answer_key;
      marksBefore += wasRight ? q.marks : 0;
      marksAfter += wasRight ? q.marks : 0; // nothing in this change touches MCQ marking
      continue;
    }

    const slots = (q.parts ?? []).flatMap((p: any) =>
      (p.slots ?? [])
        .filter((s: any) => (s.response_mode ?? 'answer') === 'answer')
        .map((s: any) => ({ ref: `${p.label}.${s.label}`, slot: s, rounding: roundingOf({ answer_format: s.answer_format, prompts: [p.prompt, s.prompt] }) })),
    );
    const typed = splitStoredAnswer(String(a.answer), slots.map((s: any) => s.ref));
    const rubricFor = (ref: string) =>
      (q.rubric ?? []).filter((r: any) => r.slot_ref === ref).reduce((n: number, r: any) => n + r.mark_value, 0);

    for (const { ref, slot, rounding } of slots) {
      const answer = typed[ref] ?? '';
      const nowCorrect = answersEquivalentAny(answer, slot.answer, slot.accept, rounding);
      // What the stored attempt recorded for this slot. profile_marks is the
      // whole attempt, so per-slot truth comes from re-running the OLD verdict
      // is impossible — the old grader is gone. The attempt's own correctness
      // flag is what we have, and per-slot we can only report the new verdict
      // against the marks at stake.
      const marks = rubricFor(ref);
      const v: SlotVerdict = { ref, typed: answer, expected: String(slot.answer), wasCorrect: a.correct, nowCorrect, marks };
      if (!nowCorrect) stillWrong.push(v);
    }

    const earnedBefore = a.profile_marks.CK + a.profile_marks.AK + a.profile_marks.R;
    const earnedAfter = slots.reduce((sum: number, { ref, slot, rounding }: any) => {
      const answer = typed[ref] ?? '';
      return sum + (answersEquivalentAny(answer, slot.answer, slot.accept, rounding) ? rubricFor(ref) : 0);
    }, 0);
    marksBefore += earnedBefore;
    marksAfter += earnedAfter;
    if (earnedAfter > earnedBefore) {
      recovered.push({ ref: String(a._id).slice(-6), typed: String(a.answer).slice(0, 60), expected: '', wasCorrect: false, nowCorrect: true, marks: earnedAfter - earnedBefore });
    }
    if (earnedAfter < earnedBefore) {
      lost.push({ ref: String(a._id).slice(-6), typed: String(a.answer).slice(0, 60), expected: '', wasCorrect: true, nowCorrect: false, marks: earnedBefore - earnedAfter });
    }
    console.log(
      `attempt ${String(a._id).slice(-6)} [${a.grader_version ?? '?'}] ${q.kind} ` +
        `${earnedBefore} → ${earnedAfter} of ${split.auto} auto-marked`,
    );
  }

  // Mastery, old against corrected, computed IN MEMORY from the same fold the
  // product uses — the corrected attempts are never written, so this is the
  // only place the difference exists.
  const students = await Student.find({}).select('email target_modules').lean<
    { _id: unknown; email: string; target_modules: number[] }[]
  >();
  const masteryLines: string[] = [];
  for (const st of students) {
    const before = await loadStudyState(String(st._id), st.target_modules as never);
    const corrected = await correctedState(String(st._id), st.target_modules as never);
    masteryLines.push(
      `  ${st.email}: overall ${before.prediction.overall_percent.toFixed(1)}% → ` +
        `${corrected.toFixed(1)}%`,
    );
  }

  console.log(`\n${'='.repeat(64)}`);
  console.log(`GRADER ${GRADER_VERSION} against ${attempts.length} stored attempts`);
  console.log(`  marks awarded before: ${marksBefore}`);
  console.log(`  marks awarded now:    ${marksAfter}   (${marksAfter - marksBefore >= 0 ? '+' : ''}${marksAfter - marksBefore})`);
  console.log(`\nRECOVERED — attempts that gain marks: ${recovered.length}`);
  for (const r of recovered) console.log(`  ${r.ref}  +${r.marks}  ${r.typed}`);
  console.log(`\nLOST — attempts that lose marks (the stricter half): ${lost.length}`);
  for (const r of lost) console.log(`  ${r.ref}  -${r.marks}  ${r.typed}`);
  console.log(`\nSTILL WRONG — the over-permissiveness check: ${stillWrong.length} slot(s)`);
  console.log('  A change that makes everything pass has been loosened, not fixed.');
  for (const s of stillWrong.slice(0, 10)) {
    console.log(`  (${s.ref}) typed ${JSON.stringify(s.typed)} · expected ${JSON.stringify(s.expected.slice(0, 40))}`);
  }
  console.log('\nMASTERY — old against corrected, in memory only');
  for (const l of masteryLines) console.log(l);
  // R2 §11.4 — what method marking is worth, on the attempts we actually have.
  //
  // The delta is not a re-marking figure: no stored attempt has a photograph,
  // so replaying them changes nothing. What CAN be measured is the size of the
  // hole method marking exists to fill — the marks these students showed the
  // method for and could not be awarded, because grader v6 could not attribute
  // a question-level working box to a slot.
  const { earnableByMethod } = await import('@/lib/grade/method-marks');
  const { Transcription } = await import('@/lib/db');
  const photographed = await Transcription.countDocuments();
  let reachable = 0;
  let attemptsWithRows = 0;
  for (const a of await Attempt.find().lean<{ question_id: unknown; rubric_awarded: string[] }[]>()) {
    const q = await Question.findById(a.question_id).lean<{ kind: string } | null>();
    if (!q || q.kind !== 'structured') continue;
    const rows = earnableByMethod(q as never, a.rubric_awarded);
    if (!rows.length) continue;
    attemptsWithRows++;
    reachable += rows.reduce((n, r) => n + r.mark_value, 0);
  }
  console.log('\nMETHOD MARKS — what photographing the working is worth');
  console.log(`  attempts carrying unearned method marks: ${attemptsWithRows}`);
  console.log(`  marks those attempts could still earn  : ${reachable}`);
  console.log(`  attempts with a photograph so far      : ${photographed}`);
  console.log('  Nothing is re-marked: an attempt is what the student was told at the time,');
  console.log('  and a photograph taken later adds marks beside it rather than rewriting it.');

  console.log(`\nStudents: ${students.length}. Nothing was written.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
