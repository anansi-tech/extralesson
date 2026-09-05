import Link from 'next/link';
import { Lockup } from '../lockup';
import { logout } from './actions';
import { LANDING } from '@/lib/landing-content';

/**
 * One header for every student page: the lockup, three places to be, and the
 * quiet things — sitting, who is signed in, the way out — on the right.
 */
const TABS = [
  { href: '/study', label: 'Notebook', key: 'notebook' },
  { href: '/study/history', label: 'History', key: 'history' },
  { href: '/study/progress', label: 'Progress', key: 'progress' },
] as const;

export type StudyTab = (typeof TABS)[number]['key'];

export function StudyNav({
  current,
  sitting,
  email,
  isAdmin,
}: {
  current: StudyTab | null;
  sitting: string;
  email: string;
  isAdmin: boolean;
}) {
  return (
    <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      {/* Below 400px the lockup and the links take a row each (ROUND_7 Task 2). */}
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1 max-[399px]:w-full max-[399px]:flex-col max-[399px]:items-start">
        <Lockup width={140} className="shrink-0" />
        <nav className="flex items-baseline gap-x-3 font-mono text-[11px] uppercase tracking-widest">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              aria-current={current === t.key ? 'page' : undefined}
              className={`inline-flex min-h-11 items-center ${current === t.key ? 'border-b-2 border-red-pen font-bold text-ink' : 'text-dim underline'}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-end gap-x-3 gap-y-1">
        {isAdmin && (
          <Link href="/admin/access" className="shrink-0 whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-red-pen underline">
            Admin
          </Link>
        )}
        {/* ACCOUNT AND HELP (ROUND_7 Task 2): one compact disclosure — who is
            signed in, which sitting, where help is, and the way out. */}
        <details className="relative shrink-0">
          <summary className="min-h-11 cursor-pointer list-none font-mono text-[10px] uppercase tracking-widest text-dim underline">Account</summary>
          <div className="absolute right-0 z-10 mt-1 w-[min(20rem,calc(100vw-2rem))] border-[1.5px] border-ink bg-white p-3 text-[12px] shadow-[3px_3px_0_var(--ink)]">
            <div className="break-all font-mono text-[11px]">{email}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-dim">{sitting}</div>
            <div className="mt-2 text-dim">
              Help: <a href={`mailto:${LANDING.contactEmail}`} className="underline">{LANDING.contactEmail}</a>
            </div>
            <form action={logout} className="mt-2">
              <button className="min-h-11 w-full border-[1.5px] border-ink bg-paper font-mono text-[11px] uppercase tracking-widest">Sign out</button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}

export const sittingTag = (mode: string) => (mode === 'legacy-jan' ? 'CSEC MATH · JAN RE-SIT' : 'CSEC MATH · MAY/JUNE 2027');
