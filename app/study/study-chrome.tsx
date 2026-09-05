import { Lockup } from '../lockup';
import { logout } from './actions';
import { LANDING } from '@/lib/landing-content';
import { StudyTabs } from './study-tabs';

/**
 * THE NOTEBOOK'S CHROME (ROUND_8 Task 0): the white bar above the paper —
 * lockup, three tabs, sitting, Help, Sign out — two rows at 390 and one at
 * 1280, then the paper with the sheet's rule geometry. Every student page
 * renders inside it; the page draws only what is on the paper.
 */
export function StudyChrome({ sitting, children }: { sitting: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b-[1.5px] border-ink bg-white px-5 lg:px-6">
        <div className="mx-auto flex max-w-[var(--bar-width)] flex-wrap items-center gap-x-6 gap-y-0">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3 py-2 lg:flex-none lg:py-0">
            <Lockup width={130} className="shrink-0" />
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-dim lg:hidden">
              <span className="text-right">{sitting}</span>
              <a href={`mailto:${LANDING.contactEmail}`} className="whitespace-nowrap underline underline-offset-[3px]">Help</a>
              <form action={logout}>
                <button className="min-h-11 whitespace-nowrap underline underline-offset-[3px]">Sign out</button>
              </form>
            </div>
          </div>
          <div className="flex w-full min-w-0 items-center lg:w-auto lg:flex-1">
            <StudyTabs />
          </div>
          <div className="hidden items-center gap-4 font-mono text-[10px] uppercase tracking-[0.1em] text-dim lg:flex">
            <span>{sitting}</span>
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

export const sittingTag = (mode: string) => (mode === 'legacy-jan' ? 'Jan 2027 re-sit' : 'May/June 2027');
