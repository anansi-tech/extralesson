// Metadata-only, idempotent cleanup for legacy draft visuals. Dry-run by
// default; --apply retires failing drafts without deleting their records.
import 'dotenv/config';
import { z } from 'zod';
import { dbConnect, Question } from '@/lib/db';
import { draftVisualAuditIssues } from '@/lib/generation/visual-audit';

const EnvZ = z.object({ MONGODB_URI: z.string().min(1) });
const ArgsZ = z.object({ apply: z.boolean() }).strict();

async function main() {
  EnvZ.parse(process.env);
  const args = ArgsZ.parse({ apply: process.argv.slice(2).includes('--apply') });
  await dbConnect();
  const drafts = await Question.find({ status: 'draft', visual: { $ne: null } })
    .select('_id objective_ids visual gen_meta.prompt_version')
    .lean<Array<{
      _id: unknown;
      objective_ids: string[];
      visual: unknown;
      gen_meta?: { prompt_version?: string };
    }>>();
  const failures = drafts.flatMap((draft) => {
    const issues = draftVisualAuditIssues(draft.visual);
    return issues.length === 0 ? [] : [{
      id: String(draft._id),
      objective_ids: draft.objective_ids,
      prompt_version: draft.gen_meta?.prompt_version ?? null,
      issues,
    }];
  });

  if (args.apply && failures.length > 0) {
    await Question.bulkWrite(failures.map((failure) => ({
      updateOne: {
        filter: { _id: failure.id, status: 'draft' },
        update: {
          $set: {
            status: 'retired',
            reject_reason: `legacy-visual-audit:${failure.issues.join(',')}`,
          },
        },
      },
    })));
  }

  console.log(JSON.stringify({
    mode: args.apply ? 'apply' : 'dry-run',
    audited_visual_drafts: drafts.length,
    failing_visual_drafts: failures.length,
    retired_visual_drafts: args.apply ? failures.length : 0,
    failures,
  }, null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'unknown failure');
  process.exit(1);
});
