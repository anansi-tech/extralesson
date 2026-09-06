import { startSession } from '../actions';
import { BAND_LABEL } from '@/lib/study/profiles';
import type { MasteryBand } from '@/lib/mastery/config';
import type { ModuleNumber } from '@/lib/types';

export interface ProgressModule {
  module: ModuleNumber;
  /** The estimated letter, or nothing to show yet. */
  letter: string | null;
  strength: number;
  topics: { code: string; title: string; band: MasteryBand; mastery: number }[];
}

export interface WeakestTopic {
  code: string;
  title: string;
  /** Marks the estimate could gain from it. */
  marks: number;
}

function barColor(band: MasteryBand): string {
  if (band === 'STRONG') return 'bg-green-pen';
  if (band === 'BUILDING') return 'bg-amber';
  return 'bg-red-pen';
}

const sentenceCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/**
 * PROGRESS AS DRAWN (ROUND_8 Task 4): each module's estimate beside the
 * topics that make it; at the foot, the weakest topic to practise. Reads the
 * fold; writes nothing.
 */
export function ProgressView({ estimable, modules, weakest }: { estimable: boolean; modules: ProgressModule[]; weakest: WeakestTopic | null }) {
  return (
    <div className="lg:max-w-[var(--col)]">
      <h1 className="text-2xl font-black leading-[1.1] tracking-[-0.015em]">
        Where you stand, topic by topic<span className="text-red-pen">.</span>
      </h1>
      <p className="mt-1.5 text-xs leading-snug text-dim">
        {estimable
          ? 'Every figure is an estimate from the questions you have answered. It moves with every session.'
          : 'Finish one session and your estimates appear here. Until then the bars show only what you have tried.'}
      </p>

      {modules.map((m, i) => (
        <section key={m.module} className={i === 0 ? 'mt-6' : 'mt-7'}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-black">
              Module {m.module}
              {m.letter && <span className="ml-1.5 text-red-pen">{m.letter}</span>}
              {m.letter && <span className="ml-1 font-mono text-[10px] font-normal uppercase tracking-[0.1em] text-dim">est.</span>}
            </h2>
            <span className="font-mono text-xs text-dim">{Math.round(m.strength * 100)}% topic strength</span>
          </div>
          <div className="mt-2.5 flex flex-col gap-3">
            {m.topics.map((t) => (
              <div key={t.code}>
                <div className="flex justify-between gap-3 text-sm">
                  <b>{t.title}</b>
                  <span className="shrink-0 font-mono text-[10px] text-dim">{sentenceCase(BAND_LABEL[t.band])}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded border border-ink bg-paper-deep">
                  <i className={`block h-full ${barColor(t.band)}`} style={{ width: `${Math.max(2, Math.round(t.mastery * 100))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {weakest && (
        <form action={startSession} className="mt-[26px] border-t border-margin pt-3.5">
          <input type="hidden" name="mode" value="topic" />
          <input type="hidden" name="topic" value={weakest.code} />
          <button className="min-h-11 w-full bg-red-pen p-4 text-left text-[17px] font-black text-white shadow-[var(--shadow-card)]">
            Practise {weakest.title.charAt(0).toLowerCase() + weakest.title.slice(1)}
            <small className="mt-1 block font-mono text-[10px] font-medium tracking-[0.1em] opacity-85">
              WEAKEST TOPIC · WORTH +{weakest.marks} MARK{weakest.marks === 1 ? '' : 'S'}
            </small>
          </button>
        </form>
      )}
    </div>
  );
}
