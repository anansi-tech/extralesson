// One-off: 6a528f part (a) paid FOUR marks for writing down two points the
// grid already labels. The figure draws O(0,0), A(-3,2) and B(2,4) with their
// letters on them, and each slot's rubric split the read into one row per
// component — "Uses -3 as the first component", "Uses 2 as the second". A
// candidate who copied the labelled point collected both.
//
// This is the pair 727ff6e left alone. There was no prerequisite row to drop:
// both rows are halves of one read, so cutting either leaves a criterion
// describing half an answer while paying for all of it. Each slot becomes ONE
// row that names the whole vector.
//
// THROUGH THE EDITOR'S OWN PATH: editableDraft, QuestionDraftZ, approvalGate,
// and the demotion to draft.
//
// Run: pnpm tsx scripts/done/vector-read-marks.ts [--write]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { editableDraft } from '@/lib/admin/edit-json';
import { QuestionDraftZ } from '@/lib/validation/question';
import { approvalGate } from '@/lib/generation/approve-gate';
import { explainDraftError } from '@/lib/admin/draft-error';
import { isEntryPoint } from '../entry';

const SUFFIX = '6a528f';
const COLUMN = (a: string, b: string) => `\\begin{pmatrix}${a}\\\\${b}\\end{pmatrix}`;

/** keep → the criterion it gets; drop → the row that goes with it. */
const REWRITE = [
  { slot: 'a.i', keep: 'CK1', drop: 'CK2', criterion: `Writes $\\overrightarrow{OA}$ as the column vector $${COLUMN('-3', '2')}$ from the grid` },
  { slot: 'a.ii', keep: 'CK3', drop: 'CK4', criterion: `Writes $\\overrightarrow{OB}$ as the column vector $${COLUMN('2', '4')}$ from the grid` },
];

interface Row { code: string; slot_ref: string; mark_value: number; criterion: string }

async function main(): Promise<void> {
  await dbConnect();
  const raw = (await Question.find({}).lean<Record<string, unknown>[]>()).find((r) => String(r._id).endsWith(SUFFIX));
  if (!raw) throw new Error(`no question ending ${SUFFIX}`);
  const draft = editableDraft(raw) as Record<string, unknown> & {
    marks: number;
    rubric: Row[];
    parts: { label: string; marks: number; slots: { label: string; rubric_codes?: string[] }[] }[];
  };

  console.log(`BEFORE  ${String(raw._id)}  status=${raw.status as string}  question ${draft.marks}m`);
  for (const p of draft.parts) console.log(`  part ${p.label} ${p.marks}m`);
  for (const r of draft.rubric.filter((x) => x.slot_ref.startsWith('a.'))) console.log(`  ${r.code} ${r.mark_value}m ${r.slot_ref}  ${r.criterion}`);

  for (const { slot, keep, drop, criterion } of REWRITE) {
    const kept = draft.rubric.find((r) => r.code === keep);
    const gone = draft.rubric.find((r) => r.code === drop);
    if (!kept || !gone) throw new Error(`${SUFFIX}: expected ${keep} and ${drop} on ${slot}`);
    if (kept.slot_ref !== slot || gone.slot_ref !== slot) throw new Error(`${SUFFIX}: ${keep}/${drop} are not both on ${slot}`);
    if (kept.mark_value !== 1 || gone.mark_value !== 1) throw new Error(`${SUFFIX}: ${slot} rows are not one mark each`);
    kept.criterion = criterion;
    const part = draft.parts.find((p) => p.label === slot.split('.')[0])!;
    part.marks -= 1;
    draft.marks -= 1;
    for (const s of part.slots) s.rubric_codes = (s.rubric_codes ?? []).filter((c) => c !== drop);
  }
  draft.rubric = draft.rubric.filter((r) => !REWRITE.some((w) => w.drop === r.code));

  const validated = QuestionDraftZ.safeParse(JSON.parse(JSON.stringify(draft)));
  if (!validated.success) throw new Error(`the editor would refuse it: ${explainDraftError(validated.error)}`);

  let passed = false;
  for (let attempt = 1; attempt <= 3 && !passed; attempt++) {
    const gate = await approvalGate(validated.data);
    if (gate.ok) { passed = true; break; }
    console.log(`  gate refused, attempt ${attempt}: ${String(gate.reason).slice(0, 170)}`);
  }
  if (!passed) throw new Error('the gate refused three times');
  console.log('gate: ok');

  if (!process.argv.includes('--write')) {
    console.log('dry run — pass --write to save');
    process.exit(0);
  }
  await Question.updateOne({ _id: raw._id }, { $set: { ...validated.data, status: 'draft' } });
  const now = await Question.findById(raw._id).lean<any>();
  console.log(`\nAFTER   status=${now.status}  question ${now.marks}m`);
  for (const p of now.parts ?? []) console.log(`  part ${p.label} ${p.marks}m  slots ${(p.slots ?? []).map((s: any) => `${s.label}[${(s.rubric_codes ?? []).join(',')}]`).join(' ')}`);
  for (const r of (now.rubric ?? []).filter((x: any) => x.slot_ref.startsWith('a.'))) console.log(`  ${r.code} ${r.mark_value}m ${r.slot_ref}  ${r.criterion}`);
  process.exit(0);
}

if (isEntryPoint(import.meta.url)) {
  void main();
}
