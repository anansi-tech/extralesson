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
  /** The h1 as it stands; app/page.tsx prints it and the share image reads it. */
  headline: 'Practise CSEC Maths the way you’ll sit it.',
  domain: 'extralesson.app',
  price: '$49',
  // Derived from the same record the paywall expires against, never typed.
  sittingNote: Object.values(SITTINGS)
    .map((s) => s.label)
    .join(' & ')
    .toUpperCase(),
  // THE BAND (ROUND_7 Task 4): two lines, each with its caption and its
  // source, checked on cxc.org on 2026-09-05. No effective date is stated
  // unless the document prints one.
  //
  // CSEC Mathematics Subject Report, May–June 2026 (cxc.org, subject reports):
  // "Overall, 23 169 candidates (36.02 per cent of candidates) gained
  // acceptable grades (Grades I–III)" of 79 917 entered.
  passRate: {
    figure: '36%',
    label: 'of candidates passed',
    caption: '36% gained Grades I–III, CXC CSEC Mathematics Subject Report, May–June 2026',
    percent: 36,
    source: 'https://www.cxc.org/wp-content/uploads/2018/11/RPT2026CSECMayJuneMathematicsSubjectReport.pdf',
    sourceLabel: 'CXC Subject Report, May–June 2026',
  },
  // CSEC Mathematics syllabus CXC 05/G/SYLL 16, amended 2025 and 2026,
  // "Effective for examinations from May–June 2027": the assessment grid
  // gives Paper 02 as 15 CK, 20 AK, 15 R weighted marks of 50 — AK and R
  // are 35 of 50, which is 70 of every 100.
  weighting: {
    figure: '70%',
    label: 'of Paper 2 marks are for method',
    caption: 'Assessment grid, CSEC Mathematics syllabus CXC 05/G/SYLL 16, effective for examinations from May–June 2027',
    percent: 70,
    source: 'https://www.cxc.org/wp-content/uploads/2018/11/CSEC-Mathematics-Amended-2026-for-Exams-2027V2.pdf',
    sourceLabel: 'CXC syllabus, from May–June 2027',
  },
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
