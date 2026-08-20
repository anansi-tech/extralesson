// Same-commit backfill for grader_version / question_fingerprint.
//
// Attempts written before the stamp existed are marked 'unstamped'. They are
// NOT given today's fingerprint: the question may have been edited since, and
// stamping them with the current one would assert that we know what was marked
// when we do not. An honest "unknown" is what makes the field trustworthy for
// every attempt that follows.
//
// Run: pnpm tsx scripts/backfill-grader-stamp.ts
import 'dotenv/config';
import { dbConnect, Attempt } from '@/lib/db';
import { GRADER_VERSION_UNKNOWN } from '@/lib/grade/version';

async function main() {
  await dbConnect();
  const res = await Attempt.updateMany(
    { grader_version: { $exists: false } },
    { $set: { grader_version: GRADER_VERSION_UNKNOWN } },
  );
  const total = await Attempt.countDocuments({});
  const stamped = await Attempt.countDocuments({ grader_version: { $exists: true } });
  console.log(`marked ${res.modifiedCount} attempt(s) as ${GRADER_VERSION_UNKNOWN}`);
  console.log(`attempts: ${total} · carrying a grader version: ${stamped}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
