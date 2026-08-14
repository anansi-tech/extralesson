// Seed the `blueprints` collection with official paper allocations.
// Idempotent: upserts by (paper, module). Run: pnpm seed:blueprints
import 'dotenv/config';
import { dbConnect, Blueprint } from '@/lib/db';
import { seedBlueprints } from '@/lib/seed/blueprints';

function assertIntegrity() {
  for (const b of seedBlueprints) {
    if (b.paper === 'P1') {
      const items = b.allocations.reduce((s, a) => s + (a.items ?? 0), 0);
      if (items !== 20) throw new Error(`P1 M${b.module}: items sum ${items}, expected 20`);
      const { CK, AK, R } = b.profile_split;
      if (CK + AK + R !== 20) throw new Error(`P1 M${b.module}: profile split must sum to 20 items`);
    } else {
      const marks = b.allocations.reduce((s, a) => s + (a.marks ?? 0), 0);
      if (marks !== 30) throw new Error(`P2 M${b.module}: marks sum ${marks}, expected 30`);
      const { CK, AK, R } = b.profile_split;
      if (CK + AK + R !== 30) throw new Error(`P2 M${b.module}: profile split must sum to 30 raw marks`);
    }
  }
}

async function main() {
  assertIntegrity();
  await dbConnect();
  for (const b of seedBlueprints) {
    await Blueprint.updateOne({ paper: b.paper, module: b.module }, { $set: b }, { upsert: true });
  }
  console.log(`Seeded ${seedBlueprints.length} blueprints.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
