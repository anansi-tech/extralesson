/**
 * Three of these fail silently (ROUND_3 §1): without the payment link a landing
 * page renders and cannot be bought from, without ADMIN_EMAILS no operator can
 * be provisioned for /admin/access, without the webhook secret every delivery 400s.
 * A fourth fails loudly but wrongly: without the allowlist every payment is
 * refused as another product's (ROUND_6 Task 2).
 */
export const REQUIRED_ENV = [
  'MONGODB_URI',
  'SESSION_SECRET',
  'AI_API_KEY',
  'NEXT_PUBLIC_STRIPE_PAYMENT_LINK',
  'ADMIN_EMAILS',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PAYMENT_LINKS',
] as const;

/**
 * Read by the code, deliberately NOT required — each with the reason, because
 * "optional" without one is indistinguishable from "forgotten".
 */
export const OPTIONAL_ENV: Record<string, string> = {
  RESEND_API_KEY: 'unset falls back to logging the reset link',
  RESEND_FROM: 'defaults to the Resend sandbox sender',
  NEXT_PUBLIC_BASE_URL: 'inferred from VERCEL_URL when unset',
  BASE_URL: 'audit scripts only, never the app',
  STRIPE_LINK_SITTINGS: 'deliberately unset — a link is evidence of payment, never authority over the sitting',
  RUN_AS_STUDENT: 'the composition eval only; ignored in production',
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
 * The preflight guards absence; this guards SHAPE, because a placeholder link
 * is present, non-empty and boots clean. Deliberately narrow: a payment link
 * may one day live on a custom domain, so the buy host is NOT required.
 */
export function isPlaceholderLink(value: string | undefined): boolean {
  const v = value?.trim();
  if (!v) return false; // absence is the preflight's job, not this one
  let url: URL;
  try {
    url = new URL(v);
  } catch {
    return true;
  }
  if (url.protocol !== 'https:') return true;
  return /placeholder|example\.com|changeme|todo/i.test(v);
}

/**
 * The `test_` path segment IS the discriminator — never the word "test"
 * elsewhere in the string, the absence of "live", or a guess from the key.
 * Never fatal: it is deliberate until launch day, and previews boot production.
 */
export function isTestModeLink(value: string | undefined): boolean {
  const v = value?.trim();
  if (!v) return false;
  try {
    return new URL(v).pathname.startsWith('/test_');
  } catch {
    return false;
  }
}

/**
 * Warned twice on purpose: the /admin banner is what gets read on launch day,
 * the log line covers the redeploy where nobody opens that page. Nothing goes
 * on the public page — a test-mode notice shown to a visitor is worse.
 */
export function launchWarnings(env: Env = process.env): string[] {
  const warnings: string[] = [];
  if (isProduction(env) && isTestModeLink(env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK)) {
    warnings.push(
      'NEXT_PUBLIC_STRIPE_PAYMENT_LINK is a TEST-MODE Stripe link. Test cards only — ' +
        'a real buyer cannot pay, and no payment reaches the live account. ' +
        'Swap it to the live link before launch.',
    );
  }
  return warnings;
}

/**
 * Fatal at boot, not a banner: a banner needs someone to look, and ADMIN_EMAILS
 * missing locks them out of the page it would sit on. A refused boot keeps the
 * last good deployment serving. Outside production this reports and continues.
 */
export function preflight(env: Env = process.env): string[] {
  const missing = missingEnv(env);

  // Present but not a link is fatal for the same reason absence is: a button
  // that goes nowhere reports nothing. A placeholder is never a deliberate
  // state, which is what separates it from a test-mode link.
  if (missing.length === 0 && isProduction(env) && isPlaceholderLink(env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK)) {
    throw new Error(
      'Refusing to start: NEXT_PUBLIC_STRIPE_PAYMENT_LINK is not a usable link ' +
        `(${env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}). A button that goes nowhere looks exactly ` +
        'like one that works.',
    );
  }

  // Not fatal, and said twice: once here for the logs, once on /admin.
  for (const w of launchWarnings(env)) console.warn(`[preflight] ${w}`);

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
