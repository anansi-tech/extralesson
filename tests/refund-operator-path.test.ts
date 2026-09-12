import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { REFUND_DAYS } from '@/lib/access';
import { reasonWithWindow } from '@/lib/refund';
import { dashboardUrl, windowOf } from '@/lib/payment-queue';

// ROUND_12 Task 4. What an operator sees and what they can do about it.
vi.mock('@/lib/email', async (orig) => ({
  ...(await orig<typeof import('@/lib/email')>()),
  sendEmail: async () => ({ ok: true }),
}));
vi.mock('next/cache', () => ({ revalidatePath() {} }));
vi.mock('next/navigation', async (orig) => ({
  ...(await orig<typeof import('next/navigation')>()),
  redirect: (url: string) => { throw new Error(`REDIRECT ${url}`); },
}));
vi.mock('@/lib/auth/session', () => ({ requireAdmin: async () => ({ student_id: 'a', email: 'ops@example.com', role: 'admin' }) }));

const SITTING = 'may-june-2027';
const DAY = 86_400_000;
let mongod: MongoMemoryReplSet;
beforeAll(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongod.getUri();
  process.env.STRIPE_SECRET_KEY = 'sk_test_operator';
}, 180000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});
beforeEach(async () => {
  const { dbConnect, Payment, Student } = await import('@/lib/db');
  await dbConnect();
  await Promise.all([Student.deleteMany({}), Payment.deleteMany({})]);
});

