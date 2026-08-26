import { computeCoverage, type Coverage } from '@/lib/targets/coverage';
import { module1Topics } from '@/lib/seed/module1-topics';
import { module2Topics } from '@/lib/seed/module2-topics';
import { module3Topics } from '@/lib/seed/module3-topics';
import { seedBlueprints } from '@/lib/seed/blueprints';
import { SITTINGS } from '@/lib/sittings';
import { isProduction } from '@/lib/preflight';

// Landing-page content constants (ROUND_1 §7): dates and counts live here,
// in one place. No fake counters anywhere.
/**
 * THE SWITCH, when the hundred places fill.
 *
 * There is no automatic path and there will not be one: reading the remaining
 * count needs the Stripe API call the kill list forbids. So the job is to make
 * the change SMALL and findable rather than clever.
 *
 * Every NUMBER and the offer's NAME are here, and nothing on any surface states
 * either by hand — a test enforces that. What is left is prose that has to be
 * read and rewritten, not substituted, and it is listed so the switch is a
 * checklist rather than a hunt:
 *
 *   1. NEXT_PUBLIC_STRIPE_PAYMENT_LINK -> the $45 live link, in Vercel.
 *   2. price -> '$45'.
 *   3. The cap comes off. `places` and the offer name below stop being true,
 *      and `app/page.tsx` carries three lines that are Founding-Families
 *      framing rather than a name to swap:
 *        · the hero eyebrow "· N FAMILIES ONLY"
 *        · the offer eyebrow "Founding Families · N places"
 *        · the offer bullet "Founding Family price locked for life…"
 *      The first two lose the cap clause; the third is a promise made to the
 *      hundred and is deleted, not reworded.
 *   4. Re-read the FAQ's "building this with the first N families".
 */
export const LANDING = {
  price: '$25',
  /** The offer's name, so it is one change and not four. */
  offerName: 'Founding Families',
  offerMember: 'Founding Family',
  /**
   * A CAP IS A CLAIM ABOUT USAGE, so it is checked rather than asserted.
   *
   * Checked in the Stripe dashboard on 25 Aug 2026: an "ExtraLesson — CSEC
   * Mathematics" payment link priced $25.00 reads `Limited use: 1 of 100 used`,
   * so Stripe refuses the hundred-and-first payment against it and this number
   * is not a promise kept by remembering.
   *
   * NOT YET ESTABLISHED: which MODE that link is in. The capture did not show
   * the test/live indicator or the link id, and production is known to point at
   * a test-mode link. Until that is confirmed, the cap is verified on "the link
   * shown" rather than on the live one, and "99 remaining" is an unknown link's
   * arithmetic. ROUND_3 §2.
   *
   * Two operational consequences, recorded because neither has an automatic
   * path — reading remaining uses would need the API call the kill list
   * forbids. When the hundred fill, the link stops working and this number and
   * the copy around it have to come off by hand. And the claim is only true of
   * the link the button actually points at: NEXT_PUBLIC_STRIPE_PAYMENT_LINK
   * must be the live $25 link, not a test-mode one. ROUND_3 §2.
   */
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
  /**
   * THE MEAN MARK, not a pass rate. It was labelled "the average CSEC Maths
   * score" for May/June 2024, which was both vague and the wrong year.
   *
   * Source: CXC CSEC Mathematics Subject Report, May/June 2025 (held in
   * design/reference/, not in this repo's shipped code). Verified against the
   * report text: "The mean score of 76.05 (38.02 per cent) was comparable with
   * 76.71 (38.35 per cent) in 2024". Floored to 38%, as every claim about a
   * measurement here is.
   */
  statAvgScore: '38%',
  statAvgScoreLabel: 'Mean mark in CSEC Mathematics\n76.05 of 200 · CXC, May/June 2025',
  /**
   * THE PASS RATE. The figure this replaced — "56% of Caribbean students miss
   * the 5-subject benchmark incl. Maths" — had no source anyone could produce.
   *
   * Source: CXC's August 2026 results release, as reported by Barbados Today,
   * quoting Dr Manning directly — 42 per cent of candidates earned Grades I–III
   * in CSEC Mathematics regionally in 2026.
   *
   * THE OTHER FIGURE IN THE ROOM, recorded so nobody has to rediscover it and
   * wonder which is right. The CSEC Mathematics Subject Report for May/June
   * 2025 gives 36.11 per cent for 2025, 36.33 per cent for 2024 and 36.88 per
   * cent for 2022. THE SCOPES DIFFER: a subject report states the outcome for
   * the one sitting it examines, while a figure quoted at a results release
   * need not be on the same base — and the years differ besides. The gap
   * between 36 and 42 is therefore not a one-year jump and must not be read as
   * one.
   *
   * The page carries the 2026 release figure, cited to CXC in the label, which
   * is whose figure it is. It is the only number here resting on a source this
   * repo does not hold, which is why the chain is written out in full.
   */
  statBenchmark: '42%',
  statBenchmarkLabel: 'Of candidates passed CSEC Mathematics\nGrades I–III · CXC, August 2026',
  contactEmail: 'EXTRALESSON@ANANSI.XYZ',
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

/**
 * NO SILENT FALLBACK IN PRODUCTION (ROUND_3 §1).
 *
 * '#offer' scrolls the reader back to the paragraph they just finished. It
 * looks like a working button and it is a lost sale that leaves no trace — no
 * error, no log line, nothing on the page to say the product cannot be bought.
 * Boot refuses to start without the variable, so reaching here unset in
 * production means something bypassed that, and the honest response is to fail
 * where it happens rather than serve a dead CTA.
 *
 * Locally the fallback stays: a developer reading the landing page does not
 * need a Stripe link to do it.
 */
export function paymentLink(): string {
  const link = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK?.trim();
  if (link) return link;
  if (isProduction()) {
    throw new Error(
      'NEXT_PUBLIC_STRIPE_PAYMENT_LINK is unset, so the offer has nowhere to go. ' +
        'A dead button that looks alive is worse than a page that will not render.',
    );
  }
  return '#offer';
}
