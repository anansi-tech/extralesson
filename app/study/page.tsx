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
  const [topicChoices, mistakes] = await Promise.all([
    loadTopicChoices(student.target_modules),
    loadMistakes(auth.student_id),
  ]);
  const revisitMarks = [...mistakes.lostByObjective.values()].reduce((a, b) => a + b, 0);
  const isNewStudent = mistakes.attemptedIds.size === 0;

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
  const leadWithReachable =
    reachable.length > 0 && (!prediction.estimable || prediction.overall_percent < 50);
  // Stating what we cannot mark is a trust asset — it sits with the estimate it
  // qualifies, not in a footnote (R1.6 §3).
  const coverage = coverageSummary(state.coverage);
  const coverageMore = coverageDetail(state.coverage);

  return (
    <main className="ruled relative min-h-screen px-5 py-8">
      <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
      <div className="mx-auto max-w-xl">
        <header className="flex items-baseline justify-between">
          <div className="text-xl font-black">
            extra<em className="not-italic text-red-pen">lesson</em>
          </div>
          <div className="flex items-baseline gap-3">
            {/* Signing in lands an admin here, in the product, because an admin
                is also a student and seeing what a student sees is the point of
                having the account at all. This is the way across — without it
                the review queue was reachable only by typing the URL. */}
            {isAdmin && (
              <Link
                href="/admin/review"
                className="font-mono text-[10px] uppercase tracking-widest text-red-pen underline"
              >
                Review queue
              </Link>
            )}
            <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
              {student.syllabus_mode === 'legacy-jan' ? 'CSEC MATH · JAN RE-SIT' : 'CSEC MATH · MAY/JUNE 2027'}
            </span>
            <form action={logout}>
              <button className="font-mono text-[10px] uppercase tracking-widest text-dim underline">
                Sign out
              </button>
            </form>
          </div>
        </header>

        {leadWithReachable && (
          <section className="mt-6 border-[1.5px] border-ink bg-white p-5 shadow-[3px_3px_0_var(--ink)]">
            <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
              Where your marks are
            </div>
            <ul className="mt-2 space-y-2">
              {reachable.map((t) => (
                <li key={t.code} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0">
                    <b>{t.title}</b>
                    <span className="ml-2 font-mono text-[10px] text-dim">
                      M{t.module} · {Math.round(t.mastery * 100)}% so far
                      {m1Gated && t.module !== 1 && ' · after Module 1'}
                    </span>
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
            <p className="mt-3 border-t border-dashed border-paper-deep pt-3 text-[12px] leading-snug text-dim">
              Each number is how much your overall grade estimate could rise if you mastered that
              topic — the marks still sitting there, out of 100. Your sessions go here first.
            </p>
            {gatedTopics.length > 0 && (
              <p className="mt-2 text-[12px] leading-snug text-dim">
                {gatedTopics.length === 1 ? 'One of these sits' : 'Some of these sit'} in a later
                module. Module 1 comes first because the rest of the syllabus is built on it, so
                today&rsquo;s session stays there until your Module 1 topics are stronger. You can
                still practise{' '}
                {gatedTopics.length === 1 ? gatedTopics[0].title : 'any of them'} by name below.
              </p>
            )}
            {trajectory && !trajectory.flat ? (
              <p className="mt-2 text-[12px] leading-snug">
                At the rate you have been working —{' '}
                <b>{trajectory.sessionsPerWeek.toFixed(1)} sessions a week</b>, each moving your
                estimate about <b>{trajectory.perSession.toFixed(1)} points</b> — you are on track
                for <b className="text-green-pen">{gradeLabel(trajectory.projectedGrade)}</b>,{' '}
                {gradePlace(trajectory.projectedGrade)}, by the exam. That is your own rate over
                your last {trajectory.sessionsMeasured} sessions, capped at the next grade up — a
                direction, not a promise.
              </p>
            ) : trajectory ? (
              <p className="mt-2 text-[12px] leading-snug text-dim">
                Your estimate has not moved over your last {trajectory.sessionsMeasured} sessions.
                The topics above are where it will move first.
              </p>
            ) : (
              <p className="mt-2 text-[12px] leading-snug text-dim">{trajectoryWait(gap)}</p>
            )}
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
              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-dim">
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
              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-dim">
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
                    <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
                      M{m.module} est.
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-dim">
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
          {/* The summary is short enough to be read standing up. Everything it
              compressed is one tap away, for the parent who wants the whole
              answer before paying for it. */}
          <p className="mt-3 border-t border-dashed border-paper-deep pt-3 text-left text-[11px] leading-snug text-dim">
            {coverage}
          </p>
          <details className="mt-2 text-left">
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-dim">
              What we cover
            </summary>
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
            <form action={startSession} className="mt-5">
              <input type="hidden" name="mode" value="diagnostic" />
              <button className="w-full bg-red-pen p-4 text-center font-black text-white shadow-[4px_4px_0_var(--ink)]">
                Start with a quick diagnostic
                <small className="block font-mono text-[10px] font-medium tracking-widest opacity-85">
                  ABOUT {DIAGNOSTIC_MINUTES} MINUTES · FINDS WHERE TO START
                </small>
              </button>
            </form>
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
                className="min-w-0 flex-1 border-[1.5px] border-ink bg-paper p-2 text-sm"
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

            {!isNewStudent && (
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

        <Link
          href="/study/practice"
          className="mt-3 block border-[1.5px] border-ink bg-white p-3 text-center font-mono text-[11px] uppercase tracking-widest shadow-[3px_3px_0_var(--ink)]"
        >
          Worked practice
          <small className="block font-sans text-[10px] normal-case tracking-normal text-dim">
            &ldquo;Show that&rdquo;, &ldquo;explain&rdquo; and drawing questions — you mark these yourself
          </small>
        </Link>

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
