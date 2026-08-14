// Seed the `topics` collection from design/syllabus-2027.pdf transcriptions.
// Idempotent: upserts by topic code. Run: pnpm seed:topics
import 'dotenv/config';
import { dbConnect, Topic } from '@/lib/db';
import { module1Topics } from '@/lib/seed/module1-topics';
import { module2Topics } from '@/lib/seed/module2-topics';
import { module3Topics } from '@/lib/seed/module3-topics';
import { OBJECTIVE_ID_RE } from '@/lib/validation/question';

const allTopics = [...module1Topics, ...module2Topics, ...module3Topics];

function assertIntegrity() {
  if (allTopics.length !== 15) throw new Error(`expected 15 topics, got ${allTopics.length}`);
  const codes = new Set(allTopics.map((t) => t.code));
  if (codes.size !== 15) throw new Error('duplicate topic codes');
  const ids = new Set<string>();
  for (const t of allTopics) {
    for (const o of t.objectives) {
      if (!OBJECTIVE_ID_RE.test(o.id)) throw new Error(`bad objective id ${o.id}`);
      if (!o.id.startsWith(`M${t.module}.`)) throw new Error(`${o.id} not in module ${t.module}`);
      if (ids.has(o.id)) throw new Error(`duplicate objective id ${o.id}`);
      ids.add(o.id);
    }
  }
}

async function main() {
  assertIntegrity();
  await dbConnect();
  for (const t of allTopics) {
    await Topic.updateOne({ code: t.code }, { $set: t }, { upsert: true });
  }
  const count = await Topic.countDocuments();
  console.log(`Seeded ${allTopics.length} topics (collection now has ${count}).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
