import { Lockup } from '../lockup';
import { logout } from '../study/actions';
import { AdminNav } from './admin-nav';

/**
 * THE OPERATOR'S CHROME (ROUND_10 Task 1): the student chrome's bar — lockup,
 * the five routes, who is signed in, Sign out — then the paper, with every
 * admin screen drawn in the bar's own 960 column. No page title in the bar:
 * the active tab is the title.
 */
export function AdminChrome({ email, children }: { email: string; children: React.ReactNode }) {
  const account = (
    <>
      {/* Truncated, never wrapped: a long address must not push the routes onto a second row. */}
      <span title={email} className="min-w-0 truncate normal-case tracking-normal">{email}</span>
      <form action={logout}>
        <button className="min-h-11 whitespace-nowrap underline underline-offset-[3px]">Sign out</button>
      </form>
    </>
  );
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b-[1.5px] border-ink bg-white px-5 lg:px-6">
        <div className="mx-auto flex max-w-[var(--bar-width)] flex-wrap items-center gap-x-6 gap-y-0">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3 py-2 lg:flex-none lg:py-0">
            <Lockup width={130} className="shrink-0" />
            <div className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-dim lg:hidden">{account}</div>
          </div>
          <div className="flex w-full min-w-0 items-center lg:w-auto lg:flex-1">
            <AdminNav />
          </div>
          <div className="hidden min-w-0 max-w-[360px] items-center gap-4 font-mono text-[10px] uppercase tracking-[0.1em] text-dim lg:flex">{account}</div>
        </div>
      </header>
      <main className="ruled relative px-5 pb-8 pt-7 [container-type:inline-size] lg:px-6">
        <div className="pointer-events-none absolute inset-y-0 left-[var(--rule-offset-sm)] w-[1.5px] bg-margin lg:left-[calc(50%-var(--bar-width)/2+var(--rule-offset-lg))]" />
        <div className="relative mx-auto max-w-[var(--bar-width)]">{children}</div>
      </main>
    </div>
  );
}
