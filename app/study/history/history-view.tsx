import Link from 'next/link';
import { startSession } from '../actions';
import type { HistoryRow } from '@/lib/study/history';

/**
 * HISTORY AS DRAWN (ROUND_8 Task 4): every attempt, newest first, each
 * opening at its marking; at the foot, the way back to the marks lost.
 * Reads the fold's rows; writes nothing.
 */
export function HistoryView({ rows, lostMarks }: { rows: HistoryRow[]; lostMarks: number }) {
  return (
    <div className="lg:max-w-[var(--col)]">
      <h1 className="text-2xl font-black leading-[1.1] tracking-[-0.015em]">
        Every question you have answered<span className="text-red-pen">.</span>
      </h1>
      <p className="mt-1.5 text-xs leading-snug text-dim">
        Newest first. Each opens at your marking, as it was; nothing here is re-marked.
      </p>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-dim">Nothing yet. Your first question is on your notebook.</p>
      ) : (
        <ul className="mt-[18px]">
          {rows.map((r) => (
            <li key={`${r.sessionId}:${r.index}:${r.ts.getTime()}`}>
              <Link
                href={`/study/session/${r.sessionId}?q=${r.index}#marking`}
                className="flex min-h-11 items-baseline gap-3 border-b-[1.5px] border-rule py-2 text-[13px]"
              >
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
                  {r.ts.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
                <span className="question-prose min-w-0 flex-1 truncate underline underline-offset-[3px]" dangerouslySetInnerHTML={{ __html: r.stemHtml }} />
                <span className="shrink-0 font-mono text-xs text-dim">
                  {r.earned}/{r.marks}
                  {r.unassessed > 0 && ` · ${r.unassessed} unassessed`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {lostMarks > 0 && (
        <form action={startSession} className="mt-[22px] border-t border-margin pt-3.5">
          <input type="hidden" name="mode" value="revisit" />
          <button className="min-h-11 w-full bg-red-pen p-4 text-left text-[17px] font-black text-white shadow-[var(--shadow-card)]">
            Revisit the {lostMarks} mark{lostMarks === 1 ? '' : 's'} you lost
            <small className="mt-1 block font-mono text-[10px] font-medium tracking-[0.1em] opacity-85">NEW QUESTIONS ON THE SAME OBJECTIVES</small>
          </button>
        </form>
      )}
    </div>
  );
}
