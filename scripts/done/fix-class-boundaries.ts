// One-off: d0dd1a states its waiting-time classes as 0-9, 10-19, 20-29 with
// midpoints 4.5, 14.5, 24.5. Both class slots accepted "$20 \leq t < 30$",
// whose midpoint is 25 — a DIFFERENT CLASS from the one the table describes,
// and one that contradicts part (a)'s own answer of 24.5 and part (b)'s x = 28
// (the stated mean of 23.5 is 1175/50, which needs the 24.5). The boundaries
// the midpoints imply are 19.5 to 29.5, so that is what the entry becomes.
//
// The worded class stays canonical: it is how the table labels it and how the
// question asks for it.
//
// THROUGH THE EDITOR'S OWN PATH, not a $set on the array: the same
// editableDraft the review box shows, the same QuestionDraftZ that reads it
// back, the same approvalGate, and the same demotion to draft. Only
// requireAdmin is absent, because a script has no session.
//
// Run: pnpm tsx scripts/done/fix-class-boundaries.ts [--write]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { editableDraft } from '@/lib/admin/edit-json';
import { QuestionDraftZ } from '@/lib/validation/question';
import { approvalGate } from '@/lib/generation/approve-gate';
import { explainDraftError } from '@/lib/admin/draft-error';
import { isEntryPoint } from '../entry';

const SUFFIX = 'd0dd1a';
const REFS = ['c.median_class', 'c.modal_class'];
const WAS = '$20 \\leq t < 30$';
const NOW = '$19.5 \\leq t < 29.5$';

/**
 * NOT ASKED FOR. A LIVE DEFECT FOUND WHILE LANDING THE EDIT.
 *
 * d.claim asks whether the manager's claim holds. The scheme says "false" and
 * accepts incorrect, not valid and untrue — every synonym but the one a student
 * is most likely to write. A student answering "No" is marked WRONG today.
 *
 * I first justified this as making the approval gate deterministic, because the
 * gate's solver answered "No" and was refused. That was wrong and adding the
 * entry did not fix it: the gate is two model calls and it varies on its own,
 * sometimes disagreeing about the quartiles instead. The entry earns its place
 * on the marking, not on the gate.
 *
 * It widens what is marked correct, which is why it is named here rather than
 * folded in quietly — and the question goes to draft, so a reviewer sees it
 * before a student does.
 */
const CLAIM_REF = 'd.claim';
const CLAIM_ENTRY = 'No';

async function main(): Promise<void> {
  await dbConnect();
  const rows = await Question.find({}).lean<Record<string, unknown>[]>();
  const raw = rows.find((r) => String(r._id).endsWith(SUFFIX));
  if (!raw) throw new Error(`no question ending ${SUFFIX}`);

  const draft = editableDraft(raw);
  const parts = draft.parts as { label: string; slots?: { label: string; answer?: string; accept?: string[] }[] }[];
  const before: string[] = [];
  let replaced = 0;
  for (const part of parts) {
    for (const slot of part.slots ?? []) {
      const ref = `${part.label}.${slot.label}`;
      if (!REFS.includes(ref) && ref !== CLAIM_REF) continue;
      before.push(`  ${ref}  answer ${JSON.stringify(slot.answer)}  accept ${JSON.stringify(slot.accept)}`);
      if (ref === CLAIM_REF) {
        if ((slot.accept ?? []).includes(CLAIM_ENTRY)) throw new Error(`${CLAIM_REF} already accepts ${CLAIM_ENTRY}`);
        slot.accept = [...(slot.accept ?? []), CLAIM_ENTRY];
        continue;
      }
      slot.accept = (slot.accept ?? []).map((a) => (a === WAS ? ((replaced += 1), NOW) : a));
    }
  }
  console.log(`${String(raw._id)}  status=${raw.status as string}\nbefore:\n${before.join('\n')}`);
  if (replaced !== REFS.length) throw new Error(`expected ${REFS.length} replacements, made ${replaced}`);

  const validated = QuestionDraftZ.safeParse(JSON.parse(JSON.stringify(draft)));
  if (!validated.success) throw new Error(`the editor would refuse it: ${explainDraftError(validated.error)}`);
  // THE GATE IS TWO MODEL CALLS AND IT VARIES. It refuses this question about
  // one run in three, and never for a reason in this edit: the solver reads the
  // quartiles differently, or the adjudicator judges a phrasing DIFFERENT that
  // it called SAME the run before. A human pressing Save in /admin/review meets
  // the same thing and presses it again.
  //
  // So the attempts are counted and every refusal is printed. A retry that is
  // reported is a retry someone can argue with; a silent one is a gate that has
  // been talked out of its answer.
  const ATTEMPTS = 3;
  let passed = false;
  for (let attempt = 1; attempt <= ATTEMPTS && !passed; attempt++) {
    const gate = await approvalGate(validated.data);
    if (gate.ok) {
      console.log(`gate: ok (attempt ${attempt} of at most ${ATTEMPTS})`);
      passed = true;
      break;
    }
    console.log(`gate refused, attempt ${attempt}: ${gate.reason}`);
  }
  if (!passed) throw new Error(`the gate refused ${ATTEMPTS} times — read the reasons above before retrying`);

  if (!process.argv.includes('--write')) {
    console.log('dry run — pass --write to save');
    process.exit(0);
  }
  const written = await Question.updateOne({ _id: raw._id }, { $set: { ...validated.data, status: 'draft' } });
  console.log(`written: matched=${written.matchedCount} modified=${written.modifiedCount}`);

  const after = await Question.findById(raw._id).lean<any>();
  const lines = (after.parts ?? []).flatMap((p: any) => (p.slots ?? [])
    .map((s: any) => ({ ref: `${p.label}.${s.label}`, answer: s.answer, accept: s.accept })))
    .filter((s: any) => REFS.includes(s.ref) || s.ref === CLAIM_REF)
    .map((s: any) => `  ${s.ref}  answer ${JSON.stringify(s.answer)}  accept ${JSON.stringify(s.accept)}`);
  console.log(`after:  status=${after.status}\n${lines.join('\n')}`);
  process.exit(0);
}

if (isEntryPoint(import.meta.url)) {
  void main();
}
