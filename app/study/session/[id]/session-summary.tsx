import Link from 'next/link';
import { startSession } from '../../actions';

export interface SummaryProps {
  eyebrow: string;
  /** The heading: "14 of 21 marks", or the diagnostic's "Nothing scored". */
  headline: string;
  /** The claim under it, from the fold; none when there is nothing to compare against. */
  claim?: string | null;
  /** The questions in a row, each opening its own marking. */
  questions: { index: number; earned: number; assessed: number; href: string }[];
  tilesLabel?: string;
  /** The letter, only when the gate allows an estimate. */
  estimate?: string | null;
  /** Per objective, from the fold: recovered or still going. */
  objectives?: { text: string; recovered: boolean }[];
  /** The one line of what moved, from the fold. */
  moved?: string | null;
  /** A block of the page's own words before the action, such as "Next: the diagnostic". */
  before?: React.ReactNode;
  action: { label: string; small: string; mode: string };
  quiet: { label: string; href: string };
}

/**
 * ONE SKELETON FOR EVERY SESSION SUMMARY (ROUND_9 Task 6; Diagnostic and
 * Summary.dc.html §07): the marks, the questions in a row, one line of what
 * moved, one action. What differs is the claim, and every claim is the fold's.
 */
export function SessionSummary(p: SummaryProps) {
  return (
    <div className="lg:max-w-[var(--col)]">
      <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-red-pen">{p.eyebrow}</div>
      <h1 className="mb-1 mt-2 text-[27px] font-black tracking-[-0.02em]">
        {p.headline}
        <span className="text-red-pen">.</span>
      </h1>
      {p.claim && <p className="text-[13px] leading-normal text-dim">{p.claim}</p>}

      {p.questions.length > 0 && (
        <div className="mt-5">
          {p.tilesLabel && <div className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em]">{p.tilesLabel}</div>}
          <div className="flex gap-2">
            {p.questions.map((q) => (
              <Link key={q.index} href={q.href} className="min-w-0 flex-1 border-[1.5px] border-ink bg-white px-2 py-2.5 text-center">
                <div className="font-mono text-[15px]">
                  {q.earned}/{q.assessed}
                </div>
                <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-dim">Q{q.index + 1}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {p.estimate && (
        <div className="mt-5 border-t-[1.5px] border-ink pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]">Estimate today</div>
          </div>
          <div className="mt-1 text-xl font-black leading-[1.1] text-red-pen">{p.estimate}</div>
        </div>
      )}

      {p.objectives && p.objectives.length > 0 && (
        <ul className="mt-5">
          {p.objectives.map((o) => (
            <li key={o.text} className="flex items-baseline gap-2.5 border-b border-paper-deep py-2 text-sm last:border-b-0">
              <span className={`shrink-0 font-hand text-xl leading-none ${o.recovered ? 'text-green-pen' : 'text-dim'}`}>{o.recovered ? '✓' : '–'}</span>
              <span>
                {o.text} <span className="font-mono text-[10px] text-dim">{o.recovered ? 'recovered' : 'still going'}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {p.moved && <p className="mt-5 font-hand text-lg leading-snug text-red-pen">{p.moved}</p>}

      {p.before}

      <form action={startSession} className="mt-5">
        <input type="hidden" name="mode" value={p.action.mode} />
        <button className="min-h-11 w-full bg-red-pen px-4 py-[18px] text-left text-lg font-black text-white shadow-[var(--shadow-card)]">
          {p.action.label}
          <small className="mt-1.5 block font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] opacity-85">{p.action.small}</small>
        </button>
      </form>
      <div className="mt-[18px] border-t border-margin pt-3">
        <Link href={p.quiet.href} className="inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-[0.14em] underline underline-offset-[3px]">
          {p.quiet.label}
        </Link>
      </div>
    </div>
  );
}
