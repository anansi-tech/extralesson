'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/study', label: 'Notebook' },
  { href: '/study/history', label: 'History' },
  { href: '/study/progress', label: 'Progress' },
] as const;

/** Three places to be; the active one carries the red-pen underline (system sheet). */
export function StudyTabs() {
  const path = usePathname();
  const active = (href: string) => (href === '/study' ? path === '/study' : path.startsWith(href));
  return (
    <nav className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em]">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={active(t.href) ? 'page' : undefined}
          className={`inline-flex min-h-11 items-center border-b-2 px-3 ${active(t.href) ? 'border-red-pen font-bold text-ink' : 'border-transparent text-dim underline underline-offset-[3px]'}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
