import type { Metadata } from 'next';
import './landing.css';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Link from 'next/link';
import { Lockup } from './lockup';
import { LANDING, landingCoverage, paymentLink } from '@/lib/landing-content';
import { grantFor, hasAccess, REFUND_DAYS, type Access } from '@/lib/access';
import { dbConnect, Student } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

// This page, not any design file, is the source of truth for the landing copy
// (ROUND_1 §7).

export const metadata: Metadata = {
  title: 'ExtraLesson — Practise CSEC Maths the way you’ll sit it',
  description:
    `Work original, past-paper-style questions on paper. Photograph your page. See where your working earns marks — and where it loses them — so you know what to improve before exam day. ${LANDING.price} through your chosen exam sitting.`,
  openGraph: {
    title: 'ExtraLesson — Practise CSEC Maths the way you’ll sit it',
    description:
      `Photograph your working. See where it earns marks — and where it loses them — before exam day. ${LANDING.price}.`,
    type: 'website',
    // A page's openGraph REPLACES the layout's rather than merging into it, so
    // the url declared there does not reach the one page anybody shares. It is
    // repeated here for that reason, resolved against metadataBase.
    url: '/',
  },
};

// Reading the session cookie renders this page per request rather than
// statically — the cost of the header knowing who you are. Without it everyone
// who has already bought the product finds two buy buttons and no way in.

// The photograph is a file in public/, so its absence is a fact of the
// deployment rather than a broken image.
const FOUNDER_PHOTO = '/brand/david.jpg';
const founderPhotoExists = () => existsSync(join(process.cwd(), 'public', FOUNDER_PHOTO));

