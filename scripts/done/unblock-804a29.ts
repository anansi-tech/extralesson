// 804a29 (b.ii) carried the accept entry "$2, 0$" against an answer of
// "$0, 2$". readInputShape calls that slot a LIST, and a list is ordered —
// aac2207 settled that — so the entry does not mean what the answer means and
// the question disagrees with itself. It is one of the seven reordered pairs
// the sweep reports and has sat there since.
//
// It was also blocking a real edit: the same slot pays two marks for reading
// two values off a graph, and the gate refuses ANY save of a question that
// disagrees with itself before it looks at anything else. So the entry goes and
// the read-off row goes with it, in one save.
//
// Run: pnpm tsx scripts/done/unblock-804a29.ts [--write]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { editableDraft } from '@/lib/admin/edit-json';
import { QuestionDraftZ } from '@/lib/validation/question';
import { approvalGate } from '@/lib/generation/approve-gate';
import { explainDraftError } from '@/lib/admin/draft-error';
import { readOffSlots } from '@/lib/generation/read-off';
import { isEntryPoint } from '../entry';

const SUFFIX = '804a29';
const REF = 'b.ii';
const ENTRY = '$2, 0$';

interface Row { code: string; slot_ref: string; mark_value: number; criterion: string }

async function main(): Promise<void> {
  await dbConnect();
  const raw = (await Question.find({}).lean<Record<string, unknown>[]>()).find((r) => String(r._id).endsWith(SUFFIX));
  if (!raw) throw new Error(`no question ending ${SUFFIX}`);

  const draft = editableDraft(raw) as Record<string, unknown> & {
    marks: number; rubric: Row[];
    parts: { label: string; marks: number; slots: { label: string; answer?: string; accept?: string[]; rubric_codes?: string[] }[] }[];
  };
  const was = draft.marks;
  const part = draft.parts.find((p) => p.label === REF.split('.')[0])!;
  const slot = part.slots.find((s) => `${part.label}.${s.label}` === REF)!;

  console.log(`BEFORE  status=${raw.status as string}  question ${was}m  part ${part.marks}m`);
  console.log(`  ${REF} answer ${JSON.stringify(slot.answer)}  accept ${JSON.stringify(slot.accept ?? [])}`);
  for (const r of draft.rubric.filter((x) => x.slot_ref === REF)) console.log(`  ${r.code} ${r.mark_value}m  ${r.criterion}`);

  const kept = (slot.accept ?? []).filter((a) => a !== ENTRY);
  if (kept.length === (slot.accept ?? []).length) throw new Error(`${SUFFIX}: ${REF} does not carry ${ENTRY}`);
  if (kept.length > 0) slot.accept = kept; else delete slot.accept;

  const exact = readOffSlots(raw as never).filter((s) => s.shape === 'exact' && s.ref === REF);
  if (exact.length !== 1) throw new Error(`${SUFFIX}: expected one exact read-off slot on ${REF}, found ${exact.length}`);
  const going = draft.rubric.find((r) => r.code === exact[0].dropCode && r.slot_ref === REF);
  if (!going || going.mark_value !== 1) throw new Error(`${SUFFIX}: ${exact[0].dropCode} is not a one-mark row`);
  part.marks -= 1;
  draft.marks -= 1;
  for (const s of part.slots) s.rubric_codes = (s.rubric_codes ?? []).filter((c) => c !== going.code);
  draft.rubric = draft.rubric.filter((r) => r !== going);

  const validated = QuestionDraftZ.safeParse(JSON.parse(JSON.stringify(draft)));
  if (!validated.success) throw new Error(`the editor would refuse it: ${explainDraftError(validated.error)}`);
  let gate = await approvalGate(validated.data);
  for (let a = 2; a <= 3 && !gate.ok && gate.kind !== 'question'; a++) gate = await approvalGate(validated.data);
  if (!gate.ok) throw new Error(`the gate refused (${gate.kind}): ${gate.reason}`);
  console.log('gate: ok');

  if (!process.argv.includes('--write')) { console.log('dry run — pass --write to save'); process.exit(0); }
  await Question.updateOne({ _id: raw._id }, { $set: { ...validated.data, status: 'draft' } });
  const now = await Question.findById(raw._id).lean<any>();
  const p = (now.parts ?? []).find((x: any) => x.label === REF.split('.')[0]);
  const s = (p.slots ?? []).find((x: any) => `${p.label}.${x.label}` === REF);
  console.log(`\nAFTER   status=${now.status}  question ${now.marks}m  part ${p.marks}m`);
  console.log(`  ${REF} answer ${JSON.stringify(s.answer)}  accept ${JSON.stringify(s.accept ?? [])}`);
  for (const r of (now.rubric ?? []).filter((x: any) => x.slot_ref === REF)) console.log(`  ${r.code} ${r.mark_value}m  ${r.criterion}`);
  process.exit(0);
}

if (isEntryPoint(import.meta.url)) void main();
