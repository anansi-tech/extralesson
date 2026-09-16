// The read-off slots whose rubric splits ONE read across rows — per coordinate,
// per root, per item of a list — so there is no prerequisite row to drop and
// readOffSlots calls them 'other' rather than the exact shape the gate refuses.
// Each decision is named here, because each is a judgement about what the mark
// is for and not a rule anything can apply.
//
//   a coordinate read off a graph is ONE mark. "Reads the x-coordinate" beside
//   "reads the y-coordinate" pays twice for one point.
//   two roots read off a graph are TWO at most, one per value, with no third
//   mark for knowing where to look.
//   a list read off a figure is TWO at most, however many items it holds:
//   797ba6 paid four marks for enumerating six subsets.
//
// THROUGH THE EDITOR'S OWN PATH, and retired questions are skipped.
// Run: pnpm tsx scripts/done/read-off-marks-split.ts [--write]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { editableDraft } from '@/lib/admin/edit-json';
import { QuestionDraftZ } from '@/lib/validation/question';
import { approvalGate } from '@/lib/generation/approve-gate';
import { explainDraftError } from '@/lib/admin/draft-error';
import { isEntryPoint } from '../entry';

interface Plan { id: string; ref: string; drop: string[]; rewrite?: Record<string, string>; why: string }

const PLANS: Plan[] = [
  // ONE COORDINATE, ONE MARK. The surviving row names the whole point.
  { id: '2ee7b5', ref: 'b.i', drop: ['R2'], rewrite: { R1: "Reads the intersection from the graph as $x=2$, $y=3$" },
    why: 'a point read off a graph, paid per coordinate' },
  { id: 'b1a68a', ref: 'b.i', drop: ['CK3', 'AK4'], rewrite: { AK3: "Reads the point of intersection from the graph as $(4,12)$" },
    why: 'a point read off a graph, paid per coordinate with a third mark for knowing where' },
  { id: 'e1cb52', ref: 'b.i', drop: ['R2'], rewrite: { R1: "Reads all four vertices of 'their' feasible region — $(0,0)$, $(6,0)$, $(4,4)$ and $(0,6)$" },
    why: 'the vertices of one region, paid in two instalments' },
  // A GRAPH READ AND ITS VALUE. One row, not two.
  { id: '45e7b5', ref: 'b.i', drop: ['R1'],
    why: 'reading a cumulative frequency, paid once for the read and once for the value' },
  // TWO ROOTS, TWO MARKS — the row for knowing where to look goes.
  { id: '037e11', ref: 'b.i', drop: ['CK2'], why: 'two roots read off a graph, with a third mark for knowing where' },
  { id: 'd16f6c', ref: 'b.i', drop: ['R1'], why: 'two values read off a graph, with a third mark for knowing where' },
  // A LIST READ OFF A FIGURE IS TWO MARKS, however many items it holds.
  { id: '797ba6', ref: 'c.i', drop: ['CK3', 'AK5'], rewrite: { AK4: "Lists $\\{2,3\\}$, $\\{2,6\\}$ and $\\{3,6\\}$" },
    why: 'four marks for enumerating six subsets' },
  { id: '797cd7', ref: 'b.i', drop: ['CK2'], why: 'a list of four subsets, with a third mark for knowing what they contain' },
  { id: 'a9f570', ref: 'c.i', drop: ['CK3'], why: 'a list of three subsets, with a third mark for identifying the members' },
  { id: 'd9c3db', ref: 'a.i', drop: ['CK1'], why: 'a sample space read off a table, with a third mark for knowing its shape' },
  // 116279 (a.i) is the same defect and is RETIRED; editing it would put a
  // question nobody serves back in the review queue.
];

interface Row { code: string; slot_ref: string; mark_value: number; criterion: string }

async function main(): Promise<void> {
  await dbConnect();
  const rows = await Question.find({}).lean<Record<string, unknown>[]>();
  const before: string[] = [];
  const after: string[] = [];
  const refused: string[] = [];

  for (const plan of PLANS) {
    const raw = rows.find((r) => String(r._id).endsWith(plan.id));
    if (!raw) throw new Error(`no question ending ${plan.id}`);
    if (raw.status === 'retired') { before.push(`  ${plan.id} SKIPPED (retired)`); continue; }

    const draft = editableDraft(raw) as Record<string, unknown> & {
      marks: number; rubric: Row[];
      parts: { label: string; marks: number; slots: { label: string; rubric_codes?: string[] }[] }[];
    };
    const was = draft.marks;
    const slotRows = draft.rubric.filter((r) => r.slot_ref === plan.ref);
    before.push(`  ${plan.id} (${plan.ref})  ${slotRows.reduce((n, r) => n + r.mark_value, 0)}m — ${plan.why}`);
    for (const r of slotRows) before.push(`      ${plan.drop.includes(r.code) ? 'DROP' : plan.rewrite?.[r.code] ? 'EDIT' : 'keep'} ${r.code} ${String(r.criterion).replace(/\s+/g, ' ').slice(0, 78)}`);

    const part = draft.parts.find((p) => p.label === plan.ref.split('.')[0])!;
    for (const code of plan.drop) {
      const going = draft.rubric.find((r) => r.code === code && r.slot_ref === plan.ref);
      if (!going || going.mark_value !== 1) throw new Error(`${plan.id}: ${code} is not a one-mark row on ${plan.ref}`);
      part.marks -= 1;
      draft.marks -= 1;
      for (const s of part.slots) s.rubric_codes = (s.rubric_codes ?? []).filter((c) => c !== code);
      draft.rubric = draft.rubric.filter((r) => r !== going);
    }
    for (const [code, criterion] of Object.entries(plan.rewrite ?? {})) {
      const row = draft.rubric.find((r) => r.code === code && r.slot_ref === plan.ref);
      if (!row) throw new Error(`${plan.id}: no ${code} to rewrite on ${plan.ref}`);
      row.criterion = criterion;
    }

    const validated = QuestionDraftZ.safeParse(JSON.parse(JSON.stringify(draft)));
    if (!validated.success) { refused.push(`  ${plan.id}: editor — ${explainDraftError(validated.error)}`); continue; }
    let gate = await approvalGate(validated.data);
    for (let a = 2; a <= 3 && !gate.ok && gate.kind !== 'question'; a++) gate = await approvalGate(validated.data);
    if (!gate.ok) { refused.push(`  ${plan.id}: gate (${gate.kind}) — ${String(gate.reason).slice(0, 150)}`); continue; }

    if (process.argv.includes('--write')) {
      await Question.updateOne({ _id: raw._id }, { $set: { ...validated.data, status: 'draft' } });
      const now = await Question.findById(raw._id).lean<any>();
      after.push(`  ${plan.id} (${plan.ref})  question ${was}m -> ${now.marks}m  status ${now.status}`);
      for (const r of (now.rubric ?? []).filter((x: any) => x.slot_ref === plan.ref)) after.push(`      ${r.code} ${r.mark_value}m  ${String(r.criterion).replace(/\s+/g, ' ').slice(0, 84)}`);
    } else after.push(`  ${plan.id} (${plan.ref})  ${was}m -> ${draft.marks}m  (dry run)`);
  }

  console.log(`BEFORE\n${before.join('\n')}\n\nAFTER\n${after.join('\n')}`);
  if (refused.length) console.log(`\nREFUSED\n${refused.join('\n')}`);
  process.exit(0);
}

if (isEntryPoint(import.meta.url)) void main();
