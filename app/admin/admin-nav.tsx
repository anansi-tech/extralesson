'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ONE NAV, IN THE LAYOUT.
//
// Every admin page had grown its own set of links to some of the others:
// access offered coverage and review, coverage offered review and access,
// review offered coverage alone — so there was no route to access from the
// screen a reviewer spends the evening on, and /admin/topics was reachable
// from nowhere at all. A nav that lives on one page is a nav that disagrees
// with the next one.
//
// A client component only because a server layout cannot know the pathname,
// and knowing which route is current is the whole job.
const ROUTES = [
  { href: '/admin/access', label: 'access' },
  { href: '/admin/review', label: 'review' },
  { href: '/admin/coverage', label: 'coverage' },
  { href: '/admin/topics', label: 'topics' },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1">
        {ROUTES.map((r) => {
          const current = pathname === r.href || pathname.startsWith(`${r.href}/`);
          return (
            <Link
              key={r.href}
              href={r.href}
              aria-current={current ? 'page' : undefined}
              // 44px, like every other target (ROUND_1 §5).
              className={`inline-flex min-h-11 items-center px-3 font-mono text-[11px] uppercase tracking-widest ${
                current
                  ? 'border-b-2 border-red-pen font-bold text-ink'
                  : 'border-b-2 border-transparent text-dim underline'
              }`}
            >
              {r.label}
            </Link>
          );
        })}
        {/* The way back. Deleting coverage's own link would otherwise leave
            typing the URL as the only route to the student app. */}
        <Link
          href="/study"
          className="ml-auto inline-flex min-h-11 items-center px-3 font-mono text-[11px] uppercase tracking-widest text-dim underline"
        >
          student app →
        </Link>
    </nav>
  );
}
