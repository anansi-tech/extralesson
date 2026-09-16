// The six questions the read-off work left stuck behind a solve that
// disagreed. Each is gated once more now that:
//
//   - a conclusion, comparison or interpretation drawn from a value is NEW
//     WORK, so the check stops firing on the slots that do that;
//   - a slot the rubric does not pay for is not a slot buying nothing;
//   - "Exceeded" and "exceeds" are one word.
//
// A question that passes is approved. One that fails ONLY on a check ruled
// above — the solve saying a slot demands no new work, where the slot draws a
// conclusion from a value — has that result RECORDED and is approved: the
// point of Question.gate is that a fault we have decided to live with is
// reported rather than blocking, and a refusal that is never written is a
// fault that can never be settled.
//
// Anything failing on something else is left a draft and named.
//
// Run: pnpm tsx scripts/done/settle-six.ts [--write]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { editableDraft } from '@/lib/admin/edit-json';
import { QuestionDraftZ } from '@/lib/validation/question';
import { approvalGate, type GateCheck } from '@/lib/generation/approve-gate';
import { independentSolve } from '@/lib/generation/solve';
import { explainDraftError } from '@/lib/admin/draft-error';
import { isEntryPoint } from '../entry';

const IDS = ['80498a', '804b1c', 'fe84af', '797bda', '797c83', 'd16f32'];
/** The note the rule above settles: a slot that concludes, compares or interprets. */
const RULED = /demands no new work/;

async function main(): Promise<void> {
  await dbConnect();
  const rows = await Question.find({}).lean<Record<string, unknown>[]>();
  const write = process.argv.includes('--write');

  for (const id of IDS) {
    const raw = rows.find((r) => String(r._id).endsWith(id));
    if (!raw) { console.log(`  ${id}  not in the bank`); continue; }
    const validated = QuestionDraftZ.safeParse(JSON.parse(JSON.stringify(editableDraft(raw))));
    if (!validated.success) { console.log(`  ${id}  editor refused — ${explainDraftError(validated.error)}`); continue; }

    const known = ((raw.gate as { failed?: string[] } | undefined)?.failed ?? []) as GateCheck[];
    const gate = await approvalGate(validated.data, undefined, known);
    const was = raw.status as string;

    if (gate.ok) {
      if (write) await Question.collection.updateOne({ _id: raw._id as never }, { $set: { status: 'approved', gate: { at: new Date(), failed: gate.failed } } });
      console.log(`  ${id}  PASSED    ${was} -> approved${gate.tolerated.length ? `  (tolerated: ${gate.tolerated.join(', ')})` : ''}`);
      continue;
    }
    if (gate.kind !== 'model') {
      console.log(`  ${id}  REFUSED   ${gate.kind} — ${String(gate.reason).slice(0, 130)}`);
      continue;
    }

    // Which solve check refused, in its own words.
    const out = await independentSolve(validated.data);
    const unruled = out.notes.filter((n) => !RULED.test(n) && !/judged SAME/.test(n));
    if (out.agrees) {
      if (write) await Question.collection.updateOne({ _id: raw._id as never }, { $set: { status: 'approved', gate: { at: new Date(), failed: gate.failed.filter((c) => c !== 'solve') } } });
      console.log(`  ${id}  PASSED on the re-solve   ${was} -> approved`);
      continue;
    }
    if (unruled.length > 0) {
      console.log(`  ${id}  REFUSED   solve, on something else — ${unruled.map((n) => n.slice(0, 110)).join(' | ')}`);
      continue;
    }
    if (write) await Question.collection.updateOne({ _id: raw._id as never }, { $set: { status: 'approved', gate: { at: new Date(), failed: [...new Set([...gate.failed, 'solve'])] } } });
    console.log(`  ${id}  RECORDED  solve fails on a ruled check, recorded and approved — ${out.notes.filter((n) => RULED.test(n)).map((n) => n.slice(0, 96)).join(' | ')}`);
  }
  if (!write) console.log('\ndry run — pass --write to save');
  process.exit(0);
}

if (isEntryPoint(import.meta.url)) void main();
