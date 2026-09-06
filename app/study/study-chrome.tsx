import { Lockup } from '../lockup';
import { changeSitting, logout } from './actions';
import { LANDING } from '@/lib/landing-content';
import { StudyTabs } from './study-tabs';
import { SITTINGS, SITTING_IDS } from '@/lib/sittings';

/**
 * THE NOTEBOOK'S CHROME (ROUND_8 Task 0): the white bar above the paper —
 * lockup, three tabs, sitting, Help, Sign out — two rows at 390 and one at
 * 1280, then the paper with the sheet's rule geometry. Every student page
 * renders inside it; the page draws only what is on the paper.
 */
export function StudyChrome({
  sitting,
  current,
  email,
  children,
}: {
  sitting: string;
  /** The sitting the account is entered for, as the disclosure's selected option. */
  current: string;
  email: string;
  children: React.ReactNode;
}) {
  const account = <Account sitting={sitting} current={current} email={email} />;
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b-[1.5px] border-ink bg-white px-5 lg:px-6">
        <div className="mx-auto flex max-w-[var(--bar-width)] flex-wrap items-center gap-x-6 gap-y-0">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3 py-2 lg:flex-none lg:py-0">
            <Lockup width={130} className="shrink-0" />
            <div className="relative flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-dim lg:hidden">
              {account}
              <a href={`mailto:${LANDING.contactEmail}`} className="whitespace-nowrap underline underline-offset-[3px]">Help</a>
              <form action={logout}>
                <button className="min-h-11 whitespace-nowrap underline underline-offset-[3px]">Sign out</button>
              </form>
            </div>
          </div>
          <div className="flex w-full min-w-0 items-center lg:w-auto lg:flex-1">
            <StudyTabs />
          </div>
          <div className="relative hidden items-center gap-4 font-mono text-[10px] uppercase tracking-[0.1em] text-dim lg:flex">
            {account}
            <a href={`mailto:${LANDING.contactEmail}`} className="whitespace-nowrap underline underline-offset-[3px]">Help</a>
            <form action={logout}>
              <button className="min-h-11 whitespace-nowrap underline underline-offset-[3px]">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      {/* The paper: rules every --rule-gap, the margin rule at the sheet's offset. */}
      <main className="ruled relative px-5 pb-8 pt-7 [container-type:inline-size] lg:px-6">
        <div className="pointer-events-none absolute inset-y-0 left-[var(--rule-offset-sm)] w-[1.5px] bg-margin lg:left-[calc(50%-var(--bar-width)/2+var(--rule-offset-lg))]" />
        <div className="relative mx-auto max-w-[var(--bar-width)]">{children}</div>
      </main>
    </div>
  );
}

const FIELD = 'mt-1 block w-full border-[1.5px] border-ink bg-paper p-2 font-sans text-sm normal-case tracking-normal text-ink';

/**
 * THE ACCOUNT DISCLOSURE: the sitting in the bar opens to who is signed in and
 * the one thing about the account a student can change. A change is allowed
 * any time; the grant stays with the sitting it was for (ROUND_9 Task 9).
 */
function Account({ sitting, current, email }: { sitting: string; current: string; email: string }) {
  return (
    <details>
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-right underline underline-offset-[3px] [&::-webkit-details-marker]:hidden">
        {sitting}
      </summary>
      <div className="absolute right-0 z-10 mt-1 w-[min(20rem,calc(100vw-2.5rem))] border-[1.5px] border-ink bg-white p-4 text-left shadow-[var(--shadow-panel)]">
        <div className="break-all font-mono text-[11px] normal-case tracking-normal text-ink">{email}</div>
        <form action={changeSitting} className="mt-3">
          <label className="block">
            <span className="block">Which sitting are you entered for</span>
            <select name="to" defaultValue={current} className={FIELD}>
              {SITTING_IDS.map((s) => (
                <option key={s} value={s}>
                  {SITTINGS[s].label}
                </option>
              ))}
            </select>
          </label>
          <button className="mt-3 block min-h-11 w-full border-[1.5px] border-ink p-3 text-left font-sans text-sm normal-case tracking-normal text-ink">
            Change sitting
          </button>
        </form>
      </div>
    </details>
  );
}
