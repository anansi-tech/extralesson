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

  // A student with access, so the notebook has somebody to be.
  await mongoose.connect(env.MONGODB_URI!);
  const { Student } = await import('@/lib/db');
  const student = await Student.create({
    email: 'smoke@extralesson.invalid',
    name: 'Smoke',
    exam_sitting: 'may-june-2027',
    target_modules: [1, 2, 3],
    password_hash: 'x',
    syllabus_mode: 'modular-2027',
    access: { sitting: 'may-june-2027', granted_at: new Date(), source: 'manual', note: 'comp · smoke check · 2026-09-10' },
  });
  cookie = createSessionToken(String(student._id), 'smoke@extralesson.invalid', SECRET, Date.now(), 1);

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

async function load(path: string, { signedIn = false } = {}): Promise<Trouble> {
  const context = await browser.newContext({ baseURL: origin });
  if (signedIn) await context.addCookies([{ name: SESSION_COOKIE, value: cookie, url: origin }]);
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
  // THE THREE SECONDS THAT MATTERED: the crash was in an interval, not a render.
  await page.waitForTimeout(SETTLE_MS);
  await context.close();
  return trouble;
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
});
