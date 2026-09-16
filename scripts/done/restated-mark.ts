// 80498a part (d) blanks the value of x that part (b) asks for: "and
// n(A ∩ B) = ___" beside an answer of 5, where (b)'s answer is 5. The mark
// buys a copy of the candidate's own work.
//
// IT IS DELETED, NOT MOVED. Part (d) has no working slot — d.i is a verdict —
// so the rule sends the mark to part (b), and part (b) already pays three
// marks for forming the equation, solving it and stating x = 5. There is no
// fourth act to buy, and writing a criterion for work nobody does is the same
// defect pointing the other way.
//
// Run: pnpm tsx scripts/done/restated-mark.ts [--write]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { editableDraft } from '@/lib/admin/edit-json';
import { QuestionDraftZ } from '@/lib/validation/question';
import { approvalGate, type GateCheck } from '@/lib/generation/approve-gate';
import { explainDraftError } from '@/lib/admin/draft-error';
import { isEntryPoint } from '../entry';

const SUFFIX = '80498a';
const REF = 'd.ii';
const CODE = 'R3';

interface Row { code: string; slot_ref: string; mark_value: number; criterion: string }

async function main(): Promise<void> {
  await dbConnect();
  const raw = (await Question.find({}).lean<Record<string, unknown>[]>()).find((r) => String(r._id).endsWith(SUFFIX));
  if (!raw) throw new Error(`no question ending ${SUFFIX}`);
  const draft = editableDraft(raw) as Record<string, unknown> & {
    marks: number; rubric: Row[];
    parts: { label: string; marks: number; slots: { label: string; rubric_codes?: string[] }[] }[];
  };
  const part = draft.parts.find((p) => p.label === REF.split('.')[0])!;
  const going = draft.rubric.find((r) => r.code === CODE && r.slot_ref === REF);
  if (!going || going.mark_value !== 1) throw new Error(`${SUFFIX}: ${CODE} is not a one-mark row on ${REF}`);

  console.log(`BEFORE  status=${raw.status as string}  question ${draft.marks}m  part ${part.label} ${part.marks}m`);
  console.log(`  ${CODE} ${going.mark_value}m ${REF}  ${going.criterion}`);

  part.marks -= 1;
  draft.marks -= 1;
  for (const s of part.slots) s.rubric_codes = (s.rubric_codes ?? []).filter((c) => c !== CODE);
  draft.rubric = draft.rubric.filter((r) => r !== going);

  const validated = QuestionDraftZ.safeParse(JSON.parse(JSON.stringify(draft)));
  if (!validated.success) throw new Error(`the editor would refuse it: ${explainDraftError(validated.error)}`);
  const known = ((raw.gate as { failed?: string[] } | undefined)?.failed ?? []) as GateCheck[];
  let gate = await approvalGate(validated.data, undefined, known);
  for (let a = 2; a <= 3 && !gate.ok && gate.kind !== 'question'; a++) gate = await approvalGate(validated.data, undefined, known);
  if (!gate.ok) throw new Error(`the gate refused (${gate.kind}): ${String(gate.reason).slice(0, 180)}`);
  console.log('gate: ok');

  if (!process.argv.includes('--write')) { console.log('dry run — pass --write to save'); process.exit(0); }
  await Question.collection.updateOne({ _id: raw._id as never }, { $set: { ...validated.data, status: 'draft', gate: { at: new Date(), failed: gate.failed } } });
  const now = await Question.findById(raw._id).lean<any>();
  const p = (now.parts ?? []).find((x: any) => x.label === REF.split('.')[0]);
  console.log(`\nAFTER   status=${now.status}  question ${now.marks}m  part ${p.label} ${p.marks}m`);
  console.log(`  ${REF} rows: ${(now.rubric ?? []).filter((r: any) => r.slot_ref === REF).map((r: any) => r.code + ' ' + r.mark_value + 'm').join(', ') || '(none)'}`);
  process.exit(0);
}

if (isEntryPoint(import.meta.url)) void main();
