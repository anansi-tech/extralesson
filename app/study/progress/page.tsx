import { dbConnect, Student } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { loadStudyState } from '@/lib/study/state';
import { BAND_LABEL } from '@/lib/study/profiles';
import type { ModuleNumber } from '@/lib/types';
import type { MasteryBand } from '@/lib/mastery/config';

export const metadata = { title: 'Progress — ExtraLesson' };
export const dynamic = 'force-dynamic';

function barColor(band: MasteryBand): string {
  if (band === 'STRONG') return 'bg-green-pen';
  if (band === 'BUILDING') return 'bg-[#D9A62E]';
  return 'bg-red-pen';
}

/** Each module's estimate beside the topics that make it. Reads attempts; writes nothing. */
export default async function ProgressPage() {
  const auth = await requireSession();
  await dbConnect();
  const student = await Student.findById(auth.student_id).lean<{
    syllabus_mode: 'legacy-jan' | 'modular-2027';
    target_modules: ModuleNumber[];
  } | null>();
  if (!student) return null;
  const state = await loadStudyState(auth.student_id, student.target_modules);
  const { prediction } = state;
  // The Jan sitting awards one overall grade, so no module letter exists to show (§6.6).
  const letterFor = (m: ModuleNumber) =>
    student.syllabus_mode === 'legacy-jan' || !prediction.estimable ? null : prediction.modules.find((x) => x.module === m)?.letter ?? null;

  return (
    <div>
      <h1 className="mt-5 text-2xl font-black">
          Where you stand, topic by topic<span className="text-red-pen">.</span>
        </h1>
        <p className="mt-1 text-[12px] leading-snug text-dim">
          {prediction.estimable
            ? 'Every figure is an estimate from the questions you have answered. It moves with every session.'
            : 'Finish one session and your estimates appear here. Until then the bars show only what you have tried.'}
        </p>

        {([1, 2, 3] as const)
          .filter((m) => student.target_modules.includes(m))
          .map((m) => {
            const letter = letterFor(m);
            return (
              <section key={m} className="mt-8">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-black">
                    Module {m}
                    {letter && <span className="ml-2 text-red-pen">{letter}</span>}
                    {letter && <span className="ml-1 font-mono text-[10px] font-normal uppercase tracking-widest text-dim">est.</span>}
                  </h2>
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
            );
          })}
    </div>
  );
}
