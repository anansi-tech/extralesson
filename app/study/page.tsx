import { dbConnect, Student } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { loadStudyState } from '@/lib/study/state';
import { coverageSentence } from '@/lib/targets/coverage';
import { paperShape } from '@/lib/exam/paper-shape';
import Link from 'next/link';
import { logout, startSession } from './actions';
import { openSession } from '@/lib/study/open-session';
import { loadProgress } from '@/lib/study/progress';
import { examDateFor, projectTrajectory, topicLeverage } from '@/lib/study/trajectory';
import { PracticeSession } from '@/lib/db';
import { SESSION_MINUTES } from '@/lib/session/builder';
import type { ModuleNumber } from '@/lib/types';
import type { MasteryBand } from '@/lib/mastery/config';

export const metadata = { title: 'Your copybook — ExtraLesson' };
export const dynamic = 'force-dynamic';

const bandLabel: Record<MasteryBand, string> = {
  STRONG: 'STRONG',
  BUILDING: 'BUILDING',
  WEAK: 'WEAK',
  NOT_STARTED: 'NOT STARTED',
};

function barColor(band: MasteryBand): string {
  if (band === 'STRONG') return 'bg-green-pen';
  if (band === 'BUILDING') return 'bg-[#D9A62E]';
  return 'bg-red-pen';
}

export default async function StudyDashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const auth = await requireSession();
  const { error } = await searchParams;
  await dbConnect();
  const student = await Student.findById(auth.student_id).lean<{
    name: string;
    exam_sitting: string;
    syllabus_mode: 'legacy-jan' | 'modular-2027';
    target_modules: ModuleNumber[];
  } | null>();
  if (!student) return null;

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
  const leadWithReachable =
    reachable.length > 0 && (!prediction.estimable || prediction.overall_percent < 50);
  // Stating what we cannot mark is a trust asset — it sits with the estimate it
  // qualifies, not in a footnote (R1.6 §3).
  const coverage = coverageSentence(state.coverage);

  return (
    <main className="ruled relative min-h-screen px-5 py-8">
      <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
      <div className="mx-auto max-w-xl">
        <header className="flex items-baseline justify-between">
          <div className="text-xl font-black">
            extra<em className="not-italic text-red-pen">lesson</em>
          </div>
          <div className="flex items-baseline gap-3">
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
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-sm text-green-pen">
                    +{t.pointsAvailable.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-dashed border-paper-deep pt-3 text-[12px] leading-snug text-dim">
              Those numbers are percentage points on your estimate, still sitting in those topics —
              the most any one of them can add if you master it. Your sessions go here first.
            </p>
            {trajectory && !trajectory.flat ? (
              <p className="mt-2 text-[12px] leading-snug">
                At the rate you have been working —{' '}
                <b>{trajectory.sessionsPerWeek.toFixed(1)} sessions a week</b>, each moving your
                estimate about <b>{trajectory.perSession.toFixed(1)} points</b> — you are on track
                for <b className="text-green-pen">{trajectory.projectedGrade}</b> by the exam. That
                is your own rate over your last {trajectory.sessionsMeasured} sessions, not a
                promise.
              </p>
            ) : trajectory ? (
              <p className="mt-2 text-[12px] leading-snug text-dim">
                Your estimate has not moved over your last {trajectory.sessionsMeasured} sessions.
                The topics above are where it will move first.
              </p>
            ) : (
              <p className="mt-2 text-[12px] leading-snug text-dim">
                Finish a couple more sessions and we can show you the grade your current rate is
                heading for.
              </p>
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
                {prediction.overall_grade}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-dim">
                Estimated overall grade · estimate only
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
                {prediction.overall_grade} · all figures are estimates
              </div>
            </>
          )}
          {prediction.estimable && (
            <div className="mt-1 font-mono text-[9px] text-dim">
              Paper 3 project assumed at neutral carry-over — estimates move as you practise.
            </div>
          )}
          <details className="mt-3 border-t border-dashed border-paper-deep pt-3 text-left">
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-dim">
              How this estimate is worked out
            </summary>
            <p className="mt-2 text-[11px] leading-snug text-dim">{paperShape(student.syllabus_mode)}</p>
            <p className="mt-2 text-[11px] leading-snug text-dim">{coverage}</p>
          </details>
        </section>

        {error === 'no-questions' && (
          <p className="mt-4 border-l-3 border-red-pen bg-[#FDF1F0] p-3 text-sm">
            No approved questions are available for your modules yet. Check back soon.
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
            : 'One or two whole exam questions, priced the way the paper prices them — a Paper 2 question is 9 to 12 marks and takes most of the session.'}
        </p>

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
                  {Math.round(state.moduleMastery[m] * 100)}% mastery
                </span>
              </div>
              <div className="mt-2 space-y-3">
                {state.topics
                  .filter((t) => t.module === m)
                  .map((t) => (
                    <div key={t.code}>
                      <div className="flex justify-between text-sm">
                        <b>{t.title}</b>
                        <span className="font-mono text-[10px] text-dim">{bandLabel[t.band]}</span>
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
