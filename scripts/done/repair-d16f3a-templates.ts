// Three claim templates on d16f3a stood the fixed requirement 55% as {b.i},
// so a student whose part (b) read 67.3% was marked against "an amount equal
// to 67.3% satisfies the condition at least 67.3%" — true of any number.
//
// Only the student's own value is a reference; the requirement is a constant
// of the question and stays literal. Where a row carries both — AK4 compares
// their percentage with the requirement AND states their difference — the
// reference to their value is kept.
//
// deriveTemplate would have refused these: it reports a literal that is both a
// question constant and a slot's value as ambiguous, and leaves it alone. It
// never saw 55 as a constant because the requirement is written in part (c)'s
// cloze STATEMENT, which questionText did not collect. That is fixed beside
// this, so a re-run cannot repeat it.
//
// Previews by default; --yes applies.
// Run: pnpm tsx scripts/done/repair-d16f3a-templates.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { isEntryPoint } from '../entry';

const ENDS_WITH = 'd16f3a';

/** code -> the template it should carry. */
const FIXED: Record<string, string> = {
  // Their amount, against the requirement stated in the question.
  CK3: 'Recognises that an amount equal to ${b.i}\\%$ satisfies the condition “at least $55\\%$”.',
  R2: 'Compares "their" percentage with the required $55\\%$ and identifies that they are equal.',
  // {c.difference} is genuinely theirs and stays.
  AK4: 'Calculates the difference between "their" percentage and $55\\%$ as ${c.difference}$ percentage points.',
};

async function main() {
  await dbConnect();
  const all = await Question.find({}).select('_id rubric').lean<any[]>();
  const q = all.find((x) => String(x._id).endsWith(ENDS_WITH));
  if (!q) throw new Error(`no question ending ${ENDS_WITH}`);

  const set: Record<string, string> = {};
  for (const [i, r] of (q.rubric ?? []).entries()) {
    const want = FIXED[r.code as string];
    if (!want || r.template === want) continue;
    console.log(`${r.code} (${r.slot_ref})`);
    console.log(`  before: ${r.template}`);
    console.log(`  after : ${want}\n`);
    set[`rubric.${i}.template`] = want;
  }
  if (Object.keys(set).length === 0) {
    console.log('nothing to repair');
    process.exit(0);
  }
  if (!process.argv.includes('--yes')) {
    console.log('preview only; pass --yes to apply');
    process.exit(0);
  }
  const res = await Question.updateOne({ _id: q._id }, { $set: set });
  console.log(`modified: ${res.modifiedCount}`);
  process.exit(res.modifiedCount === 1 ? 0 : 1);
}

// Only when run as a script: an import must not start the work.
if (isEntryPoint(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
