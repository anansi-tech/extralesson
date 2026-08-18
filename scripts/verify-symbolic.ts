// Re-verify the bank by computation, not by asking a model twice.
//
// Reports what share of the bank is deterministically checkable and which
// questions fail. Previews by default; --yes retires the failures.
// Run: pnpm tsx scripts/verify-symbolic.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { checkQuestion } from '@/lib/grade/checkable';

async function main() {
  const apply = process.argv.includes('--yes');
  await dbConnect();
  const qs = await Question.find({ status: { $in: ['draft', 'approved'] } }).lean<any[]>();

  const byFamily = new Map<string, { checked: number; failed: number }>();
  const failures: { id: string; status: string; slot: string; family: string; reason: string }[] = [];
  let questionsWithAnyCheck = 0;
  let structured = 0;

  for (const q of qs) {
    if (q.kind !== 'structured') continue;
    structured++;
    const targets = checkQuestion(q).filter((t) => t.verdict.checked);
    if (targets.length === 0) continue;
    questionsWithAnyCheck++;
    for (const t of targets) {
      const fam = t.family.replace(/\s+[fghpq]{1,2}$/, '');
      const row = byFamily.get(fam) ?? { checked: 0, failed: 0 };
      row.checked++;
      const ok = (t.verdict as { ok?: boolean }).ok;
      if (ok === false) {
        row.failed++;
        failures.push({
          id: String(q._id),
          status: q.status,
          slot: t.slotRef,
          family: t.family,
          reason: (t.verdict as { reason: string }).reason,
        });
      }
      byFamily.set(fam, row);
    }
  }

  console.log(`structured live questions: ${structured}`);
  console.log(`deterministically checkable: ${questionsWithAnyCheck} (${Math.round((questionsWithAnyCheck / Math.max(1, structured)) * 100)}%)\n`);
  console.log('family                 checks  failed');
  for (const [fam, r] of [...byFamily].sort((a, b) => b[1].checked - a[1].checked)) {
    console.log(`  ${fam.padEnd(20)} ${String(r.checked).padStart(5)} ${String(r.failed).padStart(7)}`);
  }

  const ids = new Set(failures.map((f) => f.id));
  console.log(`\n${failures.length} failing checks across ${ids.size} questions`);
  for (const f of failures.slice(0, 12)) {
    console.log(`  ${f.id.slice(-6)} [${f.status}] ${f.slot} ${f.family}: ${f.reason.slice(0, 70)}`);
  }

  if (ids.size === 0 || !apply) {
    console.log(apply ? '\nnothing to retire' : '\npreview only — re-run with --yes to retire the failures');
    process.exit(0);
  }
  const res = await Question.updateMany(
    { _id: { $in: [...ids] } },
    { $set: { status: 'retired', reject_reason: 'symbolic-check-failed' } },
  );
  console.log(`\nretired ${res.modifiedCount}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
