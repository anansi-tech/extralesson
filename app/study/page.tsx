import { dbConnect, Student } from '@/lib/db';
import { isAdminEmail, requireSession } from '@/lib/auth/session';
import { loadStudyState } from '@/lib/study/state';
import { coverageDetail, coverageSummary } from '@/lib/targets/coverage';
import { paperShape } from '@/lib/exam/paper-shape';
import Link from 'next/link';
import { logout, startSession } from './actions';
import { openSession } from '@/lib/study/open-session';
import { loadProgress } from '@/lib/study/progress';
import {
  examDateFor,
  gradeLabel,
  gradePlace,
  projectTrajectory,
  topicLeverage,
  trajectoryGap,
  type TrajectoryGap,
} from '@/lib/study/trajectory';
import { PracticeSession } from '@/lib/db';
import { DIAGNOSTIC_MINUTES, m1GateHolds, SESSION_MINUTES } from '@/lib/session/builder';
import { loadMistakes } from '@/lib/study/mistakes';
import { loadTopicChoices } from '@/lib/study/topics';
import { loadReviewable } from '@/lib/study/reviewable';
import { shouldLeadWithReachable } from '@/lib/study/lead-panel';
import { DIAGNOSTIC_INTERVAL_DAYS, diagnosticOpensAt, FREE_SESSIONS } from '@/lib/access';
import { sittingLabel } from '@/lib/sittings';
import { paymentLink } from '@/lib/landing-content';
import { BAND_LABEL } from '@/lib/study/profiles';
import type { ModuleNumber } from '@/lib/types';
import type { MasteryBand } from '@/lib/mastery/config';

export const metadata = { title: 'Your notebook — ExtraLesson' };
export const dynamic = 'force-dynamic';

/**
 * Says what is actually missing before a rate can be shown — sessions, days, or
 * both. Telling a student with sixteen sessions to "finish a couple more" asks
 * for something they have already done, and asks for it again every visit.
 */
function trajectoryWait(gap: TrajectoryGap | null): string {
  if (!gap) return 'Your rate will appear here once there is enough to measure.';
  const s = gap.sessionsShort;
  const d = gap.daysShort;
  const sessions = `${s} more session${s === 1 ? '' : 's'}`;
  const days = `${d} more day${d === 1 ? '' : 's'} of study`;
  if (s > 0 && d > 0) return `After ${sessions}, spread over ${days}, we can show you the grade your current rate is heading for.`;
  if (s > 0) return `After ${sessions} we can show you the grade your current rate is heading for.`;
  return `You have done enough sessions. A rate needs time as well, so after ${days} we can show you the grade it is heading for.`;
}


function barColor(band: MasteryBand): string {
  if (band === 'STRONG') return 'bg-green-pen';
  if (band === 'BUILDING') return 'bg-[#D9A62E]';
  return 'bg-red-pen';
}

