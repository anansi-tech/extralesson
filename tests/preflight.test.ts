import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  REQUIRED_ENV,
  OPTIONAL_ENV,
  missingEnv,
  preflight,
  isProduction,
  isPlaceholderLink,
  isTestModeLink,
  launchWarnings,
  type Env,
} from '@/lib/preflight';

// The payment link gets a plausible value rather than "set": it is the one
// required variable whose SHAPE is checked, so a nonsense fixture would trip
// the placeholder guard and hide what each test is actually asserting.
const full = (): Env => ({
  ...Object.fromEntries(REQUIRED_ENV.map((k) => [k, 'set'])),
  NEXT_PUBLIC_STRIPE_PAYMENT_LINK: 'https://buy.stripe.com/14A3cx0IRfZ05sW7n04c806',
});

describe('missingEnv', () => {
  it('reports nothing when every required variable is set', () => {
    expect(missingEnv(full())).toEqual([]);
  });

  it('reports each absent variable, and treats whitespace as absent', () => {
    expect(missingEnv({ ...full(), ADMIN_EMAILS: undefined })).toEqual(['ADMIN_EMAILS']);
    // A variable set to "" or " " in a dashboard is the same failure as unset,
    // and it is the easier one to do by accident.
    expect(missingEnv({ ...full(), SESSION_SECRET: '   ' })).toEqual(['SESSION_SECRET']);
  });

  it('reports every missing one at once, not the first', () => {
    // Fixing them one deploy at a time is three failed deploys.
    const env = { ...full(), MONGODB_URI: undefined, AI_API_KEY: undefined };
    expect(missingEnv(env)).toEqual(['MONGODB_URI', 'AI_API_KEY']);
  });
});

describe('preflight refuses to boot production, and only production', () => {
  it('throws in production, naming what is missing', () => {
    const env = {
      ...full(),
      NODE_ENV: 'production',
      NEXT_PUBLIC_STRIPE_PAYMENT_LINK: undefined,
    };
    expect(() => preflight(env)).toThrow(/NEXT_PUBLIC_STRIPE_PAYMENT_LINK/);
    expect(() => preflight(env)).toThrow(/Refusing to start/);
  });

  it('warns and continues outside production', () => {
    const env = { ...full(), NODE_ENV: 'development', AI_API_KEY: undefined };
    expect(preflight(env)).toEqual(['AI_API_KEY']);
  });

  it('says nothing at all when the environment is complete', () => {
    expect(preflight({ ...full(), NODE_ENV: 'production' })).toEqual([]);
  });

  it('reads production from NODE_ENV', () => {
    expect(isProduction({ NODE_ENV: 'production' })).toBe(true);
    expect(isProduction({ NODE_ENV: 'development' })).toBe(false);
  });
});

