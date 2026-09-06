'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// One nav, in the chrome: a nav that lives on one page is a nav that disagrees
// with the next one. A client component only because a server layout cannot
// know the pathname, and knowing which route is current is the whole job.
const ROUTES = [
  { href: '/admin/access', label: 'Access' },
  { href: '/admin/review', label: 'Review' },
  { href: '/admin/coverage', label: 'Coverage' },
  { href: '/admin/topics', label: 'Topics' },
  { href: '/admin/disputes', label: 'Disputes' },
] as const;

const currentRoute = (pathname: string) =>
  ROUTES.find((r) => pathname === r.href || pathname.startsWith(`${r.href}/`));

/** Five places to be; the active one carries the red-pen underline, as the student tabs do. */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em] lg:flex-nowrap">
      {ROUTES.map((r) => {
        const current = r === currentRoute(pathname);
        return (
          <Link
            key={r.href}
            href={r.href}
            aria-current={current ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center border-b-2 px-3 ${current ? 'border-red-pen font-bold text-ink' : 'border-transparent text-dim underline underline-offset-[3px]'}`}
          >
            {r.label}
          </Link>
        );
      })}
    </nav>
  );
}
