import { requireAdmin } from '@/lib/auth/session';

// Every /admin/* route is allowlist-gated (ROUND_1 §2).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
