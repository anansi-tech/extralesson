/**
 * THE VARIABLES THAT FAIL SILENTLY (ROUND_3 §1).
 *
 * Three of these break the business without breaking a page.
 * NEXT_PUBLIC_STRIPE_PAYMENT_LINK is the worst: unset, the landing page renders
 * perfectly, the button looks right, and it scrolls the reader back to the
 * paragraph they just read. No error, no log line, no way to tell from the page
 * that the product cannot be bought. ADMIN_EMAILS locks the operator out of
 * /admin/access, which is the fallback every automatic path depends on.
 * STRIPE_WEBHOOK_SECRET rejects every delivery with 400 — loudly, in a place
 * nobody is looking.
 */
export const REQUIRED_ENV = [
  'MONGODB_URI',
  'SESSION_SECRET',
  'AI_API_KEY',
  'NEXT_PUBLIC_STRIPE_PAYMENT_LINK',
  'ADMIN_EMAILS',
  'STRIPE_WEBHOOK_SECRET',
] as const;

/**
 * Read by the code, deliberately NOT required — each with the reason, because
 * "optional" without one is indistinguishable from "forgotten".
 */
export const OPTIONAL_ENV: Record<string, string> = {
  // Unset is a supported state: the reset link goes to the server log instead,
  // so local development works without a provider (CLAUDE.md).
  RESEND_API_KEY: 'unset falls back to logging the reset link',
  RESEND_FROM: 'defaults to the Resend sandbox sender',
  // Inferred from VERCEL_URL when unset; only a custom domain needs it set.
  NEXT_PUBLIC_BASE_URL: 'inferred from VERCEL_URL when unset',
  BASE_URL: 'audit scripts only, never the app',
  // DELIBERATELY UNSET. The two payment links are PRICE TIERS — $25 Founding
  // Families and $49 standard — not sittings. Both sell the same thing, so
  // which link was used says nothing about whether the student sits January or
  // May/June. The sitting falls back to the one the student picked at signup,
  // which is the better source anyway: the student knows which exam they are
  // sitting and the payment link does not. This would only be worth setting if
  // sitting-specific links ever existed.
  STRIPE_LINK_SITTINGS: 'deliberately unset — the links are price tiers, not sittings',
  // Set by the platform, not by us.
  NODE_ENV: 'set by the runtime',
  VERCEL_URL: 'set by Vercel',
  VERCEL_PROJECT_PRODUCTION_URL: 'set by Vercel',
};

/** Only string keys are read, so that is what these take — process.env fits. */
export type Env = Record<string, string | undefined>;

export function missingEnv(env: Env = process.env): string[] {
  return REQUIRED_ENV.filter((k) => !env[k]?.trim());
}

export function isProduction(env: Env = process.env): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * WHY A HARD FAILURE AT BOOT RATHER THAN A BANNER ON /admin.
 *
 * The spec offered both. A banner loses on three counts:
 *
 * 1. It cannot show the failure that most needs showing. ADMIN_EMAILS missing
 *    is exactly the case that locks the operator out of /admin — the banner
 *    would live behind the door it is warning about.
 * 2. It requires somebody to look, and the failure mode being guarded against
 *    IS that nobody looks. The page renders perfectly; that is the whole
 *    problem.
 * 3. On Vercel a boot failure keeps the previous good deployment serving. So
 *    the blast radius of failing loudly is "the new deploy does not go out",
 *    against "the new deploy is live and cannot take money". The loud failure
 *    is the smaller loss, and it is the one somebody notices within a minute.
 *
 * Outside production this reports and continues: a developer without an
 * AI_API_KEY should still be able to run the site.
 */
export function preflight(env: Env = process.env): string[] {
  const missing = missingEnv(env);
  if (missing.length === 0) return missing;

  const detail = missing.map((k) => `  - ${k}`).join('\n');
  if (isProduction(env)) {
    throw new Error(
      `Refusing to start: ${missing.length} required environment variable${
        missing.length === 1 ? '' : 's'
      } missing.\n${detail}\n` +
        'Set them in the deployment environment and redeploy. The previous deployment ' +
        'keeps serving until this one boots.',
    );
  }
  console.warn(`[preflight] ${missing.length} required variable(s) unset — fine locally, fatal in production:\n${detail}`);
  return missing;
}
