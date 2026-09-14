// Two faults on d16f3a, found by marking it and by yesterday's hint sweep.
//
// (c) slot `delivery` fills "a cement delivery {} be arranged", and accepted
// only "will" and "will be". The cloze admits synonyms the question never
// listed, so the independent solver answering "should" failed the gate on a
// correct answer. should / should be / must / must be join the list.
//
// CK3's hint was written in the marker's register — "Treat a percentage equal
// to the required percentage as meeting an at-least requirement" adjudicates
// whether a boundary case counts, which is what a marker decides, not what a
// student does. It is one of only two such hints in 3,820.
//
// Previews by default; --yes applies.
// Run: pnpm tsx scripts/done/repair-d16f3a.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { isEntryPoint } from '../entry';

const ENDS_WITH = 'd16f3a';
const ACCEPT = ['will be', 'should', 'should be', 'must', 'must be'];
const HINT = 'Exactly $55\\%$ still counts: "at least $55\\%$" includes $55\\%$ itself.';

async function main() {
  await dbConnect();
  const all = await Question.find({}).select('_id parts rubric').lean<any[]>();
  const q = all.find((x) => String(x._id).endsWith(ENDS_WITH));
  if (!q) throw new Error(`no question ending ${ENDS_WITH}`);

  const part = (q.parts ?? []).find((p: { label: string }) => p.label === 'c');
  const slot = part?.slots?.find((s: { label: string }) => s.label === 'delivery');
  const row = (q.rubric ?? []).find((r: { code: string }) => r.code === 'CK3');
  if (!slot || !row) throw new Error('c.delivery or CK3 is not where it was');

  console.log(`c.delivery accept  before: ${JSON.stringify(slot.accept ?? [])}`);
  console.log(`                    after: ${JSON.stringify(ACCEPT)}`);
  console.log(`\nCK3 hint           before: ${row.hint}`);
  console.log(`                    after: ${HINT}`);

  if (!process.argv.includes('--yes')) {
    console.log('\npreview only; pass --yes to apply');
    process.exit(0);
  }
  const res = await Question.updateOne(
    { _id: q._id },
    { $set: { 'parts.$[p].slots.$[s].accept': ACCEPT, 'rubric.$[r].hint': HINT } },
    { arrayFilters: [{ 'p.label': 'c' }, { 's.label': 'delivery' }, { 'r.code': 'CK3' }] },
  );
  console.log(`\nmodified: ${res.modifiedCount}`);
  process.exit(res.modifiedCount === 1 ? 0 : 1);
}

// Only when run as a script: an import must not start the work.
if (isEntryPoint(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