export default async function LandingPage() {
  const coverage = landingCoverage();
  const photo = founderPhotoExists();
  const session = await getSession();
  // A STUDENT WHO HAS PAID MUST NOT BE SOLD TO AGAIN: without an access check
  // they meet two buy buttons and a checkout that would charge them twice.
  // Signed in WITHOUT access still sees the offer — they are who it is for.
  let signedInWithAccess = false;
  if (session) {
    await dbConnect();
    const student = await Student.findById(session.student_id)
      .select('access exam_sitting')
      .lean<{ access?: Access | null; exam_sitting: string } | null>();
    signedInWithAccess = hasAccess(grantFor(student?.access, student?.exam_sitting ?? ''));
  }
  return (
    <div className="landing">
      {/* THE BAR. Signed out: Sign in. Signed in: the way back to the notebook. */}
      <div className="bar">
        <div className="wrap barrow">
          <Lockup width={130} className="lockup-sm" />
          <Lockup width={140} className="lockup-lg" />
          {session ? (
            <Link className="authlink" href="/study">
              Continue studying &rarr;
            </Link>
          ) : (
            <Link className="authlink" href="/study/login">
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* GOAL, STAKES, PROOF. One telling of each idea, one action in the
          hero; the marked page after the stakes on a phone and beside the hero
          on a desk (Landing.dc.html §01). */}
      <div className="top">
      <header className="hero">
        <div className="wrap">
          <div className="herotext">
            <h1>Practise CSEC Maths the way you&rsquo;ll sit it.</h1>
            <p className="lede">
              Work original, past-paper-style questions on paper. Photograph your page. See where your
              working earns marks &mdash; and where it loses them &mdash; so you know what to improve
              before exam day.
            </p>
            {signedInWithAccess ? (
              <Link className="btn" href="/study">
                Continue studying
                <small>YOUR ACCESS IS ACTIVE · PICK UP WHERE YOU LEFT OFF</small>
              </Link>
            ) : (
              <Link className="btn" href="/study/login?new=1">
                Mark one question free
                <small>No card required.</small>
              </Link>
            )}
            <div className="heronote">{LANDING.sittingNote}</div>
          </div>
        </div>
      </header>

      {/* STAKES. Two tiles, each naming a source you can open (ROUND_8 Task 5). */}
      <div className="stats">
        <div className="tiles">
          <div className="tile">
            <div className="n red">{LANDING.passRate.figure}</div>
            <div className="l">{LANDING.passRate.label}</div>
            <a href={LANDING.passRate.source} target="_blank" rel="noopener">{LANDING.passRate.sourceLabel}</a>
          </div>
          <div className="tile">
            <div className="n">{LANDING.weighting.figure}</div>
            <div className="l">{LANDING.weighting.label}</div>
            <a href={LANDING.weighting.source} target="_blank" rel="noopener">{LANDING.weighting.sourceLabel}</a>
          </div>
        </div>
      </div>
      <div className="phone heromock">
        <div className="page">
          <div className="q">
            <b>4.</b> Solve for x: 3x² − 5x − 2 = 0 <span className="qm">[3 marks]</span>
          </div>
          <div className="work">
            <span className="score-pill">2 / 3</span>
            <div className="cap">Your working</div>
            <div className="hand">
              (3x + 1)(x − 2) = 0 <span className="tick">✓</span>
              <br />
              3x + 1 = 0 → x = 1/3{' '}
              <span className="tick slip">✗ sign</span>
              <br />x − 2 = 0 → x = 2 <span className="tick">✓</span>
            </div>
          </div>
          <div className="markrow">
            <span>Method — correct factorisation</span>
            <span className="aw y">✓ AWARDED</span>
          </div>
          <div className="markrow">
            <span>Method — both roots attempted</span>
            <span className="aw y">✓ AWARDED</span>
          </div>
          <div className="markrow">
            <span>Accuracy — both roots correct</span>
            <span className="aw n">✗ LOST</span>
          </div>
          <div className="verdict">
            <div className="vt">Sign slip — a classic.</div>
            <div className="vm">
              3x + 1 = 0 gives x = <b>−1/3</b>. You&rsquo;d lose this exact mark on Paper 2.
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* MECHANISM. The three steps, the daily line, one action. */}
      <section className="how">
        <div className="wrap">
          <ol className="steps">
            <li className="step">
              <div className="sn">STEP 1</div>
              <div>
                <h3>Work it on paper</h3>
                <p>A question in the style of the paper, on your phone. You do it by hand.</p>
              </div>
            </li>
            <li className="step">
              <div className="sn">STEP 2</div>
              <div>
                <h3>Photograph your page</h3>
                <p>
                  Marked the way a Paper 2 examiner marks. <span className="pen">In red pen.</span> Every
                  method mark, awarded or withheld, with the reason.
                </p>
              </div>
            </li>
            <li className="step">
              <div className="sn">STEP 3</div>
              <div>
                <h3>See what earned marks &mdash; and why</h3>
                <p>
                  The slip named on the line where it happened. The same skill comes back a few days later, so the fix sticks.
                </p>
              </div>
            </li>
          </ol>
          <p className="daily">
            Fifteen minutes a day, aimed at the topics worth the most marks for you.
          </p>
          {!signedInWithAccess && (
            <Link className="btn" href="/study/login?new=1">
              Mark one question free
              <small>No card required.</small>
            </Link>
          )}
        </div>
      </section>

      {/* REASON. The founder, with no statistics. */}
      <section className="rule-top">
        <div className="wrap founder">
          <div className="who">
            {photo ? (
              <img className="badge" src={FOUNDER_PHOTO} alt="David Noel" width={64} height={64} />
            ) : (
              <div className="badge">DN</div>
            )}
            <div>
              <div className="eyebrow">Why I built this</div>
              <div className="sig">David Noel</div>
            </div>
          </div>
          <p>
            I sat these exams in Grenada. <b>Ten CXC subjects, an island scholar.</b> Then I
            taught <b>CSEC Mathematics</b> for two years &mdash; working past papers with students,
            question by question &mdash; before engineering degrees, a PhD in computer science and
            AI, and a career leading AI teams in the US.
          </p>
          <p>
            Every step of that road started with CXC passes. What I saw in the classroom was
            students who knew the maths and still lost the marks, because{' '}
            <b>nobody had shown them how the paper is actually marked.</b>
          </p>
          <p>
            So I built the practice I wish every student had: the same question-by-question work,
            with the working marked &mdash; patient, precise, available every single day.
          </p>
          <div className="cred">
            PHD COMPUTER SCIENCE · TAUGHT CSEC MATHEMATICS · ISLAND SCHOLAR, GRENADA
          </div>
        </div>
      </section>

      {/* PROOF is the marked question above; the coverage limit lives in the
          FAQ. THE OFFER is addressed to whoever is paying (ROUND_2 §8e). */}
      {signedInWithAccess ? (
        <section id="offer">
          <div className="wrap">
            <div className="offer">
              <div className="eyebrow">You already have access</div>
              <h2>Everything is where you left it.</h2>
              <p>
                Your marks, your topics and every question you have answered are all still there.
                Nothing here is for sale to you &mdash; this page is for people deciding.
              </p>
              <Link className="btn" href="/study">
                Continue studying
                <small>YOUR SESSIONS, YOUR NOTEBOOK, YOUR GRADE ESTIMATE</small>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section id="offer">
          <div className="wrap">
            <div className="offer offergrid">
              <div>
                <div className="eyebrow">CSEC Mathematics</div>
                <div className="pricerow">
                  <div className="price">{LANDING.price}</div>
                  <div className="per">{LANDING.price} through your chosen exam sitting · ONE PAYMENT · NO SUBSCRIPTION · USD</div>
                </div>
                <ul>
                  <li>The whole programme: diagnostic, daily sessions, marked working</li>
                  <li>One student, with access running to the sitting they are entered for</li>
                  <li>A grade estimate once we have seen enough of their work</li>
                  <li>A direct line to me</li>
                </ul>
                <a className="btn" href={paymentLink()} target="_blank" rel="noopener">
                  Get access &mdash; {LANDING.price}
                  <small>SECURE CHECKOUT · CARD OR APPLE PAY</small>
                </a>
              </div>
              <div className="offernote">
                <p>
                  Checkout asks for the student&rsquo;s email address, which need not be yours: that is the
                  address they sign up with, and how the payment reaches their account. Not satisfied?
                  Email{' '}
                  <a href={`mailto:${LANDING.contactEmail}`}>us</a>{' '}
                  within {REFUND_DAYS} days of paying and we will refund you. We do not send
                  reports: they can open their own marked working whenever they want to, and you will hear
                  how it is going from them, not from us.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="faqsection">
        <div className="wrap faq">
          <div className="eyebrow">Questions we get asked</div>
          <dl>
            <div>
              <dt>Is it the whole paper?</dt>
              <dd>
                Not quite, and we say so: ExtraLesson practises about {coverage.displayPercent}% of the
                marks in a CSEC Mathematics paper. Graphs you draw on paper count &mdash; photograph them
                and we mark the drawing, worth about {coverage.photographed.marksEarnedByPhoto} marks a
                paper that you earn no other way. Construction with ruler and compasses &mdash; roughly{' '}
                {coverage.photographed.uncoveredMarks} marks &mdash; we do not cover at all, so that stays
                with past papers. We do not prepare private candidates for Paper 032.
              </dd>
              <dt>Does it work on a basic phone?</dt>
              <dd>Yes. Any smartphone with a camera. Low data by design &mdash; no video streaming.</dd>
              <dt>They&rsquo;re re-sitting in January &mdash; is this for them?</dt>
              <dd>
                Especially for them. January candidates re-sit Papers 1 and 2 (project marks carry
                over), which is exactly what this trains. Whatever run-up is left, fifteen minutes a
                day on the topics costing the most marks, with the working marked rather than the
                answer ticked.
              </dd>
            </div>
            <div>
              <dt>Is this real CXC past papers?</dt>
              <dd>
                No &mdash; CXC&rsquo;s papers are their copyright. Our questions are original, written
                to the current public syllabus and marked to mark-scheme conventions, and reviewed by a
                teacher who taught CSEC Mathematics in the Caribbean (me).
              </dd>
              <dt>When do they see a grade estimate?</dt>
              <dd>
                A grade estimate once we&rsquo;ve seen enough of their work &mdash; 35 marks in every
                module. Until then the notebook shows how far each module has got.
              </dd>
              <dt>What if it doesn&rsquo;t help?</dt>
              <dd>
                Email us within {REFUND_DAYS} days of paying and we refund you &mdash; no questions, no
                forms. Tell me when the marking is wrong and it gets fixed.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* CLOSING. The one action again, and the way in for someone who has it. */}
      <div className="closing">
        <div className="wrap closingrow">
          {signedInWithAccess ? (
            <Link className="btn" href="/study">
              Continue studying
              <small>YOUR ACCESS IS ACTIVE · PICK UP WHERE YOU LEFT OFF</small>
            </Link>
          ) : (
            <Link className="btn" href="/study/login?new=1">
              Mark one question free
              <small>No card required.</small>
            </Link>
          )}
          {!session && (
            <Link className="authlink" href="/study/login">
              I already have an account &mdash; sign in
            </Link>
          )}
        </div>
      </div>

    </div>
  );
}
