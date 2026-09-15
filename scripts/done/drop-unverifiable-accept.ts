// One-off: c0c0d6 (a.i) carried the accept entry "\tan 30^\circ = \frac{QR}{PQ}",
// which is the same claim as the canonical only if PQ is 6. The stem says so and
// the comparator cannot, so the slot disagreed with itself with nothing wrong in
// it. The entry goes.
//
// THROUGH THE EDITOR'S OWN PATH, not a $pull: the same editableDraft the review
// box shows, the same QuestionDraftZ that reads it back, the same approvalGate,
// and the same demotion to draft — an edit changes what a student would see, so
// it faces review again. Only requireAdmin is absent, because a script has no
// session; everything that decides whether the edit is SOUND still runs.
//
// Run: pnpm tsx scripts/done/drop-unverifiable-accept.ts [--write]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { editableDraft } from '@/lib/admin/edit-json';
import { QuestionDraftZ } from '@/lib/validation/question';
import { approvalGate } from '@/lib/generation/approve-gate';
import { explainDraftError } from '@/lib/admin/draft-error';
import { isEntryPoint } from '../entry';

const SUFFIX = 'c0c0d6';
const REF = 'a.i';
const ENTRY = '$\\tan 30^\\circ = \\frac{QR}{PQ}$';

async function main(): Promise<void> {
  await dbConnect();
  const rows = await Question.find({}).lean<Record<string, unknown>[]>();
  const raw = rows.find((r) => String(r._id).endsWith(SUFFIX));
  if (!raw) throw new Error(`no question ending ${SUFFIX}`);
  console.log(`${String(raw._id)}  status=${raw.status as string}`);

  const draft = editableDraft(raw);
  let removed = 0;
  for (const part of draft.parts as { label: string; slots?: { label: string; accept?: string[] }[] }[]) {
    for (const slot of part.slots ?? []) {
      if (`${part.label}.${slot.label}` !== REF) continue;
      const kept = (slot.accept ?? []).filter((a) => a !== ENTRY);
      removed = (slot.accept ?? []).length - kept.length;
      if (kept.length > 0) slot.accept = kept;
      else delete slot.accept;
    }
  }
  if (removed !== 1) throw new Error(`expected to remove exactly one entry, removed ${removed}`);

  const validated = QuestionDraftZ.safeParse(JSON.parse(JSON.stringify(draft)));
  if (!validated.success) throw new Error(`the editor would refuse it: ${explainDraftError(validated.error)}`);

  const gate = await approvalGate(validated.data);
  if (!gate.ok) throw new Error(`the gate would refuse it: ${gate.reason}`);
  console.log('gate: ok');

  if (!process.argv.includes('--write')) {
    console.log('dry run — pass --write to save');
    process.exit(0);
  }
  const written = await Question.updateOne({ _id: raw._id }, { $set: { ...validated.data, status: 'draft' } });
  console.log(`written: matched=${written.matchedCount} modified=${written.modifiedCount}`);
  const after = await Question.findById(raw._id).lean<any>();
  const slot = (after.parts ?? []).flatMap((p: any) => (p.slots ?? []).map((s: any) => ({ ref: `${p.label}.${s.label}`, ...s })))
    .find((s: any) => s.ref === REF);
  console.log(`after: status=${after.status}  ${REF} accept=${JSON.stringify(slot.accept)}`);
  process.exit(0);
}

if (isEntryPoint(import.meta.url)) {
  void main();
}
