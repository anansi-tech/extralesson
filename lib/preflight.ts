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
  // DELIBERATELY UNSET, and it would not change the granted sitting if it were
  // set. The two payment links are PRICE TIERS — $25 Founding Families and $49
  // standard — not sittings, so which link was used says nothing about which
  // exam the student sits. The sitting granted is ALWAYS the one the student
  // registered for; a mapped link is evidence, and a disagreement is written
  // into the grant note for /admin/access rather than resolved quietly.
  STRIPE_LINK_SITTINGS: 'deliberately unset — links are price tiers; evidence only, never authority',
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
/**
 * A VALUE THAT IS PRESENT AND STILL USELESS.
 *
 * The preflight guards absence. These two guard shape, because
 * "https://buy.stripe.com/placeholder" is present, non-empty, boots clean and
 * is exactly the dead CTA that looks alive §1 exists to prevent — it sat in a
 * .env for weeks and was only found by reading the file.
 *
 * Deliberately narrow. A Stripe payment link may one day be served from a
 * custom domain, so this does NOT require the buy.stripe.com host; it rejects
 * what cannot be a link at all, and what says it is a stand-in.
 */
export function isPlaceholderLink(value: string | undefined): boolean {
  const v = value?.trim();
  if (!v) return false; // absence is the preflight's job, not this one
  let url: URL;
  try {
    url = new URL(v);
  } catch {
    return true; // not a URL at all
  }
  if (url.protocol !== 'https:') return true;
  return /placeholder|example\.com|changeme|todo/i.test(v);
}

/**
 * TEST MODE, BY SHAPE — and the shape is the `test_` path segment.
 *
 * A Stripe test payment link is https://buy.stripe.com/test_… . That segment IS
 * the discriminator: not the word "test" anywhere in the string, not the
 * absence of "live", not a guess from the key. Written down so nobody later
 * "improves" this into something fuzzier that starts matching a live link whose
 * id happens to contain those letters.
 *
 * A test link takes test cards only, so in production it means no real buyer
 * can pay. It is NOT fatal: it is a deliberate state right up until launch day,
 * and Vercel preview deployments run with NODE_ENV=production too, so failing
 * on it would block the very testing it protects.
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
 * What the operator should be told without the boot being stopped.
 *
 * Returned for the banner on /admin and logged once at boot. Two halves of the
 * same warning on purpose: the banner is where it will be read on launch day,
 * and the log line covers the 11pm redeploy where nobody opens that page — one
 * greppable line, after the fact, costing nothing.
 *
 * Nothing goes on the public page. A test-mode notice rendered to a visitor is
 * worse than the problem it reports.
 */
export function launchWarnings(env: Env = process.env): string[] {
  const warnings: string[] = [];
  if (isProduction(env) && isTestModeLink(env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK)) {
    warnings.push(
      'NEXT_PUBLIC_STRIPE_PAYMENT_LINK is a TEST-MODE Stripe link. Test cards only — ' +
        'a real buyer cannot pay, and the hundred-place cap on the page is the test link\'s, ' +
        'not the live one\'s. Swap it to the live link before launch.',
    );
  }
  return warnings;
}

export function preflight(env: Env = process.env): string[] {
  const missing = missingEnv(env);

  // Present but not a link. Fatal for the same reason absence is: it renders a
  // button that goes nowhere and reports nothing. A placeholder is never a
  // deliberate state, which is what separates it from a test-mode link below.
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
