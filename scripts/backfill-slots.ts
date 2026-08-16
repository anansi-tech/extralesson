// Same-commit backfill for R1.8 Part 1's slot primitive.
//
// Additive by construction: every existing part becomes a part with exactly one
// slot carrying its answer, and every rubric row gains a slot_ref pointing at
// it. Nothing is retired, nothing is rewritten, and every one of the approved
// questions stays valid and reviewable — which is the reason to make this
// change at 123 approved rather than at 400.
//
// Idempotent: a part that already has slots is left alone.
// Run: pnpm tsx scripts/backfill-slots.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';

interface LegacyPart {
  label: string;
  prompt: string;
  marks: number;
  answer?: string;
  accept?: string[];
  response_mode?: string;
  answer_format?: string;
  slots?: unknown[];
}

interface LegacyRubric {
  code: string;
  part_label?: string;
  slot_ref?: string;
}

async function main() {
  const apply = process.argv.includes('--yes');
  await dbConnect();

  const qs = await Question.find({ kind: 'structured' })
    .select('parts rubric status')
    .lean<{ _id: unknown; parts?: LegacyPart[]; rubric?: LegacyRubric[]; status: string }[]>();

  let parts = 0;
  let rows = 0;
  let touched = 0;

  for (const q of qs) {
    const needsParts = (q.parts ?? []).some((p) => !Array.isArray(p.slots) || p.slots.length === 0);
    const needsRows = (q.rubric ?? []).some((r) => !r.slot_ref);
    if (!needsParts && !needsRows) continue;
    touched++;

    const newParts = (q.parts ?? []).map((p) => {
      if (Array.isArray(p.slots) && p.slots.length > 0) return p;
      parts++;
      return {
        label: p.label,
        prompt: p.prompt,
        marks: p.marks,
        slots: [
          {
            label: 'i',
            answer: p.answer,
            accept: p.accept,
            response_mode: p.response_mode ?? 'answer',
            answer_format: p.answer_format,
            rubric_codes: (q.rubric ?? []).filter((r) => r.part_label === p.label).map((r) => r.code),
          },
        ],
      };
    });

    const newRubric = (q.rubric ?? []).map((r) => {
      if (r.slot_ref) return r;
      rows++;
      return { ...r, slot_ref: `${r.part_label ?? 'a'}.i` };
    });

    if (apply) {
      await Question.updateOne({ _id: q._id }, { $set: { parts: newParts, rubric: newRubric } });
    }
  }

  console.log(`${touched} question(s) to migrate: ${parts} part(s) lifted into single slots, ${rows} rubric row(s) pointed at them.`);
  console.log(apply ? 'applied' : 'preview only — re-run with --yes');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
