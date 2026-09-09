// ROUND_11 Task 5. Reports by default and writes nothing; --apply writes.
// Run: pnpm tsx scripts/migrate-payment-state.ts [--apply]
import 'dotenv/config';
import { dbConnect } from '@/lib/db';
import { applyMigration, planMigration } from '@/lib/db/migrate-payment-state';

async function main() {
  const apply = process.argv.includes('--apply');
  await dbConnect();
  const plan = await planMigration();

  console.log(`\n== ${plan.totals.payments} payments · ${plan.totals.fulfilments} fulfilments`);
  console.log(`\n== derived state, ${plan.updates.length + plan.creates.length} rows`);
  for (const [state, n] of Object.entries(plan.counts).sort((a, b) => b[1] - a[1])) console.log(`  ${state.padEnd(10)} ${n}`);
  const by = plan.updates.reduce<Record<string, number>>((acc, u) => ({ ...acc, [u.derived.by]: (acc[u.derived.by] ?? 0) + 1 }), {});
  console.log(`  decided by : ${Object.entries(by).map(([k, v]) => `${k}=${v}`).join(' · ') || 'nothing to decide'}`);
  console.log(`  new rows from a fulfilment with no payment: ${plan.creates.length}`);
  console.log(`  already settled by a live transition, left alone: ${plan.live.length}`);

  console.log(`\n== payments with no fulfilment to link to: ${plan.noFulfilment.length}`);
  for (const p of plan.noFulfilment) console.log(`  ${p.id} · session ${p.session_id ?? '—'} · event ${p.event_id}`);

  console.log(`\n== ambiguous, which block the deletion: ${plan.ambiguous.length}`);
  for (const a of plan.ambiguous) console.log(`  ${a.id} · session ${a.session_id ?? '—'} · ${a.why}\n      ${a.detail ?? ''}`);

  if (!apply) {
    console.log('\nreport only — nothing was written. Re-run with --apply once these counts are agreed.');
    process.exit(0);
  }
  const written = await applyMigration();
  console.log(`\nwritten: ${written.updated} updated · ${written.created} created · ${written.skipped} skipped`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
