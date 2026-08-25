import { LegalPage } from '../legal';
import { IMAGE_TTL_DAYS } from '@/lib/db/transcription';

export const metadata = { title: 'Privacy — ExtraLesson' };

/**
 * Every claim on this page is one the code makes true, and was checked against
 * the code when it was written: the image TTL is read from the schema constant
 * rather than typed as a number, the list of what is stored is the list of
 * fields we store, and the two companies named are the only two that receive
 * anything.
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="25 August 2026">
      <p>
        ExtraLesson is used by secondary school students, so this is written to be read rather than
        agreed to. It says what we hold, how long we hold it, and who else sees it.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>
          <b>Your account.</b> Name, email address, the island you chose, your exam sitting and the
          modules you are working towards. Your password is stored only as a scrambled hash — we
          cannot read it, and nobody here can tell you what it is.
        </li>
        <li>
          <b>Your work.</b> Every answer you submit, what it scored, and which mark scheme rows you
          earned. Answers you have typed but not submitted are kept as a draft for 30 days so you
          can come back to a session.
        </li>
        <li>
          <b>Photographs of your working</b>, when you choose to take one, and the typed-up reading
          of what was on the page.
        </li>
        <li>
          <b>Payment records.</b> The email address, amount and reference Stripe sends us when you
          pay. Card numbers are entered on Stripe&rsquo;s own page and never reach us.
        </li>
      </ul>

      <h2>Photographs are deleted after {IMAGE_TTL_DAYS} days</h2>
      <p>
        A photograph of your working is deleted automatically {IMAGE_TTL_DAYS} days after you take
        it. This is not a promise someone has to remember to keep — the database deletes it on a
        timer.
      </p>
      <p>
        The <b>typed-up reading</b> of that photograph is kept, along with the marks it earned. That
        is what lets you look back at a question weeks later and see what your working showed. It is
        text, not an image of your handwriting.
      </p>

      <h2>Nothing is used to train models</h2>
      <p>
        We do not train, tune or build any model on your work, and we never will without asking you
        first, in plain words, for that specific purpose.
      </p>
      <p>
        Being straight about how the marking works: to read your handwriting and check your working
        against the mark scheme, the photograph and your typed answers are sent to our AI provider
        (OpenAI) to be read, and the result comes straight back to us. That is the only reason
        anything is sent, and it is deleted here on the timer above. What OpenAI does with API
        requests is governed by their own terms rather than ours, so we point you at them rather
        than making a promise on their behalf.
      </p>

      <h2>Who else sees anything</h2>
      <p>Two companies, each for one job:</p>
      <ul>
        <li>
          <b>OpenAI</b> — reads photographs of your working and checks it against the mark scheme.
        </li>
        <li>
          <b>Resend</b> — sends your password reset email. It receives your email address and
          nothing else.
        </li>
      </ul>
      <p>
        Stripe handles payment on its own page and tells us that an address has paid. Our app runs
        on Vercel and our database is MongoDB Atlas, so both hold the data in the ordinary course of
        hosting it.
      </p>
      <p>
        <b>We do not sell your data, and we do not share it for advertising.</b> There is no
        advertising on ExtraLesson and no tracking pixels in it.
      </p>

      <h2>Deleting your account</h2>
      <p>
        Email us from the address on your account and say you want it deleted. We remove your
        account, your answers, your marks and any readings of your working, and we confirm when it
        is done. There is no button for this yet — it is done by hand, by a person, which is also
        why we ask you to email from the address we can check.
      </p>
      <p>
        If you only want to stop, you can simply stop; nothing is charged again unless you buy
        access again.
      </p>

      <h2>Students under 18</h2>
      <p>
        Most people using ExtraLesson are 14 to 18. A parent or guardian can email us to see what we
        hold on their child or to have it deleted, and we will ask enough to be sure the account is
        theirs before doing either.
      </p>
    </LegalPage>
  );
}
