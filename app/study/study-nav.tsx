import Link from 'next/link';
import { Lockup } from '../lockup';
import { logout } from './actions';

/**
 * One header for every student page: the lockup, two places to be, and the
 * quiet things — sitting, who is signed in, the way out — on the right.
 */
const TABS = [
  { href: '/study', label: 'Notebook', key: 'notebook' },
  { href: '/study/history', label: 'History', key: 'history' },
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
      <div className="flex min-w-0 items-baseline gap-x-4">
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
        <span className="hidden shrink-0 whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-dim sm:inline">{sitting}</span>
        {/* Which account is signed in matters on a shared phone; below sm the header needs the room back. */}
        <span title={email} className="hidden min-w-[14ch] max-w-full truncate font-mono text-[10px] tracking-widest text-dim sm:inline">
          {email}
        </span>
        <form action={logout} className="shrink-0">
          <button className="whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-dim underline">Sign out</button>
        </form>
      </div>
    </header>
  );
}

export const sittingTag = (mode: string) => (mode === 'legacy-jan' ? 'CSEC MATH · JAN RE-SIT' : 'CSEC MATH · MAY/JUNE 2027');
