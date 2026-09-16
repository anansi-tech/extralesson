// Every question the read-off repairs put into draft, back to approved.
//
// Each of these passed the gate at edit time and changed only a mark value —
// a rubric row removed, the slot, the part and the total following it. None
// changed a stem, an answer or a figure. But an edit returns a question to
// draft by the editor's own rule, so the bank lost sixty-one questions to a
// review queue for a one-mark correction nobody needs to read.
//
// THE GATE RUNS ONCE MORE EACH, and once only. It is two model calls and it
// varies, so a retry loop here would be a way of not hearing the answer; a
// question it refuses stays a draft and is named in the report.
//
// The ids are listed rather than derived. "Every draft" would sweep up drafts
// that were never approved, and a script that decides for itself what it is
// allowed to approve is not one to run against the live bank.
//
// Run: pnpm tsx scripts/done/reapprove-read-off-edits.ts [--write]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { editableDraft } from '@/lib/admin/edit-json';
import { QuestionDraftZ } from '@/lib/validation/question';
import { approvalGate } from '@/lib/generation/approve-gate';
import { explainDraftError } from '@/lib/admin/draft-error';
import { isEntryPoint } from '../entry';

const IDS = `
037c80 037d20 037d9d 037de4 037e11 2ee7b5 45e7b5 45e7e1 45e7eb 6a528f 797ba6 797bda 797c5f 797c83
797cca 797cd7 804a29 804a64 804ab6 804aea 804b1c 821070 82109b 8210e8 82116c 9cc6d1 9e88ce 9e8905
9e895f 9e8974 a9f570 a9f59f b1a547 b1a54f b1a574 b1a584 b1a594 b1a63a b1a68a b77079 b7709e c0bfc2
c0c045 c0c065 c0c06d c0c09b c29c18 c75c59 c75c69 d16f32 d16f57 d16f6c d17038 d9c21d d9c315 d9c35e
d9c370 d9c3db e1cb52 fe84af fe84d4
`.trim().split(/\s+/);

async function main(): Promise<void> {
  await dbConnect();
  const rows = await Question.find({}).lean<Record<string, unknown>[]>();
  const approved: string[] = [];
  const refused: string[] = [];
  const skipped: string[] = [];

  for (const id of IDS) {
    const raw = rows.find((r) => String(r._id).endsWith(id));
    if (!raw) { skipped.push(`  ${id}: not in the bank`); continue; }
    if (raw.status !== 'draft') { skipped.push(`  ${id}: already ${raw.status as string}`); continue; }

    const validated = QuestionDraftZ.safeParse(JSON.parse(JSON.stringify(editableDraft(raw))));
    if (!validated.success) { refused.push(`  ${id}  editor    ${explainDraftError(validated.error)}`); continue; }
    const gate = await approvalGate(validated.data);
    if (!gate.ok) { refused.push(`  ${id}  ${String(gate.kind).padEnd(8)}  ${String(gate.reason).slice(0, 150)}`); continue; }

    if (process.argv.includes('--write')) await Question.updateOne({ _id: raw._id }, { $set: { status: 'approved' } });
    approved.push(`  ${id}  ${raw.marks as number}m`);
  }

  console.log(`${process.argv.includes('--write') ? 'APPROVED' : 'WOULD APPROVE'} — ${approved.length}\n${approved.join('\n')}`);
  if (skipped.length) console.log(`\nSKIPPED — ${skipped.length}\n${skipped.join('\n')}`);
  if (refused.length) console.log(`\nREFUSED, still drafts — ${refused.length}\n${refused.join('\n')}`);
  process.exit(0);
}

if (isEntryPoint(import.meta.url)) void main();
