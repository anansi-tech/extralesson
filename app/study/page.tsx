import { dbConnect, Student } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { loadStudyState } from '@/lib/study/state';
import { coverageSentence } from '@/lib/targets/coverage';
import { paperShape } from '@/lib/exam/paper-shape';
import Link from 'next/link';
import { logout, startSession } from './actions';
import { openSession } from '@/lib/study/open-session';
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
  const open = await openSession(auth.student_id);
  const { prediction } = state;
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

        <section className="mt-6 border-[1.5px] border-ink bg-white p-5 text-center shadow-[3px_3px_0_var(--ink)]">
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
              <div className="text-5xl font-black text-red-pen">{prediction.overall_grade}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-dim">
                Estimated overall grade · estimate only
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center gap-6">
                {prediction.modules.map((m) => (
                  <div key={m.module}>
                    <div className="text-4xl font-black text-red-pen">{m.letter ?? '—'}</div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
                      M{m.module} est.
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-dim">
                Overall estimate: {prediction.overall_grade} · all figures are estimates
              </div>
            </>
          )}
          {prediction.estimable && (
            <div className="mt-1 font-mono text-[9px] text-dim">
              Paper 3 project assumed at neutral carry-over — estimates move as you practise.
            </div>
          )}
          <p className="mt-3 border-t border-dashed border-paper-deep pt-3 text-left text-[11px] leading-snug text-dim">
            {paperShape(student.syllabus_mode)}
          </p>
          <p className="mt-2 text-left text-[11px] leading-snug text-dim">{coverage}</p>
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
