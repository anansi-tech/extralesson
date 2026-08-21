// SESSIONS THE MODE BACKFILL COULD NOT SEE.
//
// `mode` was added to PracticeSession after the diagnostic already existed, and
// its backfill set every session without the field to 'adaptive' — which was
// right for the twenty-two before the modes shipped and wrong for the
// diagnostics started in between. Those sessions would finish on the ordinary
// summary instead of the ranking they were run to produce.
//
// The signature is unambiguous on this data: an adaptive session for these
// students is ONE structured question (a 12-mark Paper 2 question fills the
// budget), and only a diagnostic buys a handful of MCQs. So a session of more
// than one question, all of them MCQ, is a diagnostic. Verified before writing:
// no session predating the feature matches.
//
// Run: pnpm tsx scripts/repair-diagnostic-mode.ts [--apply]
import 'dotenv/config';
import { dbConnect, PracticeSession, Question } from '@/lib/db';

async function main() {
  const apply = process.argv.includes('--apply');
  await dbConnect();
  const sessions = await PracticeSession.find({ mode: 'adaptive' })
    .sort({ started_at: 1 })
    .lean<{ _id: unknown; question_ids: unknown[]; started_at: Date }[]>();

  let found = 0;
  for (const s of sessions) {
    if (s.question_ids.length < 2) continue;
    const kinds = await Question.find({ _id: { $in: s.question_ids } })
      .select('kind')
      .lean<{ kind: string }[]>();
    if (kinds.length === 0 || !kinds.every((q) => q.kind === 'mcq')) continue;

    found++;
    console.log(
      `${String(s._id).slice(-6)}  ${new Date(s.started_at).toISOString().slice(0, 16)}  ` +
        `${s.question_ids.length} MCQs  ->  diagnostic`,
    );
    if (apply) await PracticeSession.updateOne({ _id: s._id }, { $set: { mode: 'diagnostic' } });
  }

  console.log(`\n${found} session(s) ${apply ? 'relabelled' : 'would be relabelled (dry run)'}.`);
  process.exit(0);
}

main();
