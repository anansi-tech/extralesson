import Link from 'next/link';

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const words = (n: number) => WORDS[n] ?? String(n);

/** How long each question gets, said the way a student would. */
function perQuestion(minutes: number, total: number): string {
  const m = minutes / total;
  if (m === 1) return 'a minute';
  if (m === 1.5) return 'a minute and a half';
  return `${Math.round(m * 10) / 10} minutes`;
}

/**
 * BEFORE THE FIRST TAP (ROUND_9 Task 5; Diagnostic and Summary.dc.html §06):
 * the three facts and the real count. A diagnostic answered part way is not
 * ranked, so nothing here promises stopping early.
 */
export function DiagnosticIntro({ total, minutes, href }: { total: number; minutes: number; href: string }) {
  const facts: [string, string][] = [
    [`${minutes} min`, `About ${perQuestion(minutes, total)} a question`],
    ['No marks', 'Nothing here is scored, and nothing here counts against you'],
    ['No paper', 'Tap the answer — this one is not worked by hand'],
  ];
  return (
    <div className="lg:max-w-[var(--col)]">
      <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-red-pen">Next: the diagnostic</div>
      <h1 className="mb-3.5 mt-2 text-[27px] font-black tracking-[-0.02em]">
        A quick diagnostic<span className="text-red-pen">.</span>
      </h1>
      <p className="mb-5 text-base leading-normal">
        {words(total).replace(/^./, (c) => c.toUpperCase())} quick questions across the syllabus. Nothing is graded — it puts your topics in order, so the sessions after it start in the right place.
      </p>
      <ul className="mb-6">
        {facts.map(([k, v]) => (
          <li key={k} className="flex gap-3 border-b border-paper-deep py-2.5 text-[14.5px] last:border-b-0">
            <span className="min-w-16 shrink-0 font-mono text-[11px] uppercase tracking-[0.08em] text-dim">{k}</span>
            <span>{v}</span>
          </li>
        ))}
      </ul>
      <Link href={href} className="block min-h-11 w-full bg-red-pen px-4 py-[18px] text-left text-lg font-black text-white shadow-[var(--shadow-card)]">
        Start the diagnostic
        <small className="mt-1.5 block font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] opacity-85">{words(total)} questions</small>
      </Link>
    </div>
  );
}