export default async function StudyDashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const auth = await requireSession();
  const { error, mode } = await searchParams;
  await dbConnect();
  const student = await Student.findById(auth.student_id).lean<{
    name: string;
    exam_sitting: string;
    syllabus_mode: 'legacy-jan' | 'modular-2027';
    target_modules: ModuleNumber[];
  } | null>();
  if (!student) return null;

  const isAdmin = isAdminEmail(auth.email);
  const state = await loadStudyState(auth.student_id, student.target_modules);
  const { prediction } = state;
  const [open, progress] = await Promise.all([
    openSession(auth.student_id),
    loadProgress(auth.student_id),
  ]);

  // TRAJECTORY, measured against this student's own history.
  //
  // The estimate as it stood before their recent sessions, against the estimate
  // now, over the sessions between — the same before/after fold the session
  // summary already does, read over a longer window.
  const RECENT = 5;
  const completed = await PracticeSession.find({
    student_id: auth.student_id,
    completed_at: { $ne: null },
  })
    .sort({ started_at: -1 })
    .limit(RECENT + 1)
    .select('started_at')
    .lean<{ started_at: Date }[]>();
  // What the student can ask for, beyond the session the app would choose.
  const [topicChoices, mistakes, reviewable] = await Promise.all([
    loadTopicChoices(student.target_modules),
    loadMistakes(auth.student_id),
    loadReviewable(auth.student_id),
  ]);
  const revisitMarks = [...mistakes.lostByObjective.values()].reduce((a, b) => a + b, 0);
  const isNewStudent = mistakes.attemptedIds.size === 0;

  // ONE DIAGNOSTIC PER STUDENT. Offering a button that would be refused is
  // worse than not offering it. Both offers below read this rather than
  // isNewStudent, which counts ATTEMPTS: someone who started a diagnostic and
  // answered nothing still reads as new.
  const diagnosticOpensAtDate = await diagnosticOpensAt(auth.student_id);
  const diagnosticOpen =
    diagnosticOpensAtDate === null || Date.now() >= diagnosticOpensAtDate.getTime();

  // What the trajectory is still waiting for, named rather than guessed at.
  const gap = trajectoryGap({
    sessionsBetween: Math.max(0, completed.length - 1),
    firstSessionAt: completed.length ? new Date(completed[completed.length - 1].started_at) : null,
    now: new Date(),
  });

  const windowStart = completed.length > 1 ? completed[completed.length - 1].started_at : null;
  const before = windowStart
    ? await loadStudyState(auth.student_id, student.target_modules, new Date(windowStart))
    : null;
  const trajectory =
    before && progress.firstSessionAt
      ? projectTrajectory({
          percentNow: prediction.overall_percent,
          percentBefore: before.prediction.overall_percent,
          sessionsBetween: completed.length - 1,
          firstSessionAt: progress.firstSessionAt,
          now: new Date(),
          examDate: examDateFor(student.exam_sitting),
        })
      : null;

  // Lead with what is reachable while the estimate still reads as a verdict.
  // Below grade III every letter is U and the number is the thing they came
  // here to change — putting it at the top of the page is the app agreeing with
  // it every morning. Above that it is news worth leading with, so it leads.
  //
  // Including the student who has no estimate yet, who is the extreme case
  // rather than an exception: "not yet estimated" is a placeholder where the
  // topics carrying their marks are a plan.
  const reachable = topicLeverage(state, student.target_modules).slice(0, 3);
  // The same condition the session builder applies, read from the same
  // function: a topic outside Module 1 is where the marks are and is not where
  // today's session will go while Module 1 is still the prerequisite.
  const m1Gated = m1GateHolds(student.target_modules, state.moduleMastery[1]);
  const gatedTopics = m1Gated ? reachable.filter((t) => t.module !== 1) : [];
  // Needs an ESTIMATE, not an attempt: see lib/study/lead-panel.ts. Gated on
  // the FLAG rather than the panel's render site, because the flag also demotes
  // the estimate — gating the render alone would leave the estimate squeezed to
  // make room for something no longer there.
  const leadWithReachable = shouldLeadWithReachable({
    reachableCount: reachable.length,
    estimable: prediction.estimable,
    overallPercent: prediction.overall_percent,
  });

  // Stating what we cannot mark is a trust asset — it sits with the estimate it
  // qualifies, not in a footnote (R1.6 §3).
  const coverage = coverageSummary(state.coverage);
  const coverageMore = coverageDetail(state.coverage);

  return (
    <main className="ruled relative min-h-screen px-5 py-8">
      <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
      <div className="mx-auto max-w-xl">
        {/* THE EMAIL IS THE ONLY THING HERE OF UNKNOWN LENGTH, so it is the
            only thing allowed to give. It was capped at 45vw, which is nearly
            half the row: the other three were squeezed under their own content
            width and broke across lines — "REVIEW / QUEUE", "SIGN / OUT" — for
            an address long enough to deserve truncating in the first place.
            The fixed items no longer wrap, the address takes what is left and
            truncates, and below that the row wraps as a whole rather than
            squashing. */}
        <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <div className="shrink-0 text-xl font-black">
            extra<em className="not-italic text-red-pen">lesson</em>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-end gap-x-3 gap-y-1">
            {/* Signing in lands an admin here, in the product, because an admin
                is also a student and seeing what a student sees is the point of
                having the account at all. This is the way across — without it
                the review queue was reachable only by typing the URL. */}
            {isAdmin && (
              <Link
                href="/admin/review"
                className="shrink-0 whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-red-pen underline"
              >
                Review queue
              </Link>
            )}
            <span className="hidden shrink-0 whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-dim sm:inline">
              {student.syllabus_mode === 'legacy-jan' ? 'CSEC MATH · JAN RE-SIT' : 'CSEC MATH · MAY/JUNE 2027'}
            </span>
            {/* Which account is signed in. Obvious on one device with one
                student; not obvious at all when a device is shared, or when
                you are moving between admin and a test account. */}
            <span
              title={auth.email}
              className="min-w-[14ch] max-w-full truncate font-mono text-[10px] tracking-widest text-dim"
            >
              {auth.email}
            </span>
            <form action={logout} className="shrink-0">
              <button className="whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-dim underline">
                Sign out
              </button>
            </form>
          </div>
        </header>

        {/* THE ACTION COMES FIRST.
            It used to sit a full screen down — measured at 390px, y=877 —
            behind 203 words and 22 numbers of analysis. A student opening the
            app had to read where their marks were, why some of them waited, and
            what the rate was waiting for, before finding the thing to press.
            The analysis is worth reading; it is worth reading after you have
            decided to work, so it now sits below the button rather than in
            front of it. */}
        {open ? (
          <Link
            href={`/study/session/${open.id}`}
            className="mt-5 block bg-red-pen p-4 text-center font-black text-white shadow-[4px_4px_0_var(--ink)]"
          >
            Carry on with your session
            <small className="block font-mono text-[10px] font-medium tracking-widest opacity-85">
              {open.answered} OF {open.questions} DONE · {open.marksLeft} MARK
              {open.marksLeft === 1 ? '' : 'S'} LEFT
            </small>
          </Link>
        ) : isNewStudent ? (
          // BEFORE THE FIRST ATTEMPT, THE DIAGNOSTIC LEADS.
          //
          // "Weakest topics first" has nothing to sort on when there is no
          // attempt to sort by: every objective reads as equally unmeasured, so
          // the session is chosen by blueprint weight alone. Putting the red
          // button on it buried the twelve minutes that would make it work.
          // This swaps back on its own once attempts exist.
          <>
            {diagnosticOpen && (
            <form action={startSession} className="mt-5">
              <input type="hidden" name="mode" value="diagnostic" />
              <button className="w-full bg-red-pen p-4 text-center font-black text-white shadow-[4px_4px_0_var(--ink)]">
                Start with a quick diagnostic
                <small className="block font-mono text-[10px] font-medium tracking-widest opacity-85">
                  ABOUT {DIAGNOSTIC_MINUTES} MINUTES · FINDS WHERE TO START
                </small>
              </button>
            </form>
            )}
            <form action={startSession} className="mt-3">
              <input type="hidden" name="mode" value="adaptive" />
              <button className="w-full border-[1.5px] border-ink p-3 text-center font-semibold">
                Or start a session now
                <small className="block font-mono text-[10px] uppercase tracking-widest text-dim">
                  About {SESSION_MINUTES} minutes at exam pace
                </small>
              </button>
            </form>
          </>
        ) : (
          <form action={startSession} className="mt-5">
            <button className="w-full bg-red-pen p-4 text-center font-black text-white shadow-[4px_4px_0_var(--ink)]">
              Start today&rsquo;s session
              <small className="block font-mono text-[10px] font-medium tracking-widest opacity-85">
                ABOUT {SESSION_MINUTES} MINUTES AT EXAM PACE · WEAKEST TOPICS FIRST
              </small>
            </button>
          </form>
        )}
        <p className="mt-2 text-center text-[11px] leading-snug text-dim">
          {open
            ? 'Your answers so far are saved. You can look back at any question you have already done.'
            : isNewStudent
              ? 'Eight quick questions across the syllabus. Nothing is scored or graded — it only puts your topics in order, so the sessions after it start in the right place.'
              : 'One or two whole exam questions, priced the way the paper prices them — a Paper 2 question is 9 to 12 marks and takes most of the session.'}
        </p>

        {leadWithReachable && (
          <section className="mt-6 border-[1.5px] border-ink bg-white p-5 shadow-[3px_3px_0_var(--ink)]">
            <div className="section-label">
              Where your marks are
            </div>
            <ul className="mt-2 space-y-2">
              {reachable.map((t) => (
                <li key={t.code} className="flex items-baseline justify-between gap-3">
                  {/* The title and the marks, and nothing else. The row used
                      to carry the module, the topic strength and a gating note
                      as well — five facts competing with the one that matters,
                      three times over. Module and strength are in the
                      per-module breakdown lower down; the gating is said once,
                      below. */}
                  <span className="min-w-0">
                    <b>{t.title}</b>
                  </span>
                  {/* "+8.0" on its own names no unit and reads as nothing to
                      a student who has never seen this page before. Same
                      arithmetic, said in words. */}
                  <span className="shrink-0 text-right">
                    <span className="font-mono text-sm text-green-pen">
                      +{Math.round(t.pointsAvailable)}
                    </span>
                    <span className="block font-mono text-[10px] leading-tight text-dim">
                      points of
                      <br />
                      your grade
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {/* ONE line under the list. Three stacked paragraphs — what the
                number means, why later modules wait, and what the rate is
                waiting for — came to 102 words between a student and the
                button. The rate has moved to the estimate, which is the thing
                it is about. */}
            <p className="mt-3 border-t border-dashed border-paper-deep pt-3 text-[12px] leading-snug text-dim">
              Each number is the points your grade estimate could gain from that topic.
              {gatedTopics.length > 0 &&
                ' Module 1 comes first, so later modules wait — you can still practise any topic by name below.'}
            </p>
          </section>
        )}

        <section
          className={`border-[1.5px] border-ink bg-white text-center shadow-[3px_3px_0_var(--ink)] ${
            leadWithReachable ? 'mt-3 p-3' : 'mt-6 p-5'
          }`}
        >
          {!prediction.estimable ? (
            // A cold account's arithmetic is U/U/U and an overall VI, which
            // reads as a verdict when it means we have not seen them work yet.
            <>
              <div className="text-5xl font-black text-dim">&mdash;</div>
              <div className="mt-1 section-label">
                Not yet estimated
              </div>
              <p className="mt-2 text-[11px] leading-snug text-dim">
                Finish one session and your predicted grade appears here. It moves with every
                session after that.
              </p>
            </>
          ) : student.syllabus_mode === 'legacy-jan' ? (
            // Jan sitting awards an overall grade only — no per-module letters (§6.6).
            <>
              <div className={`font-black text-red-pen ${leadWithReachable ? 'text-2xl' : 'text-5xl'}`}>
                {prediction.overall_grade ? gradeLabel(prediction.overall_grade) : '—'}
              </div>
              <div className="mt-1 section-label">
                Estimated overall grade
                {prediction.overall_grade ? ` · ${gradePlace(prediction.overall_grade)}` : ''} ·
                estimate only
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center gap-6">
                {prediction.modules.map((m) => (
                  <div key={m.module}>
                    <div className={`font-black text-red-pen ${leadWithReachable ? 'text-xl' : 'text-4xl'}`}>
                      {m.letter ?? '—'}
                    </div>
                    <div className="section-label">
                      M{m.module} est.
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 section-label">
                {leadWithReachable ? 'Where you are today' : 'Overall estimate'}:{' '}
                {prediction.overall_grade
                  ? `${gradeLabel(prediction.overall_grade)}, ${gradePlace(prediction.overall_grade)}`
                  : 'not yet'}{' '}
                · all figures are estimates
              </div>
            </>
          )}
          {prediction.estimable && (
            <div className="mt-1 font-mono text-[9px] text-dim">
              Paper 3 project assumed at neutral carry-over — estimates move as you practise.
            </div>
          )}
          {/* The rate belongs with the estimate it moves, not under the list
              of topics. */}
          {trajectory && !trajectory.flat ? (
            <p className="mt-3 border-t border-dashed border-paper-deep pt-3 text-left text-[12px] leading-snug">
              At the rate you have been working —{' '}
              <b>{trajectory.sessionsPerWeek.toFixed(1)} sessions a week</b>, each moving your
              estimate about <b>{trajectory.perSession.toFixed(1)} points</b> — you are on track for{' '}
              <b className="text-green-pen">{gradeLabel(trajectory.projectedGrade)}</b>,{' '}
              {gradePlace(trajectory.projectedGrade)}, by the exam. That is your own rate over your
              last {trajectory.sessionsMeasured} sessions, capped at the next grade up — a
              direction, not a promise.
            </p>
          ) : trajectory ? (
            <p className="mt-3 border-t border-dashed border-paper-deep pt-3 text-left text-[12px] leading-snug text-dim">
              Your estimate has not moved over your last {trajectory.sessionsMeasured} sessions.
            </p>
          ) : (
            <p className="mt-3 border-t border-dashed border-paper-deep pt-3 text-left text-[12px] leading-snug text-dim">
              {trajectoryWait(gap)}
            </p>
          )}
          {/* CUT 4 — the coverage sentence moved inside the detail it
              introduced. It sat above the summary that opens it, so a student
              read the explanation and then the offer to read the explanation.
              Nothing is lost: it is the first line behind the tap. */}
          <details className="mt-2 text-left">
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-dim">
              What we cover
            </summary>
            <p className="mt-2 text-[11px] leading-snug text-dim">{coverage}</p>
            <ul className="mt-2 space-y-2">
              {coverageMore.map((line) => (
                <li key={line} className="text-[11px] leading-snug text-dim">
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] leading-snug text-dim">{paperShape(student.syllabus_mode)}</p>
          </details>
        </section>

        {/* THE PAYWALL, and what it does not take away. Everything already
            earned stays where it is — the notebook, the marks, the questions to
            look back at. What needs paying for is the NEXT session. */}
        {/* Checkout opens in a new tab on every path: the study page stays
            open underneath, and rel="noopener" keeps the Stripe tab from
            reaching back through window.opener on a payment path. */}
        {/* An expired sitting is not a locked-out customer. Their notebook is
            all still there; what has ended is the sitting they bought for. */}
        {error === 'access-expired' && (
          <section className="mt-4 border-[1.5px] border-ink bg-white p-4 shadow-[3px_3px_0_var(--ink)]">
            <div className="section-label is-alert">
              That sitting has finished
            </div>
            <p className="mt-1 text-sm leading-snug">
              Your access was for {sittingLabel(student.exam_sitting) ?? 'that sitting'}, and it
              has passed. Everything you did is still here to read back. To keep practising for the
              next sitting, get access again.
            </p>
            <a
              href={paymentLink()}
              target="_blank"
              rel="noopener"
              className="mt-3 block bg-red-pen p-3 text-center font-black text-white shadow-[3px_3px_0_var(--ink)]"
            >
              Get access for the next sitting
            </a>
          </section>
        )}
        {/* The diagnostic ranks topics; it is not a supply of questions. Sitting
            it again the same week would rank the same topics from the same
            eight answers. */}
        {error === 'diagnostic-taken' && (
          <section className="mt-4 border-[1.5px] border-ink bg-white p-4 shadow-[3px_3px_0_var(--ink)]">
            <div className="section-label is-alert">You have already done the diagnostic</div>
            <p className="mt-1 text-sm leading-snug">
              It ranks your topics, and it has — your sessions start where it put you. Another one
              this term would rank the same topics from the same answers. It opens again after{' '}
              {DIAGNOSTIC_INTERVAL_DAYS} days, for coming back to after a term away.
            </p>
          </section>
        )}
        {error === 'needs-access' && (
          <section className="mt-4 border-[1.5px] border-ink bg-white p-4 shadow-[3px_3px_0_var(--ink)]">
            <div className="section-label is-alert">
              That was your {FREE_SESSIONS} free sessions
            </div>
            <p className="mt-1 text-sm leading-snug">
              Everything you have done stays here — your marks, your topics, and every question you
              have answered. To sit another session, get access for your exam sitting.
            </p>
            <a
              href={paymentLink()}
              target="_blank"
              rel="noopener"
              className="mt-3 block bg-red-pen p-3 text-center font-black text-white shadow-[3px_3px_0_var(--ink)]"
            >
              Get access
            </a>
            <p className="mt-2 text-[11px] leading-snug text-dim">
              Use <span className="font-mono">{auth.email}</span> when you pay, so we can match it
              to this account.
            </p>
          </section>
        )}
        {error === 'no-questions' && (
          <p className="mt-4 border-l-3 border-red-pen bg-[#FDF1F0] p-3 text-sm">
            {mode === 'topic'
              ? 'There are no questions on that topic yet. Try another one, or start the usual session.'
              : 'No approved questions are available for your modules yet. Check back soon.'}
          </p>
        )}
        {error === 'nothing-to-revisit' && (
          <p className="mt-4 border-l-3 border-red-pen bg-[#FDF1F0] p-3 text-sm">
            Nothing to revisit yet — the marks you have lost are all from the last few days. Come
            back to them once they have had time to fade.
          </p>
        )}
        {error === 'no-topic' && (
          <p className="mt-4 border-l-3 border-red-pen bg-[#FDF1F0] p-3 text-sm">
            That topic is not one of yours. Pick one from the list.
          </p>
        )}


        {/* The session above is the one the app chooses, and it stays the
            default. These are the three things a student knows about their own
            week that it cannot: what class covered today, what they got wrong,
            and that it has never seen them work.

            Shown WHILE A SESSION IS OPEN as well. Hiding them until the old one
            was finished made finishing a prerequisite for choosing, which is
            backwards: a student who wants circle theorems tonight wants them
            tonight. Nothing is lost by starting another: sessions QUEUE rather
            than replace each other. completed_at is set only when every
            question in a session has been answered, and openSession returns the
            most recent unfinished one — so the half-done session is offered
            again as soon as the new one is finished. */}
        <section className="mt-6 border-t-[1.5px] border-rule pt-4">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-dim">
            Or choose for yourself
          </h2>
          {open && (
            <p className="mt-1 text-[11px] leading-snug text-dim">
              Starting one of these begins a new session. Your answers so far are saved, and the
              session above is waiting for you when this one is finished.
            </p>
          )}

            <form action={startSession} className="mt-3 flex flex-wrap items-center gap-2">
              <input type="hidden" name="mode" value="topic" />
              <label htmlFor="topic" className="text-sm">
                Practise a topic
              </label>
              <select
                id="topic"
                name="topic"
                defaultValue={topicChoices[0]?.code}
                className="min-w-0 flex-1 border-[1.5px] border-ink bg-paper p-2 text-base"
              >
                {topicChoices.map((t) => (
                  <option key={t.code} value={t.code}>
                    M{t.module} · {t.title}
                  </option>
                ))}
              </select>
              <button className="border-[1.5px] border-ink px-3 py-2 font-mono text-xs uppercase tracking-widest">
                Go
              </button>
            </form>

            <form action={startSession} className="mt-3">
              <input type="hidden" name="mode" value="revisit" />
              <button
                disabled={revisitMarks === 0}
                className="w-full border-[1.5px] border-ink p-3 text-left text-sm disabled:border-rule disabled:text-dim"
              >
                Revisit mistakes
                <small className="block font-mono text-[10px] uppercase tracking-widest text-dim">
                  {revisitMarks > 0
                    ? `${revisitMarks} mark${revisitMarks === 1 ? '' : 's'} lost across ${mistakes.lostByObjective.size} objective${mistakes.lostByObjective.size === 1 ? '' : 's'} · new questions on them`
                    : mistakes.waiting > 0
                      ? 'Nothing far enough back yet — these are still fresh'
                      : 'Nothing to revisit yet'}
                </small>
              </button>
            </form>

            {!isNewStudent && diagnosticOpen && (
            <form action={startSession} className="mt-3">
              <input type="hidden" name="mode" value="diagnostic" />
              <button className="w-full border-[1.5px] border-rule p-3 text-left text-sm text-dim">
                Take a quick diagnostic
                <small className="block font-mono text-[10px] uppercase tracking-widest text-dim">
                  About {DIAGNOSTIC_MINUTES} minutes · ranks your topics so the usual session knows
                  where to start
                </small>
              </button>
            </form>
            )}
        </section>

        {/* QUESTIONS YOU HAVE ALREADY DONE.
            The attempt, the marks, the mark scheme and the reasons a photograph
            earned are all stored; a finished session just stopped linking to
            them. These open the read-only view paging back inside a session
            already gives — no new attempt, nothing re-marked. */}
        {reviewable.length > 0 && (
          <section className="mt-5 border-[1.5px] border-ink bg-white p-3 shadow-[3px_3px_0_var(--ink)]">
            <div className="section-label">
              Look back at a question
            </div>
            <p className="mt-1 text-[11px] leading-snug text-dim">
              Read the mark scheme again, and what your working earned. Nothing here is re-marked.
            </p>
            <ul className="mt-2">
              {reviewable.map((r) => (
                <li key={`${r.sessionId}:${r.index}`}>
                  <Link
                    href={`/study/session/${r.sessionId}?q=${r.index}`}
                    className="flex min-h-11 items-baseline justify-between gap-2 border-b-[1.5px] border-rule text-[13px]"
                  >
                    <span className="underline">
                      {new Date(r.ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {r.photographed && (
                        <span className="ml-1 font-mono text-[10px] tracking-widest text-dim">
                          · PHOTO
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[12px] text-dim">
                      {r.earned}/{r.marks}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {progress.sessionsCompleted > 0 && (
          <section className="mt-5 border-[1.5px] border-ink bg-white p-3 shadow-[3px_3px_0_var(--ink)]">
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { n: progress.sessionsCompleted, label: progress.sessionsCompleted === 1 ? 'session' : 'sessions' },
                { n: progress.questionsAnswered, label: progress.questionsAnswered === 1 ? 'question' : 'questions' },
                { n: progress.marksAttempted, label: 'marks attempted' },
                { n: progress.streakDays, label: progress.streakDays === 1 ? 'day in a row' : 'days in a row' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-black">{s.n}</div>
                  <div className="font-mono text-[9px] uppercase leading-tight tracking-widest text-dim">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {([1, 2, 3] as const)
          .filter((m) => student.target_modules.includes(m))
          .map((m) => (
            <section key={m} className="mt-8">
              <div className="flex items-baseline justify-between">
                <h2 className="font-black">Module {m}</h2>
                <span className="font-mono text-xs text-dim">
                  {Math.round(state.moduleMastery[m] * 100)}% topic strength
                </span>
              </div>
              <div className="mt-2 space-y-3">
                {state.topics
                  .filter((t) => t.module === m)
                  .map((t) => (
                    <div key={t.code}>
                      <div className="flex justify-between text-sm">
                        <b>{t.title}</b>
                        <span className="font-mono text-[10px] text-dim">{BAND_LABEL[t.band]}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded border border-ink bg-paper-deep">
                        <i
                          className={`block h-full ${barColor(t.band)}`}
                          style={{ width: `${Math.max(2, Math.round(t.mastery * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          ))}
      </div>
    </main>
  );
}
