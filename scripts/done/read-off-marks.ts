// One-off: fifteen slots paid TWO marks for stating a value the figure draws.
// Each carried the same rubric shape — one row for the prerequisite ("the
// y-intercept occurs when x=0") beside one row for the answer ("CAO (0,12)") —
// so a candidate who simply read the intercept off the line collected both. The
// prerequisite row goes; the slot, its part and the question's total each drop
// by one mark.
//
// WHICH ROW SURVIVES IS NAMED HERE, NOT GUESSED. The surviving row must be the
// one a marker can award from what the student wrote, so it is always the row
// that names the answer.
//
// THROUGH THE EDITOR'S OWN PATH: the same editableDraft the review box shows,
// the same QuestionDraftZ that reads it back, the same approvalGate, and the
// same demotion to draft.
//
// Run: pnpm tsx scripts/done/read-off-marks.ts [--write]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { editableDraft } from '@/lib/admin/edit-json';
import { QuestionDraftZ } from '@/lib/validation/question';
import { approvalGate } from '@/lib/generation/approve-gate';
import { explainDraftError } from '@/lib/admin/draft-error';
import { isEntryPoint } from '../entry';

/** question suffix → the rubric codes to drop, one per over-paid slot. */
const DROP: Record<string, string[]> = {
  '797c5f': ['CK1'], // a.i — keeps AK1 "CAO (0,-18)"
  '82116c': ['R1'], //  a.i — keeps R2  "CAO (0,12)"
  d16f57: ['CK1'], //   a.i — keeps R1  "Reads the intercept coordinate as (0,12)"
  '804a64': ['CK1'], // a.i — keeps R1  "CAO (0,-8) read from the graph"
  '804b1c': ['R1', 'R2'], // a.i and b.i — keeps CK1 "CAO (0,16)" and CK2 "CAO (8,0)"
  '82109b': ['CK1'], // a.i — keeps R1  "CAO (0,-12)"
  '8210e8': ['CK1'], // a.i — keeps R1  "CAO (0,12) read from the graph"
  '9e8905': ['CK1'], // a.i — keeps R1  "Reads the y-intercept as (0,12)"
  d17038: ['CK1'], //   a.i — keeps R1  "Reads the coordinate (0,12) from the graph"
  '9cc6d1': ['R1', 'CK1'], // a.i and b.i — keeps AK1 "CAO $22" and CK2 "CAO c = 10"
  '9e895f': ['CK1'], // b.i — keeps R1  "Reads the other corresponding input, CAO 6"
  c0c09b: ['CK1'], //   a.i — keeps R1  "Reads 1 km and 5 km from the graph"
  '804ab6': ['CK1'], // a.i — keeps AK1 "States a valid sample space"
};

interface Row { code: string; slot_ref: string; mark_value: number; criterion: string }

async function main(): Promise<void> {
  await dbConnect();
  const rows = await Question.find({}).lean<Record<string, unknown>[]>();
  const before: string[] = [];
  const after: string[] = [];

  for (const [suffix, codes] of Object.entries(DROP)) {
    const raw = rows.find((r) => String(r._id).endsWith(suffix));
    if (!raw) throw new Error(`no question ending ${suffix}`);
    const draft = editableDraft(raw) as Record<string, unknown> & {
      marks: number;
      rubric: Row[];
      parts: { label: string; marks: number; slots: { label: string; rubric_codes?: string[] }[] }[];
    };

    const going = draft.rubric.filter((r) => codes.includes(r.code));
    if (going.length !== codes.length) throw new Error(`${suffix}: expected ${codes.length} rows, found ${going.length}`);
    if (going.some((r) => r.mark_value !== 1)) throw new Error(`${suffix}: a row to drop is not worth one mark`);

    for (const r of going) {
      const part = draft.parts.find((p) => p.label === r.slot_ref.split('.')[0])!;
      before.push(`  ${suffix} ${r.slot_ref}  part ${part.marks}m  question ${draft.marks}m  dropping ${r.code} (${r.criterion.replace(/\s+/g, ' ').slice(0, 60)})`);
      part.marks -= 1;
      draft.marks -= 1;
      for (const s of part.slots) s.rubric_codes = (s.rubric_codes ?? []).filter((c) => c !== r.code);
    }
    draft.rubric = draft.rubric.filter((r) => !codes.includes(r.code));

    const validated = QuestionDraftZ.safeParse(JSON.parse(JSON.stringify(draft)));
    if (!validated.success) throw new Error(`${suffix}: the editor would refuse it: ${explainDraftError(validated.error)}`);

    let passed = false;
    for (let attempt = 1; attempt <= 3 && !passed; attempt++) {
      const gate = await approvalGate(validated.data);
      if (gate.ok) { passed = true; break; }
      console.log(`  ${suffix}: gate refused, attempt ${attempt}: ${String(gate.reason).slice(0, 160)}`);
    }
    if (!passed) throw new Error(`${suffix}: the gate refused three times`);

    if (process.argv.includes('--write')) {
      await Question.updateOne({ _id: raw._id }, { $set: { ...validated.data, status: 'draft' } });
      const now = await Question.findById(raw._id).lean<any>();
      for (const r of going) {
        const part = (now.parts ?? []).find((p: any) => p.label === r.slot_ref.split('.')[0]);
        after.push(`  ${suffix} ${r.slot_ref}  part ${part.marks}m  question ${now.marks}m  status ${now.status}  rubric ${(now.rubric ?? []).filter((x: any) => x.slot_ref === r.slot_ref).map((x: any) => `${x.code} ${x.mark_value}m`).join(', ')}`);
      }
    }
  }

  console.log(`BEFORE\n${before.join('\n')}`);
  if (after.length) console.log(`\nAFTER\n${after.join('\n')}`);
  else console.log('\ndry run — pass --write to save');
  process.exit(0);
}

if (isEntryPoint(import.meta.url)) {
  void main();
}
