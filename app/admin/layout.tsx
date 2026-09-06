import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/session';
import { launchWarnings } from '@/lib/preflight';
import { AdminChrome } from './admin-chrome';

// Every /admin/* route is allowlist-gated (ROUND_1 §2).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  // Launch warnings are operator-facing only (ROUND_3 §1) — a test-mode notice
  // rendered to a visitor is worse than the problem it reports. On the layout so
  // that whichever admin screen is open is the one that says it.
  const warnings = launchWarnings();
  return (
    <AdminChrome email={session.email}>
      {warnings.length > 0 && (
        <div className="mb-6 border-l-3 border-red-pen bg-[#FDF1F0] px-3 py-2.5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-red-pen">Before launch</div>
          <ul className="mt-1 space-y-1">
            {warnings.map((w) => (
              <li key={w} className="text-[13px] leading-snug">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
      {children}
      {/* The way out sits at the foot, after the content, because that is when
          you want it — and at 44px like every other target. */}
      <div className="mt-10">
        <Link
          href="/study"
          className="inline-flex min-h-11 items-center border-t-[1.5px] border-rule pt-3 font-mono text-[11px] uppercase tracking-widest text-dim underline"
        >
          ← student app
        </Link>
      </div>
    </AdminChrome>
  );
}
