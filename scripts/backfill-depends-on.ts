// Same-commit backfill for slot.depends_on (R1.8 follow-up).
//
// The field is declared by generation from now on. For questions already in the
// bank there is nothing to read but the wording, so the wording is used ONCE,
// here, and never again: a slot whose prompt says "hence" or "using your
// answer" is recorded as depending on the slot immediately before it.
//
// That under-counts, and deliberately so. It records only the dependencies the
// question announced, so a backfilled chain depth is a floor rather than a
// guess — and questions written before the field existed will read slightly
// flatter than they are, which is the honest direction to be wrong in.
//
// Previews by default; --yes applies. Idempotent.
// Run: pnpm tsx scripts/backfill-depends-on.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { chainDepth, dependsOnEarlier } from '@/lib/targets/difficulty';

interface Lean {
  _id: unknown;
  marks: number;
  parts?: { label: string; prompt: string; slots?: { label: string; prompt?: string; depends_on?: string[] }[] }[];
}

async function main() {
  const apply = process.argv.includes('--yes');
  await dbConnect();

  const qs = await Question.find({ kind: 'structured' }).select('marks parts').lean<Lean[]>();
  let touched = 0;
  let edges = 0;

  for (const q of qs) {
    const parts = q.parts ?? [];
    const refs = parts.flatMap((p) => (p.slots ?? []).map((s) => `${p.label}.${s.label}`));
    const texts = parts.flatMap((p) => (p.slots ?? []).map((s) => `${p.prompt} ${s.prompt ?? ''}`));

    let changed = false;
    let i = 0;
    for (const part of parts) {
      for (const slot of part.slots ?? []) {
        const wanted = i > 0 && dependsOnEarlier(texts[i]) ? [refs[i - 1]] : [];
        const current = slot.depends_on ?? [];
        if (wanted.join() !== current.join()) {
          slot.depends_on = wanted;
          changed = true;
          edges += wanted.length;
        }
        i++;
      }
    }
    if (!changed) continue;
    touched++;
    if (apply) await Question.updateOne({ _id: q._id }, { $set: { parts } });
  }

  const depths = qs.map((q) => chainDepth(q));
  const mean = depths.reduce((s, d) => s + d, 0) / Math.max(1, depths.length);
  console.log(`${qs.length} structured questions; ${touched} updated, ${edges} dependencies recorded.`);
  console.log(`chain depth after backfill: mean ${mean.toFixed(2)}, max ${Math.max(0, ...depths)}`);
  console.log(apply ? 'applied' : 'preview only — re-run with --yes');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
