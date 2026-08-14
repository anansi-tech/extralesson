// One-off migration: normalize double-escaped newlines (literal "\n" text)
// in questions generated before normalizeEscapedNewlines existed.
// Idempotent — re-running changes nothing once strings are clean.
// Run: npx tsx scripts/fix-escaped-newlines.ts
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { normalizeEscapedNewlines } from '@/lib/text';

async function main() {
  await dbConnect();
  const questions = await Question.find({ status: { $ne: 'retired' } });
  let changed = 0;
  for (const q of questions) {
    const before = JSON.stringify([q.stem, q.worked_solution]);
    q.stem = normalizeEscapedNewlines(q.stem);
    q.worked_solution = normalizeEscapedNewlines(q.worked_solution);
    q.misconceptions = q.misconceptions.map(
      (m: { trigger: string; name: string; remediation: string }) => ({
        ...m,
        remediation: normalizeEscapedNewlines(m.remediation),
      }),
    );
    if (q.rubric?.length) {
      q.rubric = q.rubric.map(
        (r: { code: string; profile: string; criterion: string; mark_value: number }) => ({
          ...r,
          criterion: normalizeEscapedNewlines(r.criterion),
        }),
      );
    }
    if (before !== JSON.stringify([q.stem, q.worked_solution]) || q.isModified()) {
      await q.save();
      changed++;
    }
  }
  console.log(`Normalized ${changed} of ${questions.length} questions.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
