import { Lockup } from './lockup';
import { logout } from './study/actions';

/**
 * A DOOR INTO THE NOTEBOOK (ROUND_9): the white bar with the lockup — and
 * Sign out when someone is signed in — over the paper, with one 576px card
 * on it. Auth and Welcome.dc.html §03 and §04 share it.
 */
export function Door({ signedIn, children }: { signedIn: boolean; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b-[1.5px] border-ink bg-white px-5 lg:px-6">
        <div className="mx-auto flex max-w-[var(--bar-width)] items-center justify-between gap-3 py-2 lg:gap-6">
          <Lockup width={130} className="shrink-0 lg:hidden" />
          <Lockup width={140} className="hidden shrink-0 lg:block" />
          {signedIn && (
            <form action={logout}>
              <button className="min-h-11 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.1em] text-dim underline underline-offset-[3px]">Sign out</button>
            </form>
          )}
        </div>
      </header>
      <main className="ruled relative px-5 pb-10 pt-8 lg:px-6 lg:pb-20 lg:pt-16">
        <div className="pointer-events-none absolute inset-y-0 left-[var(--rule-offset-sm)] w-[1.5px] bg-margin lg:left-[calc(50%-var(--bar-width)/2+var(--rule-offset-lg))]" />
        <div className="relative mx-auto max-w-[var(--bar-width)]">
          <div className="max-w-[var(--col)] border-[1.5px] border-ink bg-white px-5 py-6 shadow-[var(--shadow-card)] lg:p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
