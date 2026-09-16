// The drafts the read-off work left behind, now that what blocked them is
// fixed.
//
//   d9c3db, a9f59f, b1a594  agreed on the re-solve; they were refused once by
//                           a gate that varies, and stayed drafts rather than
//                           be approved on a second roll.
//   d16f32                  refused because the adjudicator called "Exceeded"
//                           and "exceeds" different words. 49b054d stems
//                           lightly, so tense is no longer a difference.
//
// THE GATE RUNS ONCE EACH, and once only. A question it refuses stays a draft
// and is named.
//
// Run: pnpm tsx scripts/done/approve-after-fixes.ts [--write]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { editableDraft } from '@/lib/admin/edit-json';
import { QuestionDraftZ } from '@/lib/validation/question';
import { approvalGate, type GateCheck } from '@/lib/generation/approve-gate';
import { explainDraftError } from '@/lib/admin/draft-error';
import { isEntryPoint } from '../entry';

const IDS = ['d9c3db', 'a9f59f', 'b1a594', 'd16f32'];

async function main(): Promise<void> {
  await dbConnect();
  const rows = await Question.find({}).lean<Record<string, unknown>[]>();
  for (const id of IDS) {
    const raw = rows.find((r) => String(r._id).endsWith(id));
    if (!raw) { console.log(`  ${id}  not in the bank`); continue; }
    if (raw.status !== 'draft') { console.log(`  ${id}  already ${raw.status as string}`); continue; }

    const validated = QuestionDraftZ.safeParse(JSON.parse(JSON.stringify(editableDraft(raw))));
    if (!validated.success) { console.log(`  ${id}  editor refused — ${explainDraftError(validated.error)}`); continue; }
    const known = ((raw.gate as { failed?: string[] } | undefined)?.failed ?? []) as GateCheck[];
    const gate = await approvalGate(validated.data, undefined, known);

    if (!gate.ok) { console.log(`  ${id}  REFUSED (${gate.kind}) — ${String(gate.reason).slice(0, 140)}`); continue; }
    if (process.argv.includes('--write')) {
      await Question.collection.updateOne({ _id: raw._id as never }, { $set: { status: 'approved', gate: { at: new Date(), failed: gate.failed } } });
    }
    console.log(`  ${id}  approved${gate.tolerated.length ? `  (tolerated: ${gate.tolerated.join(', ')})` : ''}`);
  }
  console.log(process.argv.includes('--write') ? '' : '\ndry run — pass --write to save');
  process.exit(0);
}

if (isEntryPoint(import.meta.url)) void main();
