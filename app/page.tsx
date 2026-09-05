import type { Metadata } from 'next';
import './landing.css';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Link from 'next/link';
import { Lockup } from './lockup';
import { LANDING, landingCoverage, paymentLink } from '@/lib/landing-content';
import { hasAccess, REFUND_DAYS, type Access } from '@/lib/access';
import { dbConnect, Student } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

// This page, not any design file, is the source of truth for the landing copy
// (ROUND_1 §7).

export const metadata: Metadata = {
  title: 'ExtraLesson — Your own CXC examiner',
  description:
    `Work a CSEC Maths question on paper, photograph the page, and ExtraLesson marks your working the way a Paper 2 examiner does — every method mark, and the reason for each. Built by a Grenadian island scholar. ${LANDING.price} for the sitting you are preparing for.`,
  openGraph: {
    title: 'ExtraLesson — Your own CXC examiner',
    description:
      `Photograph your working. ExtraLesson marks it the way a Paper 2 examiner does — every method mark, and the reason for each. ${LANDING.price}.`,
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
      .select('access')
      .lean<{ access?: Access | null } | null>();
    signedInWithAccess = hasAccess(student?.access);
  }
  return (
    <div className="landing">
      <header className="hero">
        <div className="wrap">
          <div className="toprow">
            <div className="logo">
              <Lockup width={150} />
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
            Your own
            <br />
            CXC examiner.<span className="pen"> In red pen.</span>
          </h1>
          <p className="lede">
            Work a CSEC Maths question on paper. Photograph the page. ExtraLesson marks your
            working the way a Paper 2 examiner does — every method mark, and the reason for each.
          </p>
          {signedInWithAccess ? (
            <Link className="btn" href="/study">
              Continue studying
              <small>YOUR ACCESS IS ACTIVE · PICK UP WHERE YOU LEFT OFF</small>
            </Link>
          ) : (
            <>
              <Link className="btn" href="/study/login?new=1">
                Mark one question free
                <small>NO CARD · ONE REAL QUESTION · ANY PHONE WITH A CAMERA</small>
              </Link>
              <a className="authlink herolink" href="#offer">
                Full access — {LANDING.price}
              </a>
            </>
          )}
          <div className="heronote">
            FOR CSEC MATHEMATICS · {LANDING.sittingNote} · WORKS ON ANY PHONE
          </div>
        </div>
      </header>

      <div className="stats">
        <div className="wrap">
          <div className="grid">
            {/* Not a date: an argument that expires. The urgency is that most
                of a paper's marks are in the working, and a week nobody marks
                them is a week uncorrected. */}
            <div>
              <div className="n red">{LANDING.statWorking}</div>
              <div className="l">{LANDING.statWorkingLabel}</div>
            </div>
            <div>
              <div className="n">{LANDING.statAvgScore}</div>
              <div className="l">{LANDING.statAvgScoreLabel}</div>
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
                You work <b>on paper, by hand</b> — the way the real exam works — and it gets
                marked like an examiner would:
              </p>
              <ul className="marklist">
                <li>
                  <span className="chip">MARKS</span>
                  <span>Every method mark, awarded or withheld, with the reason</span>
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
                Short daily sessions, aimed at the topics worth the most marks for <b>you</b>.
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
          <h2>Fifteen minutes. Every day.</h2>
          <div className="steps">
            <div className="step">
              <div className="sn">STEP 1</div>
              <h3>Work it on paper</h3>
              <p>A CSEC-style question on your phone. You do it by hand, the way the exam is.</p>
            </div>
            <div className="step">
              <div className="sn">STEP 2</div>
              <h3>Photograph the page</h3>
              <p>
                We read your working line by line and mark it as a Paper 2 examiner would — method
                marks included, with the reason for every one.
              </p>
            </div>
            <div className="step">
              <div className="sn">STEP 3</div>
              <h3>Every day.</h3>
              <p>
                A short diagnostic finds the topics costing you the most marks. Every session aims
                there. Your predicted grade updates after every question.
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
            {photo ? (
              <img className="badge" src={FOUNDER_PHOTO} alt="David Noel" width={64} height={64} />
            ) : (
              <div className="badge">DN</div>
            )}
            <div>
              <div className="eyebrow">Why I built this</div>
              <p style={{ marginTop: 8 }}>
                I sat these exams in Grenada. <b>Ten CXC subjects, an island scholar.</b> Then I
                taught <b>CSEC Mathematics</b> for two years — working past papers with students,
                question by question — before engineering degrees, a PhD in computer science and
                AI, and a career leading AI teams in the US.
              </p>
              <p>
                Every step of that road started with CXC passes. But the maths results haven&rsquo;t
                moved in a generation — the average score is still {LANDING.statAvgScore}. Not
                because our children are less capable. Because{' '}
                <b>nobody teaches them how the exam is actually marked.</b>
              </p>
              <p>
                So I built the examiner I wish every student had: that same question-by-question
                practice, with the working marked — patient, precise, available every single day.
              </p>
              <div className="sig">David Noel</div>
              <div className="cred">
                PHD COMPUTER SCIENCE · TAUGHT CSEC MATHEMATICS · ISLAND SCHOLAR, GRENADA
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THE OFFER IS ADDRESSED TO WHOEVER IS PAYING — no relationship, no
          geography (ROUND_2 §8e). Three things, in order: what the money buys,
          who it is for, and how they will know it is working. */}
      {signedInWithAccess ? (
        // In place of the offer, not beside it: what they came for is the door.
        <section id="offer">
          <div className="wrap">
            <div className="offer">
              <div className="eyebrow">You already have access</div>
              <h2>Everything is where you left it.</h2>
              <p>
                Your marks, your topics and every question you have answered are all still there.
                Nothing here is for sale to you — this page is for people deciding.
              </p>
              <Link className="btn" href="/study">
                Continue studying
                <small>YOUR SESSIONS, YOUR NOTEBOOK, YOUR PREDICTED GRADE</small>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section id="offer">
          <div className="wrap">
            <div className="offer">
              <div className="eyebrow">CSEC Mathematics</div>
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
                <li>Direct line to me — your feedback shapes the product</li>
              </ul>
{/* Checkout opens in a new tab, so abandoning it closes a tab rather
                  than navigating away. The noopener marking is required, not
                  cosmetic: without it the payment tab can reach back through
                  window.opener. */}
              <a className="btn" href={paymentLink()} target="_blank" rel="noopener">
                Get access — {LANDING.price}
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
                  constant, so they cannot disagree. */}
              <div className="cap">
                NOT SATISFIED? EMAIL US WITHIN {REFUND_DAYS} DAYS OF PAYING AND WE WILL REFUND YOU.
              </div>
            </div>
          </div>
        </section>
      )}

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
              forms. I&rsquo;m building this with the students using it, not just for them: tell me
              when the marking is wrong and it gets fixed.
            </dd>
          </dl>
        </div>
      </section>

      {/* TWO BLOCKS, NOT FOUR FRAGMENTS: four flex children scatter on a
          narrow screen. Who we are and the small print left, the ACTION
          right. */}
      <footer>
        <div className="wrap foot">
          <div className="foot-info">
            &copy; {new Date().getFullYear()} Anansi Technology LLC ·{' '}
            <a className="authlink" href={`mailto:${LANDING.contactEmail}`}>
              {LANDING.contactEmail}
            </a>{' '}
            ·{' '}
            <Link className="authlink" href="/privacy">
              Privacy
            </Link>{' '}
            ·{' '}
            <Link className="authlink" href="/terms">
              Terms
            </Link>
          </div>
          {/* Mirrored here because a phone scrolls past the header and never
              scrolls back up to look for a way in. */}
          <div className="foot-action">
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
      </footer>
    </div>
  );
}
