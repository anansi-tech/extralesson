import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/session';
import { launchWarnings } from '@/lib/preflight';
import { AdminChrome } from './admin-chrome';
import { Refusal } from '../refusal';

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
        <Refusal
          id="before-launch"
          amber
          bare
          className="mb-6"
          label="Before launch"
          // A LIST CANNOT LIVE IN A PARAGRAPH. Refusal renders its sentence
          // inside a <p>, so a <ul> here was invalid HTML: the browser closed
          // the paragraph and moved the list out, the DOM stopped matching what
          // React rendered, and hydration failed on EVERY admin page whenever
          // the banner was showing — which in production, on a test-mode link,
          // is always. Found by the browser smoke check (ROUND_13 gate).
          sentence={warnings.map((w) => (
            <span key={w} className="block [&+&]:mt-1">
              {w}
            </span>
          ))}
        />
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
