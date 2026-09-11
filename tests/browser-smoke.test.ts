import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { chromium, type Browser } from 'playwright-core';
import { createSessionToken } from '@/lib/auth/token';
import { SESSION_COOKIE } from '@/lib/auth/session';

/**
 * THE APP, IN A BROWSER, WITH A REAL CLIENT BUNDLE.
 *
 * Everything else here renders components to a string or measures markup in a
 * page the test built. That cannot see what the BUNDLER does, and /welcome was
 * broken by the bundler: a client component imported two constants from a module
 * that imports the database, so Mongoose went into the browser and the page died
 * three seconds in, on the first poll. It rendered correctly on the server,
 * returned 200 every time, passed 2,370 tests and type-checked clean.
 *
 * So: build it, serve it, open it, and let each page live long enough for its
 * first effect to fire. Nothing is asserted about what the pages say — the rest
 * of the suite does that. This asks only whether they survive being loaded.
 */
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
const SECRET = 'smoke-secret-not-a-real-one-0123456789';

/** Past the confirming poll's first tick at three seconds, with room to spare. */
const SETTLE_MS = 4_500;

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const probe = createServer();
    probe.on('error', reject);
    probe.listen(0, () => {
      const { port } = probe.address() as { port: number };
      probe.close(() => resolve(port));
    });
  });

let mongod: MongoMemoryReplSet;
let server: ChildProcess;
let browser: Browser;
let origin = '';
let cookie = '';
let adminCookie = '';

async function run(command: string, args: string[], env: NodeJS.ProcessEnv) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: 'pipe' });
    let output = '';
    child.stdout.on('data', (d) => (output += d));
    child.stderr.on('data', (d) => (output += d));
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} failed:\n${output.slice(-2000)}`))));
  });
}

beforeAll(async () => {
  if (!hasChrome) return;
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const port = await freePort();
  origin = `http://127.0.0.1:${port}`;

  // Everything the preflight requires, so the server boots as production does.
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'production',
    MONGODB_URI: mongod.getUri(),
    SESSION_SECRET: SECRET,
    AI_API_KEY: 'smoke',
    ADMIN_EMAILS: 'ops@extralesson.invalid',
    STRIPE_WEBHOOK_SECRET: 'whsec_smoke',
    STRIPE_SECRET_KEY: 'sk_test_smoke',
    NEXT_PUBLIC_STRIPE_PAYMENT_LINK: 'https://buy.stripe.com/test_smoke',
    NEXT_PUBLIC_BASE_URL: origin,
  };

  // A student with access, so the notebook has somebody to be, and an operator
  // so the admin screens have somebody to be.
  await mongoose.connect(env.MONGODB_URI!);
  const { Student } = await import('@/lib/db');
  const grant = (note: string) => ({ sitting: 'may-june-2027', granted_at: new Date(), source: 'manual', note });
  const make = (email: string, over: Record<string, unknown> = {}) =>
    Student.create({ email, name: 'Smoke', exam_sitting: 'may-june-2027', target_modules: [1, 2, 3], password_hash: 'x', syllabus_mode: 'modular-2027', ...over });

  const student = await make('smoke@extralesson.invalid', { access: grant('comp · smoke check · 2026-09-10') });
  cookie = createSessionToken(String(student._id), 'smoke@extralesson.invalid', SECRET, Date.now(), 1);

  const operator = await make('ops@extralesson.invalid', { role: 'admin' });
  adminCookie = createSessionToken(String(operator._id), 'ops@extralesson.invalid', SECRET, Date.now(), 1);
  // Two more changed accounts, so Access has rows to open and close.
  await make('one@extralesson.invalid', { access: grant('comp · one · 2026-09-10') });
  await make('two@extralesson.invalid', { access: grant('comp · two · 2026-09-10') });

  await run('pnpm', ['exec', 'next', 'build'], env);
  server = spawn('pnpm', ['exec', 'next', 'start', '-p', String(port)], { env, stdio: 'pipe' });
  await new Promise<void>((resolve, reject) => {
    const fail = setTimeout(() => reject(new Error('next start never became ready')), 60_000);
    const ready = (d: Buffer) => {
      if (/Ready|started server|Local:/i.test(String(d))) {
        clearTimeout(fail);
        resolve();
      }
    };
    server.stdout?.on('data', ready);
    server.stderr?.on('data', ready);
  });

  browser = await chromium.launch({ executablePath: CHROME });
}, 600_000);

afterAll(async () => {
  await browser?.close();
  server?.kill('SIGKILL');
  await mongoose.disconnect();
  await mongod?.stop();
});

interface Trouble {
  consoleErrors: string[];
  pageErrors: string[];
  failed: string[];
}

