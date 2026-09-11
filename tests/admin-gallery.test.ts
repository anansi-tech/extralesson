import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { chromium, type Browser } from 'playwright-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { bodyPage } from './helpers/chrome-page';
import { checkRules, reportOn } from './helpers/gallery-rules';

/**
 * EVERY OPERATOR SCREEN, UNDER THE SAME RULES (ROUND_13 gate). The five admin
 * screens were designed this round and had never been measured: not at a width,
 * not against the rules every student screen passes. They are rendered as the
 * real pages against a real database, not as fixtures, so what is checked is
 * what an operator gets.
 */
vi.mock('@/lib/auth/session', () => ({ requireAdmin: async () => ({ student_id: 'a', email: 'ops@example.com', role: 'admin' }) }));
vi.mock('next/cache', () => ({ revalidatePath() {} }));
vi.mock('next/navigation', async (orig) => ({
  ...(await orig<typeof import('next/navigation')>()),
  useRouter: () => ({ replace() {}, refresh() {}, push() {} }),
  usePathname: () => '/admin/review',
}));

const WIDTHS = [320, 360, 390, 1280];
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);

/** The refusals an admin screen can show, and what each must not offer beside it. */
const REFUSES: Record<string, RegExp> = {
  'before-launch': /(?!)/,
  'queue-empty': /Approve|Edit|Reject/,
  'no-disputes': /Reply by email|Mark as reviewed/,
};
const BLOCKS: Record<string, RegExp> = { 'before-launch': /(?!)/, 'queue-empty': /./, 'no-disputes': /./ };

let mongod: MongoMemoryReplSet;
let browser: Browser;
const shots: { screen: string; state: string; page: string }[] = [];

beforeAll(async () => {
  if (!hasChrome) return;
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongod.getUri();
  process.env.STRIPE_SECRET_KEY = 'sk_test_gallery';
  browser = await chromium.launch({ executablePath: CHROME });

  const { dbConnect, Student, Payment, Question, Topic } = await import('@/lib/db');
  const { transition } = await import('@/lib/payment-state');
  await dbConnect();

  const S = 'may-june-2027';
  const account = (email: string, access?: Record<string, unknown>) =>
    Student.create({ email, name: 'Kiara Bishop', exam_sitting: S, target_modules: [1, 2, 3], password_hash: 'x', syllabus_mode: 'modular-2027', ...(access ? { access } : {}) });

  // THE THREE CONTROL VARIANTS, one account each: a paid grant, a comp, and a
  // paid grant whose payment cannot be found.
  const paid = await Payment.create({ event_id: 'evt_g1', session_id: 'cs_g1', payment_intent_id: 'pi_g1', amount_total: 4900, currency: 'usd', paid_at: new Date(), received_at: new Date(), ...transition('granted') });
  const payer = await account('paid@example.com', { sitting: S, granted_at: new Date(), source: 'stripe', note: 'stripe evt_g1', payment_id: paid._id });
  await Payment.updateOne({ _id: paid._id }, { $set: { student_id: payer._id } });
  await account('comp@example.com', { sitting: S, granted_at: new Date(), source: 'manual', note: 'comp · teacher at st-marys · 2026-09-10 · was jan-2027 stripe: stripe evt_old' });
  const lost = await account('lost@example.com', { sitting: S, granted_at: new Date(), source: 'manual', note: 'friend' });
  await Payment.create({ event_id: 'evt_g2', session_id: 'cs_g2', payment_intent_id: 'pi_g2', amount_total: 4900, currency: 'usd', paid_at: new Date(), received_at: new Date(), student_id: lost._id, ...transition('granted') });
  // A payment that needs somebody, so the queue is not empty in one shot.
  await Payment.create({ event_id: 'evt_g3', session_id: 'cs_g3', amount_total: 4900, currency: 'usd', email: 'waiting@example.com', received_at: new Date(), ...transition('waiting') });

  await Question.collection.insertOne({
    kind: 'mcq', stem: 'A shirt marked $80 is sold at a 15% discount. What is the selling price?', marks: 1, difficulty: 1, module: 1,
    objective_ids: ['M1.2.1'], options: ['$65.00', '$68.00', '$72.00', '$92.00'], answer_key: 1, profile: 'CK',
    worked_solution: '15% of $80 is $12.', misconceptions: [], status: 'draft',
    gen_meta: { model: 'm', prompt_version: 'v1', verified: true, ts: new Date() },
  } as never);
  await Topic.create({ module: 1, code: 'M1-CA', title: 'Consumer arithmetic', order: 1, objectives: [{ id: 'M1.2.1', text: 'calculate discount' }] });

  const page = async (mod: string, params: Record<string, string> = {}) => {
    const { default: Page } = await import(mod);
    return bodyPage(renderToStaticMarkup(await Page({ searchParams: Promise.resolve(params) })));
  };
  shots.push(
    { screen: 'access', state: 'changed-list', page: await page('@/app/admin/access/page') },
    { screen: 'access', state: 'searched', page: await page('@/app/admin/access/page', { find: 'example.com' }) },
    { screen: 'access', state: 'all-accounts', page: await page('@/app/admin/access/page', { show: 'all' }) },
    { screen: 'review', state: 'a-draft', page: await page('@/app/admin/review/page') },
    { screen: 'coverage', state: 'seeded', page: await page('@/app/admin/coverage/page') },
    { screen: 'disputes', state: 'none-yet', page: await page('@/app/admin/disputes/page') },
  );
  const { default: TopicsPage } = await import('@/app/admin/topics/page');
  shots.push({ screen: 'topics', state: 'seeded', page: bodyPage(renderToStaticMarkup(await TopicsPage())) });
}, 300_000);

