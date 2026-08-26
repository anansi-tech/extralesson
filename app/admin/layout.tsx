import { requireAdmin } from '@/lib/auth/session';
import { launchWarnings } from '@/lib/preflight';

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
      {children}
    </>
  );
}
