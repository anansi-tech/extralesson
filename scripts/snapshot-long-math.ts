// The width fixture by hand; approval takes it on its own (lib/admin/long-math-fixture.ts).
// Run: pnpm tsx scripts/snapshot-long-math.ts
import 'dotenv/config';
import { dbConnect } from '@/lib/db';
import { snapshotLongMath } from '@/lib/admin/long-math-fixture';

async function main() {
  await dbConnect();
  const out = await snapshotLongMath();
  if (!out) throw new Error('no tests/fixtures directory to write into');
  const n = (why: string) => out.filter((o) => o.why === why).length;
  console.log(`${out.length} questions: ${n('longest solution')} longest, ${n('longest inline math')} inline, ${n('set')} sets`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