afterAll(async () => {
  await browser?.close();
  await mongoose.disconnect();
  await mongod?.stop();
});

describe.skipIf(!hasChrome)('every operator screen, one set of rules', () => {
  for (const width of WIDTHS) {
    it(`all five screens at ${width}px`, async () => {
      expect(shots.length, 'every screen was rendered').toBe(7);
      expect(new Set(shots.map((s) => s.screen)), 'all five').toEqual(new Set(['access', 'review', 'coverage', 'disputes', 'topics']));

      for (const shot of shots) {
        const name = `${shot.screen}--${shot.state}--${width}`;
        const p = await browser.newPage({ viewport: { width, height: 900 } });
        await p.setContent(shot.page, { waitUntil: 'networkidle' });
        const report = await reportOn(p, width);
        await p.close();
        // At most one red: admin primaries are ink-filled, and the one
        // irreversible act on Access sits behind a disclosure.
        checkRules(report, name, { refuses: REFUSES, blocks: BLOCKS, primaries: 'at-most-one' }, expect);
      }
    }, 300_000);
  }

  it('a closed account row holds no form field, and the page never says history', async () => {
    const access = shots.find((s) => s.screen === 'access' && s.state === 'changed-list')!.page;
    const rows = access.slice(access.indexOf('Changed in the last'), access.indexOf('Grant access to an address'));
    expect(rows).not.toMatch(/<input|<select|<textarea/);
    expect(access.replace(/<[^>]+>/g, ' ')).not.toMatch(/\bhistor(y|ies)\b/i);
  });

  it('every coverage chip links to Review filtered to its objective', async () => {
    const coverage = shots.find((s) => s.screen === 'coverage')!.page;
    const chips = [...coverage.matchAll(/href="\/admin\/review\?find=objective%3A([A-Z0-9.]+)"/g)].map((m) => m[1]);
    expect(chips, 'the seeded objective is a link').toContain('M1.2.1');
    // No chip is drawn as anything but a link.
    expect(coverage).not.toMatch(/<span[^>]*title="M1\.2\.1/);
  });
});

// The gate's remaining confirmations, in one place so each is a named result
// rather than something believed to be true elsewhere.
describe('the gate’s confirmations', () => {
  const walk = (dir: string, out: string[] = []): string[] => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full, out);
      else if (/\.tsx?$/.test(entry)) out.push(full);
    }
    return out;
  };

  it('no literal colour anywhere under app/admin', () => {
    const offenders = walk(join(process.cwd(), 'app', 'admin')).filter((f) => /\[#[0-9A-Fa-f]{3,8}\]|#[0-9A-Fa-f]{6}\b/.test(readFileSync(f, 'utf8')));
    expect(offenders.map((f) => f.replace(process.cwd() + '/', ''))).toEqual([]);
  });

  it('Previous access open shows one line per prior grant, with no date', async () => {
    const { priorGrantsOf } = await import('@/lib/admin/account-view');
    const prior = priorGrantsOf({ sitting: 'may-june-2027', granted_at: new Date(), source: 'manual', note: 'comp · x · 2026-09-10 · was jan-2027 stripe: stripe evt_old' } as never);

    expect(prior).toHaveLength(1);
    expect(prior[0]).toEqual({ sitting: 'jan-2027', source: 'stripe', note: 'stripe evt_old' });
    expect(JSON.stringify(prior), 'no date shown and none inferred').not.toMatch(/\d{4}-\d{2}-\d{2}/);
    // One line per prior, in the same label column as Current access.
    const rows = readFileSync(join(process.cwd(), 'app', 'admin', 'access', 'account-rows.tsx'), 'utf8');
    expect(rows).toMatch(/row\.prior\.map\(/);
    expect(rows).toMatch(/Previous access \{row\.prior\.length \? `· \$\{row\.prior\.length\}` : '· none'\}/);
  });
});
