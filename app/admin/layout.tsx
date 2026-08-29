import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/session';
import { launchWarnings } from '@/lib/preflight';
import { AdminNav, AdminTitle } from './admin-nav';
import { Lockup } from '../lockup';

// Every /admin/* route is allowlist-gated (ROUND_1 §2).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  // The operator-facing half of the launch warnings (ROUND_3 §1). It sits on
  // the layout rather than one page because whichever admin screen is open is
  // the one that should say it, and /admin/access is where the first payment
  // will be watched for. Nothing of this kind goes on the public page: a
  // test-mode notice rendered to a visitor is worse than the problem it reports.
  const warnings = launchWarnings();
  return (
    <>
      {warnings.length > 0 && (
        <div className="border-b-[1.5px] border-red-pen bg-[#FDF1F0] px-6 py-3">
          <div className="mx-auto max-w-3xl">
            <div className="font-mono text-[10px] uppercase tracking-widest text-red-pen">
              Before launch
            </div>
            <ul className="mt-1 space-y-1">
              {warnings.map((w) => (
                <li key={w} className="text-[13px] leading-snug">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {/* TWO ROWS BELOW sm, ON PURPOSE: the lockup and the page label, then
          the four routes. From sm up they are one row again.

          It was three rows, and "student app" was the whole reason — five
          items in 320px of space. It is an EXIT rather than a peer of the four
          routes, so it went to the foot of the page instead, which is where
          you look when you are done with a screen. The four stay wrapped and
          visible: hiding them behind a scroll would undo the reason the nav
          exists.

          The lockup shows at every width. A radical is an operator — alone in
          a header it reads as unfinished rather than as a logo. */}
      <div className="border-b-[1.5px] border-ink bg-white">
        <div className="mx-auto max-w-3xl px-6 sm:flex sm:items-center sm:gap-x-4">
          <div className="flex min-w-0 items-center gap-x-3 py-2 sm:py-0">
            <Lockup width={130} className="shrink-0" />
            <AdminTitle />
          </div>
          <AdminNav />
        </div>
      </div>
      {children}
      {/* THE WAY OUT, AT THE FOOT. After the content, because that is when you
          want it — and one row of chrome saved at the top of every admin
          screen. 44px like every other target (ROUND_1 §5). */}
      <div className="mx-auto max-w-3xl px-6 pb-10">
        <Link
          href="/study"
          className="inline-flex min-h-11 items-center border-t-[1.5px] border-rule pt-3 font-mono text-[11px] uppercase tracking-widest text-dim underline"
        >
          ← student app
        </Link>
      </div>
    </>
  );
}
