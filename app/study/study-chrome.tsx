import Link from 'next/link';
import { Lockup } from '../lockup';
import { changeSitting, logout } from './actions';
import { LANDING } from '@/lib/landing-content';
import { StudyTabs } from './study-tabs';
import { SITTINGS, SITTING_IDS } from '@/lib/sittings';
import { AccountDisclosure } from './account-disclosure';

/**
 * THE NOTEBOOK'S CHROME (ROUND_8 Task 0): the white bar above the paper —
 * lockup, three tabs, Account and Help — two rows at 390 and one at
 * 1280, then the paper with the sheet's rule geometry. Every student page
 * renders inside it; the page draws only what is on the paper.
 */
export function StudyChrome({
  sitting,
  current,
  email,
  isAdmin = false,
  children,
}: {
  sitting: string;
  /** The sitting the account is entered for, as the disclosure's selected option. */
  current: string;
  email: string;
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  const account = <Account sitting={sitting} current={current} email={email} isAdmin={isAdmin} />;
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="border-b-[1.5px] border-ink bg-white px-5 lg:px-6">
        <div className="mx-auto flex max-w-[var(--bar-width)] flex-wrap items-center gap-x-6 gap-y-0">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3 py-2 lg:flex-none lg:py-0">
            <Lockup width={130} className="shrink-0" />
            <div className="relative flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-dim lg:hidden">
              {account}
              <a href={`mailto:${LANDING.contactEmail}`} className="whitespace-nowrap underline underline-offset-[3px]">Help</a>
            </div>
          </div>
          <div className="flex w-full min-w-0 flex-wrap items-center gap-x-3 lg:w-auto lg:flex-1">
            <StudyTabs />
            {isAdmin && (
              <Link href="/admin/access" className="ml-4 hidden min-h-11 shrink-0 items-center font-mono text-[10px] uppercase tracking-[0.1em] text-red-pen underline underline-offset-[3px] lg:inline-flex">
                Admin
              </Link>
            )}
          </div>
          <div className="relative hidden items-center gap-4 font-mono text-[10px] uppercase tracking-[0.1em] text-dim lg:flex">
            {account}
            <a href={`mailto:${LANDING.contactEmail}`} className="whitespace-nowrap underline underline-offset-[3px]">Help</a>
          </div>
        </div>
      </header>
      {/* The paper: rules every --rule-gap, the margin rule at the sheet's offset. */}
      <main className="ruled relative flex-1 px-5 pb-8 pt-7 [container-type:inline-size] lg:px-6">
        <div className="pointer-events-none absolute inset-y-0 left-[var(--rule-offset-sm)] w-[1.5px] bg-margin lg:left-[calc(50%-var(--bar-width)/2+var(--rule-offset-lg))]" />
        <div className="relative mx-auto max-w-[var(--bar-width)]">{children}</div>
      </main>
    </div>
  );
}

const FIELD = 'mt-1 block w-full border-[1.5px] border-ink bg-paper p-2 font-sans text-base normal-case tracking-normal text-ink';

/**
 * THE ACCOUNT DISCLOSURE: Account in the bar opens to who is signed in and
 * the one thing about the account a student can change. A change is allowed
 * any time; the grant stays with the sitting it was for (ROUND_9 Task 9).
 */
function Account({ sitting, current, email, isAdmin }: { sitting: string; current: string; email: string; isAdmin: boolean }) {
  return (
    <AccountDisclosure>
      <summary className="account-toggle inline-flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-[var(--radius)] border border-transparent px-2 hover:border-rule [&::-webkit-details-marker]:hidden">
        Account<span aria-hidden="true" className="account-chevron inline-block tracking-normal">▾</span>
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-[min(20rem,calc(100vw-2.5rem))] rounded-[var(--radius)] border-[1.5px] border-ink bg-white p-4 text-left shadow-[0_12px_32px_rgba(30,36,48,0.24)] ring-4 ring-white">
        <div className="mb-3 font-semibold text-ink">Your account</div>
        <div className="break-all font-mono text-[11px] normal-case tracking-normal text-ink">{email}</div>
        <div className="mt-1">{sitting}</div>
        {isAdmin && (
          <Link href="/admin/access" className="mt-2 flex min-h-11 items-center text-red-pen underline underline-offset-[3px] lg:hidden">
            Admin
          </Link>
        )}
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
        <form action={logout} className="mt-3 border-t border-paper-deep pt-2">
          <button className="min-h-11 w-full text-left underline underline-offset-[3px]">Sign out</button>
        </form>
      </div>
    </AccountDisclosure>
  );
}
