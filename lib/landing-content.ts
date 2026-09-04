import { computeCoverage, type Coverage } from '@/lib/targets/coverage';
import { module1Topics } from '@/lib/seed/module1-topics';
import { module2Topics } from '@/lib/seed/module2-topics';
import { module3Topics } from '@/lib/seed/module3-topics';
import { seedBlueprints } from '@/lib/seed/blueprints';
import { SITTINGS } from '@/lib/sittings';
import { isProduction } from '@/lib/preflight';

// Landing-page content constants (ROUND_1 §7). Every price, cap, stat and
// address is stated HERE and nowhere else — tests/legal.test.ts enforces it.
// Each external stat names its source in its label. See ROUND_3 §2.
export const LANDING = {
  price: '$49',
  // Derived from the same record the paywall expires against, never typed.
  sittingNote: Object.values(SITTINGS)
    .map((s) => s.label)
    .join(' & ')
    .toUpperCase(),
  // 3789/4481 non-CAO marks in the approved bank, 2026-08-25, floored.
  // report-bank.ts recomputes and flags this constant if the bank drifts.
  statWorking: '84%',
  statWorkingLabel:
    'Of the marks in our mark schemes are for the working, not the final answer',
  // CXC CSEC Mathematics Subject Report May/June 2025: mean 76.05 (38.02%).
  statAvgScore: '38%',
  statAvgScoreLabel: 'Mean mark in CSEC Mathematics\n76.05 of 200 · CXC, May/June 2025',
  contactEmail: 'extralesson@anansi.xyz',
} as const;

// Coverage computed from the same seeds the mastery map uses, so marketing
// cannot drift from the product (R1.6 §3).
export function landingCoverage(): Pick<
  Coverage,
  'displayPercent' | 'uncoveredMarks' | 'photographed'
> {
  const { displayPercent, uncoveredMarks, photographed } = computeCoverage(
    [...module1Topics, ...module2Topics, ...module3Topics],
    seedBlueprints,
  );
  return { displayPercent, uncoveredMarks, photographed };
}

// In production a dead CTA that looks alive is worse than failing loudly
// (ROUND_3 §1); locally the anchor fallback lets the page render without Stripe.
export function paymentLink(): string {
  const link = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK?.trim();
  if (link) return link;
  if (isProduction()) {
    throw new Error(
      'NEXT_PUBLIC_STRIPE_PAYMENT_LINK is unset, so the offer has nowhere to go.',
    );
  }
  return '#offer';
}
