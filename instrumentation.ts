/**
 * Next.js calls register() once when a server instance starts. It is the only
 * hook that runs before the first request, which is what "at boot" has to mean
 * in a serverless deployment (ROUND_3 §1).
 */
export async function register(): Promise<void> {
  const { preflight } = await import('@/lib/preflight');
  preflight();
}
