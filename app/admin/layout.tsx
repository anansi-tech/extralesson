import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/session';
import { launchWarnings } from '@/lib/preflight';
import { AdminNav, AdminTitle } from './admin-nav';
import { Lockup } from '../lockup';

// Every /admin/* route is allowlist-gated (ROUND_1 §2).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  // Launch warnings are operator-facing only (ROUND_3 §1) — a test-mode notice
  // rendered to a visitor is worse than the problem it reports. On the layout so
  // that whichever admin screen is open is the one that says it.
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
      {/* Two rows below sm, on purpose: the four routes stay wrapped and
          visible, because hiding them behind a scroll would undo the reason
          the nav exists. The lockup shows at every width — a radical alone
          in a header reads as unfinished rather than as a logo. */}
      <div className="border-b-[1.5px] border-ink bg-white px-6">
        <div className="mx-auto max-w-3xl sm:flex sm:items-center sm:gap-x-4">
          <div className="flex min-w-0 items-center gap-x-3 py-2 sm:py-0">
            <Lockup width={130} className="shrink-0" />
            <AdminTitle />
          </div>
          <AdminNav />
        </div>
      </div>
      {children}
      {/* The way out sits at the foot, after the content, because that is when
          you want it — and at 44px like every other target. */}
      {/* px-6 outside the constrained box and the cap inside, as the pages do
          it: the other order insets the chrome 24px from the
          content it is meant to line up with over 768px. */}
      <div className="px-6 pb-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/study"
            className="inline-flex min-h-11 items-center border-t-[1.5px] border-rule pt-3 font-mono text-[11px] uppercase tracking-widest text-dim underline"
          >
            ← student app
          </Link>
        </div>
      </div>
    </>
  );
}
