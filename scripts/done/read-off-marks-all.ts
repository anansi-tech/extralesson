// The rest of the read-off slots the bank sweep found: every slot readOffSlots
// calls the EXACT shape — two rows over a figure, one saying where to look and
// one giving the value. The first row goes; the slot, its part and the
// question's total each drop by one mark. 727ff6e did the first fifteen of
// these by hand; this does the remainder from the same rule the gate now
// refuses on, so the script and the gate cannot disagree about which slots
// they are or which row comes out.
//
// RETIRED QUESTIONS ARE SKIPPED. Editing one through this path would set it to
// draft and put a question nobody serves back in the review queue.
//
// Run: pnpm tsx scripts/done/read-off-marks-all.ts [--write]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { editableDraft } from '@/lib/admin/edit-json';
import { QuestionDraftZ } from '@/lib/validation/question';
import { approvalGate } from '@/lib/generation/approve-gate';
import { explainDraftError } from '@/lib/admin/draft-error';
import { readOffSlots } from '@/lib/generation/read-off';
import { isEntryPoint } from '../entry';

interface Row { code: string; slot_ref: string; mark_value: number; criterion: string }

async function main(): Promise<void> {
  await dbConnect();
  const rows = await Question.find({}).lean<Record<string, unknown>[]>();
  const before: string[] = [];
  const after: string[] = [];
  const refused: string[] = [];
  let skipped = 0;

  for (const raw of rows) {
    const exact = readOffSlots(raw as never).filter((s) => s.shape === 'exact');
    if (exact.length === 0) continue;
    const id = String(raw._id).slice(-6);
    if (raw.status === 'retired') {
      skipped += exact.length;
      before.push(`  ${id}  SKIPPED (retired): ${exact.map((s) => s.ref).join(', ')}`);
      continue;
    }

    const draft = editableDraft(raw) as Record<string, unknown> & {
      marks: number;
      rubric: Row[];
      parts: { label: string; marks: number; slots: { label: string; rubric_codes?: string[] }[] }[];
    };
    const startedAt = draft.marks;

    for (const slot of exact) {
      const going = draft.rubric.find((r) => r.code === slot.dropCode);
      if (!going || going.mark_value !== 1) throw new Error(`${id} ${slot.ref}: ${slot.dropCode} is not a one-mark row`);
      const part = draft.parts.find((p) => p.label === going.slot_ref.split('.')[0])!;
      before.push(`  ${id} ${slot.ref}  drop ${going.code}  ${String(going.criterion).replace(/\s+/g, ' ').slice(0, 72)}`);
      part.marks -= 1;
      draft.marks -= 1;
      for (const s of part.slots) s.rubric_codes = (s.rubric_codes ?? []).filter((c) => c !== going.code);
      draft.rubric = draft.rubric.filter((r) => r.code !== going.code);
    }

    const validated = QuestionDraftZ.safeParse(JSON.parse(JSON.stringify(draft)));
    if (!validated.success) { refused.push(`  ${id}: editor — ${explainDraftError(validated.error)}`); continue; }

    let gate = await approvalGate(validated.data);
    for (let attempt = 2; attempt <= 3 && !gate.ok && gate.kind !== 'question'; attempt++) gate = await approvalGate(validated.data);
    if (!gate.ok) { refused.push(`  ${id}: gate (${gate.kind}) — ${String(gate.reason).slice(0, 150)}`); continue; }

    if (process.argv.includes('--write')) {
      await Question.updateOne({ _id: raw._id }, { $set: { ...validated.data, status: 'draft' } });
      after.push(`  ${id}  ${startedAt}m -> ${draft.marks}m  status draft  (${exact.length} slot${exact.length > 1 ? 's' : ''})`);
    } else {
      after.push(`  ${id}  ${startedAt}m -> ${draft.marks}m  (dry run, ${exact.length} slot${exact.length > 1 ? 's' : ''})`);
    }
  }

  console.log(`BEFORE — ${before.length} lines, ${skipped} slots skipped as retired\n${before.join('\n')}`);
  console.log(`\nAFTER — ${after.length} questions\n${after.join('\n')}`);
  if (refused.length) console.log(`\nREFUSED — ${refused.length}\n${refused.join('\n')}`);
  process.exit(0);
}

if (isEntryPoint(import.meta.url)) {
  void main();
}
