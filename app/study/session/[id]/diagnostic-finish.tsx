import Link from 'next/link';
import { startSession } from '../../actions';

export interface RankedTopic {
  code: string;
  title: string;
  right: number;
  /** 0 when the diagnostic never asked about the topic. */
  asked: number;
  /** Marks the estimate could gain from the topic, from the leverage computation. */
  marks: number;
}

const ROW = 'grid grid-cols-[28px_1fr_auto] gap-3';

/**
 * THE RANKED FINISH (ROUND_9 Task 5; §06): every topic in order, the measured
 * ones above a rule and the unasked ones below it, the marks each could gain,
 * a button that starts row 1, and no grade — a diagnostic is not marked.
 */
export function DiagnosticFinish({ ranked, minutes }: { ranked: RankedTopic[]; minutes: number }) {
  const first = ranked[0];
  const measured = ranked.filter((t) => t.asked > 0).length;
  return (
    <div className="lg:max-w-[var(--col)]">
      <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-red-pen">Diagnostic done</div>
      <h1 className="mb-3 mt-2 text-[27px] font-black tracking-[-0.02em]">
        Here is the order<span className="text-red-pen">.</span>
      </h1>
      <p className="mb-5 text-[15px] leading-normal">
        A quick read of {measured} topic{measured === 1 ? '' : 's'} — enough to put them in order, which is all it was for.
      </p>
      <div className={`${ROW} pb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-dim`}>
        <span />
        <span />
        <span>To gain</span>
      </div>
      <ol>
        {ranked.map((t, i) => (
          <li
            key={t.code}
            className={`${ROW} items-baseline py-3 ${i === 0 || (t.asked === 0 && ranked[i - 1].asked > 0) ? 'border-t-[1.5px] border-ink' : 'border-t border-margin'} last:border-b last:border-b-margin`}
          >
            <span className={`font-mono text-sm ${t.right < t.asked ? 'text-red-pen' : 'text-dim'}`}>{String(i + 1).padStart(2, '0')}</span>
            <span>
              <b className="text-[15px]">{t.title}</b>
              <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.08em] text-dim">
                {t.asked > 0 ? `${t.right} of ${t.asked} right` : 'not asked yet'}
              </span>
            </span>
            <span className={`shrink-0 font-mono text-[13px] ${t.right < t.asked ? 'text-green-pen' : 'text-dim'}`}>up to +{t.marks} marks</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] leading-snug text-dim">
        One question a topic is a rough read — enough to point the next few sessions, not a verdict on any of them. Topics below the rule were not asked about, and count as unmeasured.
      </p>
      <form action={startSession} className="mt-[22px]">
        <input type="hidden" name="mode" value={first ? 'topic' : 'adaptive'} />
        {first && <input type="hidden" name="topic" value={first.code} />}
        <button className="min-h-11 w-full bg-red-pen px-4 py-[18px] text-left text-lg font-black text-white shadow-[var(--shadow-card)]">
          {first ? `Start with ${first.title.charAt(0).toLowerCase()}${first.title.slice(1)}` : 'Start that session'}
          <small className="mt-1.5 block font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] opacity-85">
            {minutes} minutes · {first ? 'your next session starts here' : 'at exam pace'}
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
