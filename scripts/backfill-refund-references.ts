// ROUND_12 Task 0. Reports by default and writes nothing; --apply writes the
// grant links, which are the part provable without Stripe.
// Run: pnpm tsx scripts/backfill-refund-references.ts [--apply]
import 'dotenv/config';
import { dbConnect } from '@/lib/db';
import { applyGrantLinks, applyStripeReferences, planRefundReferences, resolveFromStripe } from '@/lib/db/backfill-refund-references';

async function main() {
  const apply = process.argv.includes('--apply');
  await dbConnect();
  const plan = await planRefundReferences();

  const key = process.env.STRIPE_SECRET_KEY?.trim();
  const mode = key?.startsWith('sk_live') ? 'live' : key?.startsWith('sk_test') ? 'test' : 'unknown';
  console.log(`\n== STRIPE_SECRET_KEY: ${key ? `present, ${mode} mode` : 'ABSENT'}`);
  if (!key) console.log('   Without it nothing can be resolved from Stripe, and no refund can be issued.');

  console.log(`\n== ${plan.totals.payments} payments · ${plan.totals.grants} grants`);
  console.log(`\n== payments missing a reference: ${plan.gaps.length}`);
  const byKind = plan.gaps.reduce<Record<string, number>>((a, g) => ({ ...a, [g.kind]: (a[g.kind] ?? 0) + 1 }), {});
  console.log(`   by key: ${Object.entries(byKind).map(([k, v]) => `${k}=${v}`).join(' · ') || 'none'}`);
  for (const g of plan.gaps) {
    console.log(`   ${g.id} · ${g.state.padEnd(9)} · ${g.kind === 'legacy-event' ? 'event' : 'session'} ${g.lookup} · needs ${g.needs.join(', ')}`);
  }

  console.log(
    `\n== grants: ${plan.links.length} provable · ${plan.comps.length} comps · ${plan.unresolvedGrants.length} paid but unresolved · ${plan.unlabelledGrants.length} unlabelled`,
  );
  for (const l of plan.links) console.log(`   link  ${l.studentId} · ${l.source} · payment ${l.paymentId}`);
  for (const c of plan.comps) console.log(`   comp  ${c.studentId} · ${c.source} · no payment, and none wanted`);
  // NOT comps: the account has paid, and which payment this grant is for is unknown.
  for (const u of plan.unresolvedGrants) console.log(`   UNRESOLVED ${u.studentId} · ${u.source} · ${u.paymentsOnAccount} payment(s) on the account · ${u.why}`);
  // No payment on the account at all: nothing to refund, and the note never said comp.
  for (const u of plan.unlabelledGrants) console.log(`   unlabelled ${u.studentId} · ${u.source} · no payments on the account · ${u.why}`);

  if (!apply) {
    // A dry read of the first of each kind, so the report says whether Stripe
    // can answer at all before anyone agrees to a write.
    if (key) {
      for (const kind of ['session', 'legacy-event'] as const) {
        const first = plan.gaps.find((g) => g.kind === kind);
        if (!first) continue;
        const r = await resolveFromStripe(first);
        console.log(`   dry read (${kind}): ${first.lookup} -> ${r.payment_intent_id ?? '—'} · ${r.paid_at?.toISOString() ?? '—'}${r.why ? ` · ${r.why}` : ''}`);
      }
    }
    console.log('\nreport only — nothing was written.');
    process.exit(0);
  }

  const { resolved, written } = await applyStripeReferences(plan.gaps);
  const unresolved = resolved.filter((r) => !r.payment_intent_id || !r.paid_at);
  console.log(`\nwritten: ${written} payments given a reference · ${unresolved.length} still unresolved`);
  for (const r of unresolved) console.log(`   UNRESOLVED ${r.id} · ${r.why ?? 'no reason given'}`);

  const { linked } = await applyGrantLinks();
  console.log(`written: ${linked} grants linked to their payment`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
