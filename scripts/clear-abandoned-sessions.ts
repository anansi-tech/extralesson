// SESSIONS THAT WERE STARTED AND NEVER ANSWERED.
//
// Starting a session while one is open is allowed on purpose — sessions queue —
// but a run of failed submissions left several with no attempts against them at
// all. They are never completed, so openSession keeps offering the newest as
// "carry on with your session", and behind it sits the one before.
//
// Deleting these is lossless and provably so: every mastery and progress figure
// is a fold over ATTEMPTS, and a session with no attempts contributes nothing to
// any of them. Sessions with even one attempt are left alone.
//
// Run: pnpm tsx scripts/clear-abandoned-sessions.ts [--apply]
import 'dotenv/config';
import { dbConnect, Attempt, PracticeSession, Student } from '@/lib/db';

async function main() {
  const apply = process.argv.includes('--apply');
  await dbConnect();
  const students = await Student.find().lean<{ _id: unknown; email: string }[]>();

  let total = 0;
  for (const student of students) {
    const open = await PracticeSession.find({ student_id: student._id, completed_at: null })
      .sort({ started_at: -1 })
      .lean<{ _id: unknown; started_at: Date; mode?: string; question_ids: unknown[] }[]>();

    for (const s of open) {
      const attempts = await Attempt.countDocuments({ session_id: s._id });
      if (attempts > 0) continue;
      total++;
      console.log(
        `${student.email}  ${String(s._id).slice(-6)}  ` +
          `${new Date(s.started_at).toISOString().slice(0, 16)}  ` +
          `${s.mode ?? 'adaptive'}  0 of ${s.question_ids.length} answered`,
      );
      if (apply) await PracticeSession.deleteOne({ _id: s._id });
    }
  }

  console.log(`\n${total} abandoned session(s) ${apply ? 'deleted' : 'would be deleted (dry run)'}.`);
  process.exit(0);
}

main();