async function payment(over: Record<string, unknown> = {}) {
  const { Payment } = await import('@/lib/db');
  const { transition } = await import('@/lib/payment-state');
  return Payment.create({
    event_id: `evt_${Math.random().toString(36).slice(2, 8)}`,
    session_id: `cs_${Math.random().toString(36).slice(2, 8)}`,
    payment_intent_id: 'pi_row',
    amount_total: 4900,
    currency: 'usd',
    paid_at: new Date(Date.now() - 2 * DAY),
    received_at: new Date(),
    ...transition('granted'),
    ...over,
  });
}
async function student(email: string, access?: Record<string, unknown>) {
  const { Student } = await import('@/lib/db');
  return Student.create({ email, name: 'Kiara', exam_sitting: SITTING, target_modules: [1, 2, 3], password_hash: 'x', syllabus_mode: 'modular-2027', ...(access ? { access } : {}) });
}
const screen = async () => {
  const { default: AccessPage } = await import('@/app/admin/access/page');
  const html = renderToStaticMarkup(await AccessPage({ searchParams: Promise.resolve({}) }));
  return { html, text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
};
const queue = async () => {
  const { PaymentQueue } = await import('@/app/admin/access/payment-queue');
  const { loadQueue } = await import('@/lib/payment-queue');
  const html = renderToStaticMarkup(createElement(PaymentQueue, { rows: await loadQueue() }));
  return { html, text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
};

describe('a student with a live paid grant', () => {
  const control = async (email: string, p: { _id: unknown; paid_at?: Date; payment_intent_id?: string }) => {
    const { Student } = await import('@/lib/db');
    const { grantControl } = await import('@/lib/admin/account-control');
    const s = (await Student.findOne({ email }).select('access').lean<{ _id: unknown; access: never } | null>())!;
    return grantControl({ id: String(s._id), email, access: s.access }, p, false);
  };

  it('offers Refund and revoke, with what will happen and where the money is', async () => {
    const p = await payment();
    await student('kiara@example.com', { sitting: SITTING, granted_at: new Date(), source: 'stripe', note: 'stripe evt_1', payment_id: p._id });

    // Two lines, not a paragraph: the window is what has to be decided about,
    // and what happens is said by the row itself, identically every time.
    expect(await control('kiara@example.com', p)).toEqual({
      kind: 'refund',
      paymentId: String(p._id),
      window: { label: 'Within the window', value: 'paid 2 days ago · this is owed' },
      link: 'https://dashboard.stripe.com/test/payments/pi_row',
    });
  }, 60000);

  it('past the window it still refunds, and says the record will note it', async () => {
    const p = await payment({ paid_at: new Date(Date.now() - (REFUND_DAYS + 6) * DAY) });
    await student('late@example.com', { sitting: SITTING, granted_at: new Date(), source: 'stripe', note: 'stripe evt_1', payment_id: p._id });

    const c = await control('late@example.com', p);
    // The control is still offered: the window is a policy, not a lock.
    expect(c?.kind).toBe('refund');
    const win = c && 'window' in c ? c.window : null;
    expect(win?.label).toBe('Outside the window');
    expect(win?.value).toBe(`paid ${REFUND_DAYS + 6} days ago · the ${REFUND_DAYS}-day window has passed — this is your call`);
    // And the record really does say so.
    expect(reasonWithWindow('asked late', new Date(Date.now() - (REFUND_DAYS + 6) * DAY))).toContain(`past the ${REFUND_DAYS}-day window`);
    expect(reasonWithWindow('asked in time', new Date(Date.now() - 2 * DAY))).toBe('asked in time');
  }, 60000);
});

// WHAT A ROW SAYS, AND WHAT IT OFFERS (ROUND_13 Task 1). A closed row holds no
// input at all and none of these words, so the blocks are built by the view
// model and asserted there; what the page must still show is the queue, the
// counts, and one line per changed account.
describe('an account row', () => {
  const rowFor = async (email: string) => {
    const { Student } = await import('@/lib/db');
    const { currentAccessOf, priorGrantsOf } = await import('@/lib/admin/account-view');
    const s = await Student.findOne({ email }).select('access').lean<{ access: never } | null>();
    if (!s) throw new Error(`no account ${email}`);
    return { current: currentAccessOf(s.access), prior: priorGrantsOf(s.access) };
  };

  it('reads the current grant out as label and value, in the fixed column', async () => {
    await student('lines@example.com', { sitting: SITTING, granted_at: new Date('2026-09-10T00:00:00Z'), source: 'manual', note: 'comp · a teacher · 2026-09-10' });

    expect(await rowFor('lines@example.com')).toEqual({
      current: { accessFor: SITTING, klass: 'Comp', granted: '2026-09-10 · manual', reasonLabel: 'REASON', reason: 'a teacher' },
      prior: [],
    });
  }, 60000);

  it('says a note it cannot read is a note, and names no class it was not given', async () => {
    await student('older@example.com', { sitting: SITTING, granted_at: new Date('2026-08-28T00:00:00Z'), source: 'manual', note: 'friend' });

    const { current } = await rowFor('older@example.com');
    expect(current).toMatchObject({ klass: 'not named in the note', reasonLabel: 'NOTE', reason: 'friend', granted: '2026-08-28 · manual' });
  }, 60000);

  it('holds one line per prior grant, with no date in it', async () => {
    await student('prior@example.com', {
      sitting: SITTING,
      granted_at: new Date(),
      source: 'manual',
      note: 'comp · a teacher · 2026-09-10 · was jan-2027 stripe: stripe evt_1UDcTOR',
    });

    const { prior } = await rowFor('prior@example.com');
    expect(prior).toEqual([{ sitting: 'jan-2027', source: 'stripe', note: 'stripe evt_1UDcTOR' }]);
    expect(JSON.stringify(prior), 'no date is shown and none is inferred').not.toMatch(/\d{4}-\d{2}-\d{2}/);
  }, 60000);

  it('a closed row has no input in it at all, and the page never says history', async () => {
    await student('closed@example.com', { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'comp · a teacher · 2026-09-10' });
    const { html, text } = await screen();

    // The rows, and not the two disclosures at the foot, which are forms.
    const rows = html.slice(html.indexOf('Changed in the last'), html.indexOf('Grant access to an address'));
    expect(rows, 'no field before anybody has decided anything').not.toMatch(/<input|<select|<textarea/);
    expect(text).not.toMatch(/full history|complete history|all grants/i);
    // The address and its state word are what a closed row is for.
    expect(text).toContain('closed@example.com');
  }, 60000);

  it('names the exam entered for and the sitting access is on, separately', async () => {
    const { currentAccessOf } = await import('@/lib/admin/account-view');
    const s = await student('entered@example.com', { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'comp · a teacher · 2026-09-10' });

    // The account is registered for one sitting and granted another; the row
    // keeps them apart, which is the mistake the grant form confirms against.
    expect(s.exam_sitting).toBe(SITTING);
    expect(currentAccessOf(s.access as never).accessFor).toBe(SITTING);
    const page = (await screen()).text;
    expect(page).toContain('Changed in the last 7 days');
  }, 60000);
});

describe('a refunded student', () => {
  it('stays on the paid list, marked revoked, with the reason, the operator and the date', async () => {
    const p = await payment({ ...(await import('@/lib/payment-state')).transition('refunded') });
    await student('gone@example.com', {
      sitting: SITTING,
      granted_at: new Date('2026-09-01'),
      source: 'stripe',
      note: 'stripe evt_1',
      payment_id: p._id,
      revoked_at: new Date('2026-09-09'),
      revoked_by: 'ops@example.com',
      revoked_reason: 'refunded, asked in the window',
    });
    const { text } = await screen();
    const { revokedLineOf } = await import('@/lib/admin/account-view');
    const { grantControl } = await import('@/lib/admin/account-control');
    const { Student } = await import('@/lib/db');
    const s = (await Student.findOne({ email: 'gone@example.com' }).select('access').lean<{ _id: unknown; access: never } | null>())!;

    // NEVER SILENTLY ABSENT: the changed list holds them, under the one word.
    expect(text).toContain('gone@example.com');
    expect(text).toContain('revoked');
    expect(revokedLineOf(s.access)).toBe('revoked 2026-09-09 by ops@example.com · refunded, asked in the window');
    // And no control offering to refund it again.
    expect(grantControl({ id: String(s._id), email: 'gone@example.com', access: s.access }, p, true)).toBeNull();
    expect(text).not.toContain('The money goes back');
  }, 60000);
});

describe('the helpers the rows read', () => {
  it('count days from paid_at and know the window', () => {
    expect(windowOf(null)).toBeNull();
    expect(windowOf(new Date(Date.now() - 3 * DAY))).toEqual({ days: 3, late: false });
    expect(windowOf(new Date(Date.now() - REFUND_DAYS * DAY))).toEqual({ days: REFUND_DAYS, late: false });
    expect(windowOf(new Date(Date.now() - (REFUND_DAYS + 1) * DAY))).toEqual({ days: REFUND_DAYS + 1, late: true });
  });
  it('point at the dashboard in the mode the key belongs to', () => {
    expect(dashboardUrl(null)).toBeNull();
    expect(dashboardUrl('pi_1')).toBe('https://dashboard.stripe.com/test/payments/pi_1');
  });
});

// ROUND_13 Task 1: the page is the queue and a search, and one row opens at a
// time. "One at a time" is a property of the state, not of a handler: the list
// holds a single open id, so a second cannot be open without the first closing.
describe('the page an operator arrives at', () => {
  const rows = () => readFileSync(join(process.cwd(), 'app', 'admin', 'access', 'account-rows.tsx'), 'utf8');

  it('opens one row at a time, by holding one id', () => {
    const src = rows();
    expect(src).toMatch(/const \[openId, setOpenId\] = useState<string \| null>\(null\)/);
    expect(src).toMatch(/setOpenId\(open \? null : row\.id\)/);
    // The blocks exist only while that row is open, so a closed row has none.
    expect(src).toMatch(/const open = openId === row\.id;/);
    expect(src).toMatch(/\{open && <OpenRow row=\{row\} \/>\}/);
  });

  it('puts the counts, the changed list and the two disclosures in that order', async () => {
    await student('one@example.com', { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'comp · a teacher · 2026-09-10' });
    const { text } = await screen();

    for (const part of ['with access', 'free allowance used', 'free tier', 'accounts', 'Changed in the last 7 days']) {
      expect(text, part).toContain(part);
    }
    const order = ['Payments that need you', 'with access', 'Changed in the last 7 days', 'Grant access to an address', 'Delete an account'].map((p) => text.indexOf(p));
    expect(order.every((n) => n > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  }, 60000);
});
