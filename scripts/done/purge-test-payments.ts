// One-off: delete the pilot's test-mode payments and the refund requests that
// point at them. Reports by default and writes nothing; --apply writes.
// Refuses on a live key or a live payment — this deletes financial records.
// Run: pnpm tsx scripts/done/purge-test-payments.ts [--apply]
import 'dotenv/config';
import { dbConnect } from '@/lib/db';
import { applyPurge, planPurge } from '@/lib/db/purge-test-payments';

async function main() {
  const apply = process.argv.includes('--apply');
  await dbConnect();
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  const mode = key?.startsWith('sk_live') ? 'LIVE' : key?.startsWith('sk_test') ? 'test' : 'unknown';
  console.log(`\n== STRIPE_SECRET_KEY: ${key ? `present, ${mode} mode` : 'ABSENT'}`);

  const plan = await planPurge();
  console.log(`\n== ${plan.payments.length} payments · test ${plan.test.length} · live ${plan.live.length} · unproven ${plan.unknown.length}`);
  for (const p of plan.test) console.log(`   delete  ${p.id} · ${p.state.padEnd(9)} · ${p.session_id} · ${p.why}`);

  console.log(`\n== refund requests going with them: ${plan.requests.length}`);
  for (const r of plan.requests) console.log(`   delete  ${r.id} · payment ${r.payment_id}`);

  console.log('\n== left behind');
  for (const p of plan.live) console.log(`   LIVE PAYMENT ${p.id} · ${p.session_id} · ${p.why}`);
  for (const p of plan.unknown) console.log(`   unproven     ${p.id} · ${p.state} · ${p.session_id} · ${p.why}`);
  for (const r of plan.requestsLeft) console.log(`   request      ${r.id} · points at a payment that stays (${r.payment_id})`);
  // A grant naming a payment that is about to go: delete the accounts first.
  for (const g of plan.danglingGrants) console.log(`   GRANT        ${g.studentId} · ${g.email} · names payment ${g.payment_id}, which this would delete`);
  if (plan.live.length + plan.unknown.length + plan.requestsLeft.length + plan.danglingGrants.length === 0) console.log('   nothing');

  if (!apply) {
    console.log('\nreport only — nothing was written.');
    process.exit(0);
  }
  const res = await applyPurge(plan);
  if (!res.ok) {
    console.error(`\nREFUSED: ${res.reason}`);
    process.exit(1);
  }
  console.log(`\ndeleted: ${res.payments} payments · ${res.requests} refund requests`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
