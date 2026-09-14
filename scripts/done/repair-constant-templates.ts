// The remaining rows from the re-derivation, where a claim template stood a
// QUESTION CONSTANT as a reference to the student's value. Only the student's
// own value is a reference; what the question fixes stays literal.
//
// Each row is judged on its own, because "the literal is also a slot's answer"
// is where the derivation went wrong, not where the answer is:
//
//   c0bf0b AK1  (a.i)  LEFT ALONE. The 24 is the result of 3x8, which IS this
//                      row's slot: a student who answers 20 gets "Calculates
//                      3x8=20", false and refusable. Flagged only because 24
//                      is also printed in part (b)'s statement.
//   c0bf0b AK2  (b.i)  Part (b) HANDS them "24 = {}". Factorising 24 is the
//                      task, so 24 is the question's, not theirs.
//   c0bf0b CK3  (c.i)  Part (c) is "show that ... every 72 seconds", which
//                      holds only for 24 and 36. Both are the question's.
//   c0bf0b AK4  (c.i)  Same 24; {b.iii} is their own H.C.F. and stays, so the
//                      claim can still be false when their H.C.F. is wrong.
//   d16fbd AK2  (a.i)  A CAO ROW MUST NOT FOLLOW THROUGH. "CAO {a.i}" renders
//                      as "CAO <whatever they wrote>", which every answer
//                      satisfies — the one thing CAO exists to refuse.
//
// Previews by default; --yes applies.
// Run: pnpm tsx scripts/done/repair-constant-templates.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { isEntryPoint } from '../entry';

const FIXES: { ends: string; code: string; template: string }[] = [
  { ends: 'c0bf0b', code: 'AK2', template: 'Expresses $24$ as $2^3\\times3$.' },
  { ends: 'c0bf0b', code: 'CK3', template: 'Selects the relationship $\\operatorname{LCM}\\times\\operatorname{HCF}=24\\times36$.' },
  { ends: 'c0bf0b', code: 'AK4', template: 'Substitutes ${b.iii}$ and calculates $\\frac{24\\times36}{{b.iii}}=72$.' },
  { ends: 'd16fbd', code: 'AK2', template: 'Divides $72$ by $30$, CAO $2.4$' },
];

async function main() {
  await dbConnect();
  const all = await Question.find({}).select('_id rubric').lean<any[]>();
  const writes = new Map<unknown, Record<string, string>>();

  for (const fix of FIXES) {
    const q = all.find((x) => String(x._id).endsWith(fix.ends));
    if (!q) throw new Error(`no question ending ${fix.ends}`);
    const i = (q.rubric ?? []).findIndex((r: { code: string }) => r.code === fix.code);
    if (i < 0) throw new Error(`${fix.ends} has no ${fix.code}`);
    const row = q.rubric[i];
    console.log(`${fix.ends} ${fix.code} (${row.slot_ref})`);
    console.log(`  before: ${row.template}`);
    console.log(`  after : ${fix.template}`);
    if (row.template === fix.template) { console.log('  (already)\n'); continue; }
    console.log('');
    const set = writes.get(q._id) ?? {};
    set[`rubric.${i}.template`] = fix.template;
    writes.set(q._id, set);
  }

  if (writes.size === 0) { console.log('nothing to repair'); process.exit(0); }
  if (!process.argv.includes('--yes')) { console.log('preview only; pass --yes to apply'); process.exit(0); }

  let modified = 0;
  for (const [id, set] of writes) modified += (await Question.updateOne({ _id: id }, { $set: set })).modifiedCount;
  console.log(`questions modified: ${modified} of ${writes.size}`);
  process.exit(modified === writes.size ? 0 : 1);
}

// Only when run as a script: an import must not start the work.
if (isEntryPoint(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
