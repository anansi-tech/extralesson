import type { Metadata } from 'next';
import './landing.css';
import Link from 'next/link';
import { LANDING, landingCoverage, paymentLink } from '@/lib/landing-content';
import { REFUND_DAYS } from '@/lib/access';
import { getSession } from '@/lib/auth/session';

// Faithful port of design/extralesson-landing.html (ROUND_1 §7).
// Copy changed only where exam facts changed: the old M1/A1 mark language is
// now CK/AK/R-neutral, and channel-specific report wording was neutralized.

export const metadata: Metadata = {
  title: 'ExtraLesson — Your child’s own CXC examiner',
  description:
    'AI-powered CSEC Maths tutoring that marks real working the way a CXC examiner does — step by step. Built by a Grenadian island scholar. Founding Families: $25 for the sitting you are preparing for.',
  openGraph: {
    title: 'ExtraLesson — Your child’s own CXC examiner',
    description:
      'CSEC Maths tutoring that marks the way examiners award marks — step by step. Founding Families: $25.',
    type: 'website',
  },
};

// Reading the session cookie makes this page render per request rather than
// statically. That is the cost of the header knowing who you are, and it is
// worth paying: without it, everyone who has already bought the product finds
// two Stripe buttons and no way in.
export default async function LandingPage() {
  const coverage = landingCoverage();
  const session = await getSession();
  return (
    <div className="landing">
      <header className="hero">
        <div className="wrap">
          <div className="toprow">
            <div className="logo">
              extra<em>lesson</em>
            </div>
            {/* Quiet on purpose. The page's job is still to convert, so this
                must be findable by someone looking for it and must not compete
                with the offer. */}
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
          <h1>
            Your child&rsquo;s own
            <br />
            CXC examiner.<span className="pen"> In red pen.</span>
          </h1>
          <p className="lede">
            ExtraLesson is AI-powered CSEC Maths tutoring that marks your child&rsquo;s{' '}
            <b>real working</b> the way a CXC examiner marks Paper 2 — mark by mark, with the exact
            feedback that turns a Grade IV into a Grade II.
          </p>
          <a className="btn" href="#offer">
            Become a Founding Family — {LANDING.price}
            <small>
              FULL ACCESS THROUGH THE SITTING YOU CHOOSE · {LANDING.places} FAMILIES ONLY
            </small>
          </a>
          <div className="heronote">
            FOR CSEC MATHEMATICS · {LANDING.sittingNote} · WORKS ON ANY PHONE
          </div>
        </div>
      </header>

      <div className="stats">
        <div className="wrap">
          <div className="grid">
            <div>
              <div className="n red">{LANDING.statAvgScore}</div>
              <div className="l">{LANDING.statAvgScoreLabel}</div>
            </div>
            <div>
              <div className="n red">{LANDING.statBenchmark}</div>
              <div className="l">{LANDING.statBenchmarkLabel}</div>
            </div>
            {/* This was "Jan" — a date dressed as a statistic beside two real
                ones, and an argument that expires. The urgency is not that a
                date is close; it is that most of a paper's marks are in the
                working, and every week of practice nobody marks is a week of
                those marks going uncorrected. */}
            <div>
              <div className="n">{LANDING.statWorking}</div>
              <div className="l">{LANDING.statWorkingLabel}</div>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="wrap">
          <div className="demo">
            <div className="demo-copy">
              <div className="eyebrow">Why it&rsquo;s different</div>
              <h2>Apps quiz. We mark.</h2>
              <p>
                Multiple-choice apps drill Paper 1. But <b>half the grade is Paper 2</b> — written
                problems where examiners award marks for method, step by step. That&rsquo;s where
                students bleed marks they didn&rsquo;t know they were losing.
              </p>
              <p>
                Your child works <b>on paper, by hand</b> — the way the real exam works — and gets
                it marked like an examiner would:
              </p>
              <ul className="marklist">
                <li>
                  <span className="chip">MARKS</span>
                  <span>Marked the way examiners award marks — step by step</span>
                </li>
                <li>
                  <span className="chip">WHY</span>
                  <span>The exact slip named — and what it costs on the real paper</span>
                </li>
                <li>
                  <span className="chip">NEXT</span>
                  <span>A similar question immediately, so the fix sticks</span>
                </li>
              </ul>
              <p>
                Fifteen minutes a day, aimed at the topics worth the most marks for <b>your</b>{' '}
                child.
              </p>
            </div>
            <div className="phone">
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
                    <span className="tick" style={{ fontSize: 14 }}>
                      ✗ sign
                    </span>
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
                    Try one more like it?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rule-top">
        <div className="wrap">
          <div className="eyebrow">How it works</div>
          <h2>Fifteen minutes. Every day. In red pen.</h2>
          <div className="steps">
            <div className="step">
              <div className="sn">STEP 1</div>
              <h3>Diagnose</h3>
              <p>
                A short placement test maps your child against the full CSEC syllabus and sets a
                predicted grade — the one number we all work to move.
              </p>
            </div>
            <div className="step">
              <div className="sn">STEP 2</div>
              <h3>Practise &amp; get marked</h3>
              <p>
                Daily 15-minute sessions on their weakest, highest-mark topics — marked the way
                examiners award marks, step by step.
              </p>
            </div>
            <div className="step">
              <div className="sn">STEP 3</div>
              <h3>See where you stand</h3>
              <p>
                Sessions done, accuracy trend, predicted grade and what&rsquo;s next — all in your
                notebook, updated after every question. No mystery about where the marks are going.
              </p>
            </div>
          </div>
          <p className="honest">
            Straight about what we don&rsquo;t do: ExtraLesson practises about {coverage.displayPercent}%
            of the marks in a CSEC Mathematics paper. Graphs you draw on paper count — photograph
            them and we mark the drawing, worth about {coverage.photographed.marksEarnedByPhoto}{' '}
            marks a paper that you earn no other way. Construction with ruler and compasses —
            roughly {coverage.photographed.uncoveredMarks} marks — we do not cover at all, so that
            stays on paper with past papers. We do not prepare private candidates for Paper 032.
          </p>
        </div>
      </section>

      <section className="rule-top">
        <div className="wrap">
          <div className="founder">
            <div className="badge">DN</div>
            <div>
              <div className="eyebrow">Why I built this</div>
              <p style={{ marginTop: 8 }}>
                I sat these exams in Grenada. <b>Ten CXC subjects, island scholar.</b> Then I
                taught <b>CSEC Mathematics to Forms 3 to 5</b> for two years — working past papers
                with students, question by question — before engineering degrees, a PhD in computer
                science and AI, and a career leading AI teams in the US.
              </p>
              <p>
                Every step of that road started with CXC passes. But the maths results haven&rsquo;t
                moved in a generation — the average score is still {LANDING.statAvgScore}. Not
                because our children are less capable. Because{' '}
                <b>nobody teaches them how the exam is actually marked.</b>
              </p>
              <p>
                So I built the examiner I wish every student had: that same question-by-question
                practice, with the working marked — patient, precise, available every single day,
                and honest in red pen. My own family in Grenada tested it first.
              </p>
              <div className="sig">David Noel</div>
              <div className="cred">
                PHD COMPUTER SCIENCE · TAUGHT CSEC MATHEMATICS, FORMS 3&ndash;5 · ISLAND SCHOLAR,
                GRENADA
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THE OFFER IS ADDRESSED TO WHOEVER IS PAYING.
          A fifteen-year-old has no card, so the buyer is almost never the
          student — and which relation they are does not change what they need
          to know. It used to speak to a student here and to an overseas
          relative in a separate box below, which left the actual buyer working
          out which voice meant them. Three things, in order: what the money
          buys, who it is for, and how they will know it is working. */}
      <section id="offer">
        <div className="wrap">
          <div className="offer">
            <div className="eyebrow">Founding Families · {LANDING.places} places</div>
            <h2>Everything, through the sitting you choose.</h2>
            <div className="price">{LANDING.price}</div>
            <div className="per">ONE PAYMENT · NO SUBSCRIPTION · USD</div>
            <p>
              Most people paying for this are not the one sitting the exam. So: what it buys, who
              it is for, and how you will know it is working.
            </p>
            <ul>
              <li>Full CSEC Maths programme — diagnostic, daily sessions, examiner-style marking</li>
              <li>One student, with access running to the sitting they are entered for</li>
              <li>Predicted grade tracking from day one to exam day</li>
              <li>Founding Family price locked for life on everything we launch next</li>
              <li>Direct line to me — your feedback shapes the product</li>
            </ul>
            <a className="btn" href={paymentLink()}>
              Reserve your place — {LANDING.price}
              <small>SECURE CHECKOUT · CARD OR APPLE PAY</small>
            </a>
            {/* The student's address, not the payer's — which is the whole
                reason the field exists, and why saying so here costs nothing. */}
            <div className="cap">
              CHECKOUT ASKS FOR THE STUDENT&rsquo;S EMAIL ADDRESS, WHICH NEED NOT BE YOURS. THAT IS
              THE ADDRESS THEY SIGN UP WITH, AND HOW THE PAYMENT REACHES THEIR ACCOUNT.
            </div>
            <p>
              How you will know it is working: they will show you. We do not send reports. They can
              open their own marked working — every question, every mark, and the reason for each
              one — whenever they want to. You&rsquo;ll hear how it&rsquo;s going from them, not
              from us.
            </p>
            {/* The refund window is the terms' window, read from the same
                constant. The page used to say "full refund at launch" while the
                terms said 14 days from paying, which is a promise and its
                small print disagreeing in public. */}
            <div className="cap">
              NOT SATISFIED? EMAIL US WITHIN {REFUND_DAYS} DAYS OF PAYING AND WE WILL REFUND YOU.
            </div>
          </div>
        </div>
      </section>

      <section className="rule-top">
        <div className="wrap faq">
          {/* Addressed to whoever is paying, like the offer above it: an aunt,
              a grandmother, a godparent or a sponsor all read this, and none of
              them is helped by being called a parent first. */}
          <div className="eyebrow">Questions we get asked</div>
          <dl>
            <dt>Does it work on a basic phone?</dt>
            <dd>Yes. Any smartphone with a camera. Low data by design — no video streaming.</dd>
            <dt>They&rsquo;re re-sitting in January — is this for them?</dt>
            <dd>
              Especially for them. January candidates re-sit Papers 1 and 2 (project marks carry
              over) — exactly what ExtraLesson trains. Whatever run-up is left, the marks move the
              same way: fifteen minutes a day on the topics costing the most marks, with the
              working marked rather than the answer ticked.
            </dd>
            <dt>Is this real CXC past papers?</dt>
            <dd>
              No — CXC&rsquo;s papers are their copyright. Our questions are original, written to
              the current public syllabus and marked to mark-scheme conventions, and reviewed by a
              teacher who taught CSEC Mathematics in the Caribbean (me).
            </dd>
            <dt>What if it doesn&rsquo;t help?</dt>
            <dd>
              Email us within {REFUND_DAYS} days of paying and we refund you — no questions, no
              forms. I&rsquo;m building this with the first hundred families, not just for them.
            </dd>
          </dl>
        </div>
      </section>

      {/* TWO BLOCKS, NOT FOUR FRAGMENTS.
          Four flex children scattered into an unreadable row on a narrow
          screen. Who we are and the small print on the left, the one ACTION on
          the right — a footer has exactly one thing to do and it should look
          like it. */}
      <footer>
        <div className="wrap foot">
          <div className="foot-info">
            <div>EXTRALESSON · AN ANANSI TECHNOLOGY LLC PRODUCT</div>
            <div>
              {LANDING.contactEmail} ·{' '}
              <Link className="authlink" href="/privacy">
                Privacy
              </Link>{' '}
              ·{' '}
              <Link className="authlink" href="/terms">
                Terms
              </Link>
            </div>
          </div>
          {/* Mirrored here because a phone scrolls past the header and never
              scrolls back up to look for a way in. */}
          <div className="foot-action">
            {session ? (
              <Link className="authlink" href="/study">
                Continue studying &rarr;
              </Link>
            ) : (
              <>
                Already have an account?{' '}
                <Link className="authlink" href="/study/login">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
