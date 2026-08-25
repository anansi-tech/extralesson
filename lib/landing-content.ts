import { computeCoverage, type Coverage } from '@/lib/targets/coverage';
import { module1Topics } from '@/lib/seed/module1-topics';
import { module2Topics } from '@/lib/seed/module2-topics';
import { module3Topics } from '@/lib/seed/module3-topics';
import { seedBlueprints } from '@/lib/seed/blueprints';
import { SITTINGS } from '@/lib/sittings';

// Landing-page content constants (ROUND_1 §7): dates and counts live here,
// in one place. No fake counters anywhere.
export const LANDING = {
  price: '$25',
  places: 100,
  // No launch date and no countdown. It anchored the page to the January
  // re-sit, which is not the sitting most students take, and a date-based
  // urgency expires into a lie. The scarcity that is real is the cap above:
  // 100 places, enforced where the money is taken.
  //
  // The sittings are DERIVED, never typed. The page said "through the January
  // sitting" two lines from a note listing both, and since expiry shipped that
  // was not merely narrow but wrong: access runs to the sitting the STUDENT
  // registered for. One list, from the same record the paywall reads.
  sittingNote: Object.values(SITTINGS)
    .map((s) => s.label)
    .join(' & ')
    .toUpperCase(),
  /**
   * Share of our mark-scheme marks awarded for the working rather than the
   * final answer, measured over the approved structured bank on 2026-08-25:
   * 3789 of 4481 marks sit on rows that are not CAO. Recorded here rather than
   * queried on every render, and stated as a fact about OUR mark schemes,
   * because that is what was counted.
   */
  statWorking: '84%',
  statWorkingLabel:
    'Of the marks in our mark schemes are for\nthe working, not the final answer',
  statAvgScore: '38%',
  statAvgScoreLabel: 'The average CSEC Maths score\n(May/June 2024, out of 200 marks)',
  statBenchmark: '56%',
  statBenchmarkLabel: 'Of Caribbean students miss the\n5-subject benchmark incl. Maths',
  contactEmail: 'HELLO@ANANSI.XYZ',
} as const;

// R1.6 §3 — coverage stated up front, computed from the same syllabus seeds and
// blueprint the mastery map uses, so marketing cannot drift from the product.
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

export function paymentLink(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || '#offer';
}
