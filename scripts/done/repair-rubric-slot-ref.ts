// Repair rubric rows that lost their slot_ref to an undeclared schema field.
//
// slot_ref has been required by the strict schema since R1.8 Part 1 and was
// never declared in the Mongoose schema, so every save stripped it. This is not
// a migration carrying an old convention forward — it repairs data our own bug
// damaged, and it can only run once because the bug is fixed.
//
// The link is recoverable exactly: each slot lists the rubric codes it earns,
// so the mapping survived in the other direction. A row whose code no slot
// claims cannot be repaired and is reported rather than guessed at.
//
// Previews by default; --yes applies.
// Run: pnpm tsx scripts/repair-rubric-slot-ref.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';

interface Lean {
  _id: unknown;
  stem: string;
  rubric?: { code: string; slot_ref?: string; part_label?: string }[];
  parts?: { label: string; slots?: { label: string; rubric_codes?: string[] }[] }[];
}

async function main() {
  const apply = process.argv.includes('--yes');
  await dbConnect();

  const qs = await Question.find({ kind: 'structured' }).lean<Lean[]>();
  let repaired = 0;
  let rowsFixed = 0;
  const orphans: string[] = [];

  for (const q of qs) {
    const rubric = q.rubric ?? [];
    if (rubric.length === 0 || rubric.every((r) => r.slot_ref)) continue;

    // code -> the slot that claims it
    const owner = new Map<string, string>();
    for (const part of q.parts ?? []) {
      for (const slot of part.slots ?? []) {
        for (const code of slot.rubric_codes ?? []) owner.set(code, `${part.label}.${slot.label}`);
      }
    }

    let changed = false;
    for (const row of rubric) {
      if (row.slot_ref) continue;
      const ref = owner.get(row.code);
      if (!ref) {
        orphans.push(`${String(q._id).slice(-6)} row ${row.code} is claimed by no slot`);
        continue;
      }
      row.slot_ref = ref;
      row.part_label = ref.split('.')[0];
      changed = true;
      rowsFixed++;
    }
    if (!changed) continue;
    repaired++;
    if (apply) await Question.updateOne({ _id: q._id }, { $set: { rubric } });
  }

  console.log(`${repaired} of ${qs.length} structured questions had rubric rows to repair (${rowsFixed} rows).`);
  if (orphans.length) {
    console.log(`\n${orphans.length} row(s) could not be repaired and were left alone:`);
    for (const o of orphans.slice(0, 20)) console.log(`  ${o}`);
  }
  console.log(apply ? 'applied' : 'preview only — re-run with --yes');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
