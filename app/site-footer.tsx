import Link from 'next/link';
import { Lockup, LOCKUP_MIN_PX } from './lockup';
import { LANDING } from '@/lib/landing-content';

const LINK = 'inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink underline underline-offset-[3px]';

/** The foot of every page, Landing.dc.html §02: the mark, four links, who makes it, and who does not. */
export function SiteFooter() {
  return (
    <footer className="border-t-[1.5px] border-ink bg-white px-5 py-5 font-mono text-[11px] text-dim lg:px-6 lg:py-6">
      <div className="mx-auto max-w-[var(--bar-width)] lg:flex lg:flex-wrap lg:items-center lg:justify-between lg:gap-6">
        <div>
          <Lockup width={LOCKUP_MIN_PX} />
          <nav className="mt-1 flex flex-wrap gap-x-5 lg:gap-x-6">
            <a href={`mailto:${LANDING.contactEmail}`} className={LINK}>Help</a>
            <Link href="/refunds" className={LINK}>Refunds</Link>
            <Link href="/privacy" className={LINK}>Privacy</Link>
            <Link href="/terms" className={LINK}>Terms</Link>
          </nav>
        </div>
        <div className="mt-1.5 border-t border-paper-deep pt-3 leading-[1.9] tracking-[0.04em] lg:mt-0 lg:border-0 lg:pt-0 lg:text-right">
          <div>An Anansi Technology product · Plantation, Florida</div>
          <div className="max-w-[44ch] lg:max-w-none">ExtraLesson is not affiliated with or endorsed by the Caribbean Examinations Council</div>
        </div>
      </div>
    </footer>
  );
}
