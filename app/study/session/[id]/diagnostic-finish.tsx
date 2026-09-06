import Link from 'next/link';
import { startSession } from '../../actions';

export interface RankedTopic {
  code: string;
  title: string;
  right: number;
  asked: number;
  /** Marks the estimate could gain from the topic, from the leverage computation. */
  marks: number;
}

/**
 * THE RANKED FINISH (ROUND_9 Task 5; §06): the order the diagnostic went to
 * get, with the marks beside each topic, the session that actually comes
 * next, and no grade — a diagnostic is not marked.
 */
export function DiagnosticFinish({ ranked, next, minutes }: { ranked: RankedTopic[]; next: string | null; minutes: number }) {
  return (
    <div className="lg:max-w-[var(--col)]">
      <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-red-pen">Diagnostic done</div>
      <h1 className="mb-3 mt-2 text-[27px] font-black tracking-[-0.02em]">
        Here is the order<span className="text-red-pen">.</span>
      </h1>
      <p className="mb-5 text-[15px] leading-normal">
        A quick read of {ranked.length} topic{ranked.length === 1 ? '' : 's'} — enough to put them in order, which is all it was for.
      </p>
      <ol>
        {ranked.map((t, i) => (
          <li key={t.code} className={`grid grid-cols-[28px_1fr_auto] items-baseline gap-3 py-3 ${i === 0 ? 'border-t-[1.5px] border-ink' : 'border-t border-margin'} last:border-b last:border-b-margin`}>
            <span className={`font-mono text-sm ${t.right < t.asked ? 'text-red-pen' : 'text-dim'}`}>{String(i + 1).padStart(2, '0')}</span>
            <span>
              <b className="text-[15px]">{t.title}</b>
              <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.08em] text-dim">
                {t.right} of {t.asked} right
              </span>
            </span>
            <span className={`shrink-0 font-mono text-[13px] ${t.right < t.asked ? 'text-green-pen' : 'text-dim'}`}>+{t.marks} marks</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] leading-snug text-dim">
        One question a topic is a rough read — enough to point the next few sessions, not a verdict on any of them. Topics you were not asked about are not here at all, and still count as unmeasured.
      </p>
      <form action={startSession} className="mt-[22px]">
        <input type="hidden" name="mode" value="adaptive" />
        <button className="min-h-11 w-full bg-red-pen px-4 py-[18px] text-left text-lg font-black text-white shadow-[var(--shadow-card)]">
          {next ? `Start with ${next.charAt(0).toLowerCase()}${next.slice(1)}` : 'Start that session'}
          <small className="mt-1.5 block font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] opacity-85">
            {minutes} minutes · {next ? 'your next session starts here' : 'at exam pace'}
          </small>
        </button>
      </form>
      <p className="mt-3.5 border-l-3 border-margin bg-[#FFFDF6] px-3 py-2 text-[13px] leading-snug text-dim">
        No grade yet. A grade needs enough marks seen in every module it covers, and the diagnostic is not marked.
      </p>
      <Link href="/study" className="mt-5 inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-[0.14em] text-dim underline underline-offset-[3px]">
        Back to your notebook
      </Link>
    </div>
  );
}
