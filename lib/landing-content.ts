import { computeCoverage } from '@/lib/targets/coverage';
import { module1Topics } from '@/lib/seed/module1-topics';
import { module2Topics } from '@/lib/seed/module2-topics';
import { module3Topics } from '@/lib/seed/module3-topics';
import { seedBlueprints } from '@/lib/seed/blueprints';

// Landing-page content constants (ROUND_1 §7): dates and counts live here,
// in one place. No fake counters anywhere.
export const LANDING = {
  price: '$25',
  places: 100,
  launchDate: 'NOVEMBER 1',
  sittingNote: 'JANUARY RE-SIT & MAY/JUNE 2027',
  statAvgScore: '38%',
  statAvgScoreLabel: 'The average CSEC Maths score\n(May/June 2024, out of 200 marks)',
  statBenchmark: '56%',
  statBenchmarkLabel: 'Of Caribbean students miss the\n5-subject benchmark incl. Maths',
  contactEmail: 'HELLO@ANANSI.XYZ',
} as const;

// R1.6 §3 — coverage stated up front, computed from the same syllabus seeds and
// blueprint the mastery map uses, so marketing cannot drift from the product.
export function landingCoverage(): { percent: number; uncoveredMarks: number } {
  const { percent, uncoveredMarks } = computeCoverage(
    [...module1Topics, ...module2Topics, ...module3Topics],
    seedBlueprints,
  );
  return { percent, uncoveredMarks };
}

export function paymentLink(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || '#offer';
}
