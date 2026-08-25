import Link from 'next/link';
import { LegalPage } from '../legal';
import { FREE_SESSIONS, REFUND_DAYS } from '@/lib/access';
import { GRACE_DAYS } from '@/lib/sittings';
import { landingCoverage } from '@/lib/landing-content';

export const metadata = { title: 'Terms — ExtraLesson' };

/**
 * The coverage numbers here are the SAME COMPUTED FIGURES the landing page
 * prints, read from the syllabus seeds rather than typed in — so the terms
 * cannot promise a coverage the product does not have, and cannot drift from
 * the claim on the front page.
 */
export default function TermsPage() {
  const coverage = landingCoverage();
  return (
    <LegalPage title="Terms" updated="25 August 2026">
      <p>
        ExtraLesson is CSEC Mathematics practice: original questions in exam style, marked the way
        an examiner awards marks. It is made by Anansi Technology LLC.
      </p>

      <h2>We are not CXC</h2>
      <p>
        ExtraLesson is <b>not affiliated with, endorsed by, or connected to the Caribbean
        Examinations Council</b>. CXC sets and marks the real examination; we are a practice tool
        built against the published syllabus. No question here is copied from a past paper.
      </p>

      <h2>What access buys</h2>
      <p>
        Without paying you get the diagnostic and {FREE_SESSIONS} full sessions. Access is bought
        for one exam sitting and gives you unlimited practice sessions{' '}
        <b>until that sitting is over</b>, plus {GRACE_DAYS} days after it. We do not charge again
        automatically — there is no subscription and nothing renews, so when access ends it simply
        ends.
      </p>
      <p>
        The grace period is there because the sitting does not finish the day your first paper
        does. If you go on to a later sitting, you buy access for that one.
      </p>
      <p>
        Everything you have already done stays visible whether you have paid or not. Paying is what
        lets you start a new session; it is not what makes your past work yours.
      </p>

      <h2>What we do not promise</h2>
      <ul>
        <li>
          <b>Not a grade.</b> The predicted grade is an estimate from your own answers. It is a way
          of seeing whether you are moving, not a forecast of your result, and nothing here
          guarantees any grade.
        </li>
        <li>
          <b>Marking can be wrong.</b> Questions and mark schemes are written by us and marking is
          partly automatic. Where the marking is unsure it withholds the mark rather than awarding
          it, so it is more likely to under-mark than over-mark. Tell us when you think it has your
          answer wrong — that is how it gets fixed.
        </li>
        <li>
          <b>We do not cover the whole paper.</b> About {coverage.displayPercent}% of a paper&rsquo;s
          marks are practised here. Roughly {coverage.photographed.marksEarnedByPhoto} marks a paper
          come from graphs you draw on paper and photograph. Construction with ruler and compasses —
          roughly {coverage.photographed.uncoveredMarks} marks — is not covered at all, and we do
          not prepare private candidates for Paper 032. This is stated on the front page too.
        </li>
      </ul>

      <h2>Your account</h2>
      <p>
        The account is yours: do not share the login. We may close an account that is being shared
        or used to copy questions out of the product in bulk. The questions, mark schemes and
        explanations are ours, and are for your own study rather than for republishing.
      </p>

      <h2>Refunds</h2>
      <p>
        If ExtraLesson is not what you expected, email us within {REFUND_DAYS} days of paying and
        we will refund you. Refunds after that are up to us, and we would rather sort out whatever
        went wrong.
      </p>

      <h2>Changes</h2>
      <p>
        We will keep building this while you are using it — questions get added, marking gets
        better. If we change these terms in a way that matters, the date at the top changes and we
        tell paying students by email.
      </p>

      <p className="text-dim">
        See also our{' '}
        <Link href="/privacy" className="underline">
          privacy page
        </Link>
        , which says what we store and for how long.
      </p>
    </LegalPage>
  );
}
