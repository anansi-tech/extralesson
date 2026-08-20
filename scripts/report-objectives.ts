// Objective-level coverage: what the topic aggregates hide.
//
// The matrix reports a topic against its share of the blueprint's marks, and a
// topic can sit at 185% of that while most of its objectives have never been
// assessed at all — its questions piled onto the two or three objectives the
// recipe kept re-picking. Every gap found by audit so far has been an instance
// of that, in whichever corner the audit happened to look.
//
// ROUND_1_5_FINAL §4 set the floor: at least two approved questions per
// objective where that is mathematically sensible. It was specified and never
// implemented as a deficit, so nothing converged on it.
//
// Run: pnpm tsx scripts/report-objectives.ts [--gaps]
import 'dotenv/config';
import { dbConnect, Question, Topic } from '@/lib/db';
import { OBJECTIVE_FLOOR } from '@/lib/targets/objectives';

interface TopicLean {
  code: string;
  title: string;
  module: 1 | 2 | 3;
  order: number;
  objectives: { id: string; text: string; assessable?: boolean; partial_reason?: string }[];
}

async function main() {
  const gapsOnly = process.argv.includes('--gaps');
  await dbConnect();
  const [topics, questions] = await Promise.all([
    Topic.find().sort({ module: 1, order: 1 }).lean<TopicLean[]>(),
    Question.find({ status: { $in: ['draft', 'approved'] } })
      .select('objective_ids status')
      .lean<{ objective_ids: string[]; status: string }[]>(),
  ]);

  const approved = new Map<string, number>();
  const draft = new Map<string, number>();
  for (const q of questions) {
    const into = q.status === 'approved' ? approved : draft;
    // An objective is covered by a question that DECLARES it. Nothing is
    // inferred from wording — a question that uses the sine rule without
    // declaring M3.3.7 is an under-tagging to be fixed, not coverage.
    for (const id of new Set(q.objective_ids)) into.set(id, (into.get(id) ?? 0) + 1);
  }

  let assessable = 0;
  let atZero = 0;
  let belowOne = 0;
  let belowFloor = 0;
  const zeroByTopic = new Map<string, string[]>();

  for (const t of topics) {
    const rows = t.objectives.filter((o) => o.assessable !== false);
    if (rows.length === 0) continue;
    const lines: string[] = [];
    for (const o of rows) {
      assessable++;
      const a = approved.get(o.id) ?? 0;
      const d = draft.get(o.id) ?? 0;
      if (a === 0) {
        atZero++;
        belowOne++;
        (zeroByTopic.get(t.code) ?? zeroByTopic.set(t.code, []).get(t.code)!).push(o.id);
      }
      if (a < OBJECTIVE_FLOOR) belowFloor++;
      if (gapsOnly && a >= OBJECTIVE_FLOOR) continue;
      const mark = a === 0 ? '✗' : a < OBJECTIVE_FLOOR ? '·' : ' ';
      lines.push(
        `    ${mark} ${o.id.padEnd(9)} ${String(a).padStart(2)} approved${d ? ` +${d} draft` : ''}   ${o.text.slice(0, 62)}`,
      );
    }
    if (lines.length === 0) continue;
    const covered = rows.filter((o) => (approved.get(o.id) ?? 0) >= OBJECTIVE_FLOOR).length;
    console.log(`\n  ${t.code} — ${t.title}   ${covered}/${rows.length} at floor ${OBJECTIVE_FLOOR}`);
    for (const l of lines) console.log(l);
  }

  console.log(`\n${'='.repeat(72)}`);
  console.log(`ASSESSABLE OBJECTIVES        ${assessable}`);
  console.log(`  never assessed (0 approved)  ${atZero}  (${Math.round((atZero / assessable) * 100)}%)`);
  console.log(`  below floor 1                ${belowOne}`);
  console.log(`  below floor ${OBJECTIVE_FLOOR} (§4)           ${belowFloor}  (${Math.round((belowFloor / assessable) * 100)}%)`);
  console.log(`  at or above floor ${OBJECTIVE_FLOOR}          ${assessable - belowFloor}`);
  console.log(`\nCost to reach floor 1: ${atZero} objectives with no question at all.`);
  console.log(`A d3 integration question declares 3, so the floor-1 gap is`);
  console.log(`  ${atZero} questions at worst, ~${Math.ceil(atZero / 3)} if every zero can be paired inside its topic.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
