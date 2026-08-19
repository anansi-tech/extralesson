// Relabel difficulty-3 questions that are not integrated.
//
// Difficulty 3 now means integration — one topic, several objectives chained
// through one scenario — because that is the hardest class the papers set and
// the bank had almost none of it. By that definition 52 of the 55 questions
// wearing a d3 tag are d2-shaped: they carry a single objective.
//
// They are not bad questions. Every one meets the difficulty-2 demand as the
// prompt states it — two or more dependent operations across two or more parts
// — and every one has been reviewed and approved. Retiring them would discard
// that review to fix a label, so the label is what changes.
//
// Previews by default; --yes applies.
// Run: pnpm tsx scripts/relabel-d3-to-d2.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { chainDepth } from '@/lib/targets/difficulty';

async function main() {
  const apply = process.argv.includes('--yes');
  await dbConnect();
  const qs = await Question.find({
    kind: 'structured',
    difficulty: 3,
    status: { $in: ['draft', 'approved'] },
  }).lean<any[]>();

  const relabel: unknown[] = [];
  const retire: { id: unknown; why: string }[] = [];

  for (const q of qs) {
    const objectives = new Set(
      (q.parts ?? []).flatMap((p: any) => (p.slots ?? []).map((s: any) => s.objective_id).filter(Boolean)),
    ).size;
    if (objectives >= 3) continue; // genuinely integrated, leave alone

    const depth = chainDepth(q);
    const parts = (q.parts ?? []).length;
    if (depth >= 2 && parts >= 2) relabel.push(q._id);
    else retire.push({ id: q._id, why: `chain depth ${depth}, ${parts} part(s) — below the d2 demand too` });
  }

  console.log(`${qs.length} difficulty-3 questions`);
  console.log(`  relabel to d2 : ${relabel.length}`);
  console.log(`  retire        : ${retire.length}`);
  for (const r of retire.slice(0, 10)) console.log(`     ${String(r.id).slice(-6)} — ${r.why}`);

  if (!apply) {
    console.log('\npreview only — re-run with --yes');
    process.exit(0);
  }
  if (relabel.length) {
    const res = await Question.updateMany({ _id: { $in: relabel } }, { $set: { difficulty: 2 } });
    console.log(`\nrelabelled ${res.modifiedCount}`);
  }
  if (retire.length) {
    const res = await Question.updateMany(
      { _id: { $in: retire.map((r) => r.id) } },
      { $set: { status: 'retired', reject_reason: 'below-d2-demand' } },
    );
    console.log(`retired ${res.modifiedCount}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