async function load(path: string, { signedIn = false, admin = false } = {}): Promise<Trouble> {
  const { page, context, trouble } = await open(path, { signedIn, admin });
  // THE THREE SECONDS THAT MATTERED: the crash was in an interval, not a render.
  await page.waitForTimeout(SETTLE_MS);
  await context.close();
  return trouble;
}

async function open(path: string, { signedIn = false, admin = false } = {}) {
  const context = await browser.newContext({ baseURL: origin });
  if (signedIn || admin) await context.addCookies([{ name: SESSION_COOKIE, value: admin ? adminCookie : cookie, url: origin }]);
  const page = await context.newPage();
  const trouble: Trouble = { consoleErrors: [], pageErrors: [], failed: [] };

  page.on('console', (m) => {
    if (m.type() === 'error') trouble.consoleErrors.push(m.text().replace(/\s+/g, ' ').slice(0, 300));
  });
  page.on('pageerror', (e) => trouble.pageErrors.push(e.message.replace(/\s+/g, ' ').slice(0, 300)));
  // A prefetch the browser abandons when the page moves on is not a failure;
  // anything else that could not be fetched is.
  page.on('requestfailed', (r) => {
    const why = r.failure()?.errorText ?? '';
    if (!why.includes('ERR_ABORTED')) trouble.failed.push(`${r.method()} ${new URL(r.url()).pathname} ${why}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) trouble.failed.push(`${r.request().method()} ${new URL(r.url()).pathname} → ${r.status()}`);
  });

  await page.goto(path, { waitUntil: 'domcontentloaded' });
  return { page, context, trouble };
}

const clean = (t: Trouble) => [...t.pageErrors.map((e) => `page error: ${e}`), ...t.consoleErrors.map((e) => `console error: ${e}`), ...t.failed.map((f) => `failed request: ${f}`)];

describe.skipIf(!hasChrome)('the app survives being loaded', () => {
  it('the landing page', async () => {
    expect(clean(await load('/'))).toEqual([]);
  }, 120_000);

  it('welcome, on a session with no payment, so the poll runs', async () => {
    // The exact shape that broke: nothing recorded for the session, so the page
    // sits on confirming and asks again every three seconds.
    expect(clean(await load('/welcome?session_id=cs_test_smoke_no_payment_recorded'))).toEqual([]);
  }, 120_000);

  it('the sign-in door', async () => {
    expect(clean(await load('/study/login'))).toEqual([]);
  }, 120_000);

  it('the notebook, signed in', async () => {
    expect(clean(await load('/study', { signedIn: true }))).toEqual([]);
  }, 120_000);

  for (const path of ['/admin/access', '/admin/review', '/admin/coverage', '/admin/topics', '/admin/disputes']) {
    it(`the operator's ${path.split('/').pop()}`, async () => {
      expect(clean(await load(path, { admin: true }))).toEqual([]);
    }, 120_000);
  }
});

/**
 * ONE ROW OPEN, IN A REAL BROWSER. The list holds a single open id, so one at a
 * time is true by construction — but "by construction" is an argument about the
 * source, and what an operator gets is a hydrated bundle. This clicks.
 */
describe.skipIf(!hasChrome)('the account list', () => {
  it('opens a row in place, and opening a second closes the first', async () => {
    const { page, context, trouble } = await open('/admin/access', { admin: true });
    const rows = page.locator('li button[aria-expanded]');
    await rows.first().waitFor();
    expect(await rows.count(), 'rows to open').toBeGreaterThanOrEqual(2);

    const openCount = () => page.locator('li button[aria-expanded="true"]').count();
    expect(await openCount(), 'closed to begin with').toBe(0);
    // A closed row holds no field at all — not a hidden one, none.
    expect(await page.locator('li input, li select, li textarea').count()).toBe(0);

    await rows.nth(0).click();
    expect(await openCount(), 'one open').toBe(1);
    expect(await rows.nth(0).getAttribute('aria-expanded')).toBe('true');
    expect(await page.locator('li input[name="reason"]').count(), 'and its control appeared').toBe(1);

    await rows.nth(1).click();
    expect(await openCount(), 'still one open').toBe(1);
    expect(await rows.nth(0).getAttribute('aria-expanded'), 'the first closed').toBe('false');
    expect(await rows.nth(1).getAttribute('aria-expanded')).toBe('true');

    await rows.nth(1).click();
    expect(await openCount(), 'clicking it again closes it').toBe(0);

    expect(clean(trouble), 'and nothing broke while doing it').toEqual([]);
    await context.close();
  }, 180_000);

  for (const width of [320, 360, 390, 1280]) {
    it(`an open row fits the viewport at ${width}px`, async () => {
      const { page, context } = await open('/admin/access', { admin: true });
      await page.setViewportSize({ width, height: 900 });
      await page.locator('li button[aria-expanded]').first().click();
      const measured = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
      await context.close();
      expect(measured).toBe(width);
    }, 180_000);
  }
});
