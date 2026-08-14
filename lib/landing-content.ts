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

export function paymentLink(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || '#offer';
}
