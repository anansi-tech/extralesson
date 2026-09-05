// Wipe the generated question bank and start clean.
//
// Deletes: questions (every status), practice sessions and attempts that
// reference them. Keeps: topics and blueprints (seeded from the syllabus —
// ground truth, not generated) and student accounts.
//
// Requires --yes, so it can never run by accident.
// Run: npx tsx scripts/reset-question-bank.ts --yes
import 'dotenv/config';
import { dbConnect, Attempt, PracticeSession, Question, Student, Topic, Blueprint } from '@/lib/db';

async function main() {
  await dbConnect();

  const [questions, sessions, attempts, students, topics, blueprints] = await Promise.all([
    Question.countDocuments(),
    PracticeSession.countDocuments(),
    Attempt.countDocuments(),
    Student.countDocuments(),
    Topic.countDocuments(),
    Blueprint.countDocuments(),
  ]);

  console.log('WILL DELETE:');
  console.log(`  questions         ${questions}`);
  console.log(`  practice sessions ${sessions}`);
  console.log(`  attempts          ${attempts}`);
  console.log('KEEPS:');
  console.log(`  topics            ${topics}`);
  console.log(`  blueprints        ${blueprints}`);
  console.log(`  students          ${students}`);

  if (!process.argv.includes('--yes')) {
    console.log('\nDry run. Re-run with --yes to delete.');
    process.exit(0);
  }

  await Promise.all([
    Question.deleteMany({}),
    PracticeSession.deleteMany({}),
    Attempt.deleteMany({}),
  ]);
  console.log('\nBank reset. Topics and blueprints intact; run pnpm generate to refill.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