// THE LIST MUST BE THE LIST THE CODE ACTUALLY READS (ROUND_3 §1).
//
// The failure this prevents: someone adds process.env.SOMETHING_NEW, ships it,
// and the preflight passes because nobody remembered to add it here. The check
// therefore reads the tree rather than trusting the constant.
describe('the required list cannot drift from what the code reads', () => {
  const read = new Set(
    execSync(`grep -rhoE 'process\\.env\\.[A-Z_0-9]+' app lib scripts instrumentation.ts || true`, {
      cwd: process.cwd(),
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean)
      .map((s) => s.replace('process.env.', '')),
  );

  it('finds every variable the code reads either required or explained as optional', () => {
    const unaccounted = [...read].filter(
      (k) => !(REQUIRED_ENV as readonly string[]).includes(k) && !(k in OPTIONAL_ENV),
    );
    expect(unaccounted, `add to REQUIRED_ENV or explain in OPTIONAL_ENV: ${unaccounted.join(', ')}`)
      .toEqual([]);
  });

  it('requires nothing the code does not read', () => {
    for (const k of REQUIRED_ENV) expect(read.has(k), `${k} is required but never read`).toBe(true);
  });

  it('gives every optional variable a reason, so none is optional by accident', () => {
    for (const [k, why] of Object.entries(OPTIONAL_ENV)) {
      expect(why.length, `${k} needs a reason`).toBeGreaterThan(10);
    }
  });
});

// .env.example is the only documentation an operator reads before deploying.
describe('.env.example matches the code', () => {
  const example = readFileSync(join(process.cwd(), '.env.example'), 'utf8');
  const documented = new Set(
    (example.match(/^[A-Z_0-9]+=/gm) ?? []).map((l) => l.replace('=', '')),
  );

  it('documents every required variable', () => {
    for (const k of REQUIRED_ENV) expect(documented.has(k), `${k} missing from .env.example`).toBe(true);
  });

  it('documents the optional ones the operator sets, not the ones the platform sets', () => {
    const operatorSet = ['RESEND_API_KEY', 'RESEND_FROM', 'NEXT_PUBLIC_BASE_URL'];
    for (const k of operatorSet) expect(documented.has(k), `${k} missing from .env.example`).toBe(true);
    for (const k of ['NODE_ENV', 'VERCEL_URL', 'VERCEL_PROJECT_PRODUCTION_URL']) {
      expect(documented.has(k), `${k} is the platform's, not ours to document`).toBe(false);
    }
  });
});

// PRESENT AND STILL USELESS (ROUND_3 §1, reopened once).
//
// The preflight guards absence. A placeholder link is present, non-empty, boots
// clean, and is the dead-CTA-that-looks-alive the item exists to prevent — it
// sat in a .env for weeks and was found by reading the file, not by any check.
describe('isPlaceholderLink', () => {
  it('rejects the value that was actually in .env', () => {
    expect(isPlaceholderLink('https://buy.stripe.com/placeholder')).toBe(true);
  });

  it('rejects anything that is not an https URL', () => {
    for (const v of ['not-a-url', 'buy.stripe.com/abc', 'http://buy.stripe.com/abc', 'TODO']) {
      expect(isPlaceholderLink(v), v).toBe(true);
    }
  });

  it('accepts a real link, live or test', () => {
    expect(isPlaceholderLink('https://buy.stripe.com/14A3cx0IRfZ05sW7n04c806')).toBe(false);
    expect(isPlaceholderLink('https://buy.stripe.com/test_14A3cx0IRfZ05sW7n04c806')).toBe(false);
  });

  it('does not require the buy.stripe.com host, which may one day be a custom domain', () => {
    expect(isPlaceholderLink('https://pay.extralesson.app/abc123')).toBe(false);
  });

  it('leaves absence to the preflight rather than double-reporting it', () => {
    expect(isPlaceholderLink(undefined)).toBe(false);
    expect(isPlaceholderLink('  ')).toBe(false);
  });
});

// THE DISCRIMINATOR IS THE `test_` PATH SEGMENT, and these tests exist to stop
// it being "improved" into something fuzzier.
describe('isTestModeLink', () => {
  it('keys on the test_ segment', () => {
    expect(isTestModeLink('https://buy.stripe.com/test_14A3cx0IRfZ05sW7n04c806')).toBe(true);
    expect(isTestModeLink('https://buy.stripe.com/14A3cx0IRfZ05sW7n04c806')).toBe(false);
  });

  it('does not match the word "test" elsewhere in a live link', () => {
    // A live id containing those letters is not a test link, and a fuzzier
    // check would call it one.
    expect(isTestModeLink('https://buy.stripe.com/1testABC')).toBe(false);
    expect(isTestModeLink('https://buy.stripe.com/abc?ref=test_1')).toBe(false);
    expect(isTestModeLink('https://test.example.com/abc')).toBe(false);
  });
});

describe('launch warnings are the non-fatal half', () => {
  const withLink = (link: string, nodeEnv = 'production'): Env => ({
    ...full(),
    NODE_ENV: nodeEnv,
    NEXT_PUBLIC_STRIPE_PAYMENT_LINK: link,
  });

  it('warns about a test-mode link in production without stopping the boot', () => {
    const env = withLink('https://buy.stripe.com/test_abc');
    expect(() => preflight(env)).not.toThrow();
    expect(launchWarnings(env)[0]).toMatch(/TEST-MODE/);
  });

  it('says nothing about a live link', () => {
    expect(launchWarnings(withLink('https://buy.stripe.com/abc'))).toEqual([]);
  });

  it('says nothing outside production, where a test link is simply correct', () => {
    expect(launchWarnings(withLink('https://buy.stripe.com/test_abc', 'development'))).toEqual([]);
  });

  it('REFUSES to boot production on a placeholder, which is never deliberate', () => {
    expect(() => preflight(withLink('https://buy.stripe.com/placeholder'))).toThrow(
      /not a usable link/,
    );
  });

  it('boots locally on a placeholder — a developer does not need a Stripe link', () => {
    expect(() => preflight(withLink('https://buy.stripe.com/placeholder', 'development'))).not.toThrow();
  });
});
