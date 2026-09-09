import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PAYMENT_STATE_CUTOVER } from '@/lib/cutover';

// ROUND_11 Task 4. One list from one record. A replica set, because granting
// from the queue runs the claim, and the claim is a transaction.
vi.mock('@/lib/email', () => ({
  sendEmail: async () => ({ ok: true }),
  accessEmail: () => ({ subject: 's', html: 'h', text: 't' }),
  SENDER: 'ExtraLesson <x@y.test>',
}));
vi.mock('next/cache', () => ({ revalidatePath() {} }));
const redirects: string[] = [];
vi.mock('next/navigation', async (orig) => ({
  ...(await orig<typeof import('next/navigation')>()),
  redirect: (url: string) => { redirects.push(url); throw new Error(`REDIRECT ${url}`); },
}));
vi.mock('@/lib/auth/session', () => ({ requireAdmin: async () => ({ student_id: 'a', email: 'ops@example.com', role: 'admin' }) }));

let mongod: MongoMemoryReplSet;
beforeAll(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongod.getUri();
}, 180000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});
beforeEach(async () => {
  const { dbConnect, Fulfilment, Payment, Student } = await import('@/lib/db');
  await dbConnect();
  await Promise.all([Student.deleteMany({}), Payment.deleteMany({}), Fulfilment.deleteMany({})]);
  redirects.length = 0;
});

const SITTING = 'may-june-2027';
async function student(email: string, access?: Record<string, unknown>) {
  const { Student } = await import('@/lib/db');
  return Student.create({ email, name: 'Kiara', exam_sitting: SITTING, target_modules: [1, 2, 3], password_hash: 'x', syllabus_mode: 'modular-2027', ...(access ? { access } : {}) });
}
async function payment(state: string, over: Record<string, unknown> = {}) {
  const { Fulfilment, Payment } = await import('@/lib/db');
  const { transition } = await import('@/lib/payment-state');
  const id = String(over.session_id ?? `cs_${state}_${Math.random().toString(36).slice(2, 8)}`);
  const p = await Payment.create({
    event_id: `evt_${id}`,
    session_id: id,
    email: 'payer@example.com',
    amount_total: 4900,
    currency: 'usd',
    received_at: new Date(),
    ...transition(state as 'waiting'),
    ...over,
  });
  await Fulfilment.create({ session_id: id, event_id: `evt_${id}`, payment_id: p._id, status: 'pending', ts: new Date() });
  return p;
}
const stateOf = async (id: unknown) => {
  const { Payment } = await import('@/lib/db');
  return (await Payment.findById(id).lean<{ state: string; state_reason?: string; closed_by?: string; state_at?: Date; resolved_at?: Date }>())!;
};
const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

describe('the list', () => {
  it('holds waiting and duplicate only, oldest first, once each', async () => {
    const { loadQueue } = await import('@/lib/payment-queue');
    const old = await payment('waiting', { session_id: 'cs_old', received_at: new Date('2026-09-01T00:00:00Z') });
    const dup = await payment('duplicate', { session_id: 'cs_dup', received_at: new Date('2026-09-02T00:00:00Z') });
    await payment('granted', { session_id: 'cs_granted' });
    await payment('closed', { session_id: 'cs_closed' });
    await payment('refused', { session_id: 'cs_refused' });
    await payment('pending', { session_id: 'cs_pending' });

    const rows = await loadQueue();
    expect(rows.map((r) => r.id)).toEqual([String(old._id), String(dup._id)]);
    expect(rows.map((r) => r.state)).toEqual(['waiting', 'duplicate']);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
  }, 60000);

  it('a row says its state, the address or missing/invalid, the amount and the currency', async () => {
    const { loadQueue } = await import('@/lib/payment-queue');
    const { PaymentQueue } = await import('@/app/admin/access/payment-queue');
    await payment('waiting', { session_id: 'cs_named', email: 'kiara@example.com', amount_total: 4900, currency: 'usd' });
    await payment('waiting', { session_id: 'cs_nameless', email: undefined, state_reason: 'no valid student email on the session' });
    const html = renderToStaticMarkup(createElement(PaymentQueue, { rows: await loadQueue() }));

    expect(html).toContain('kiara@example.com');
    expect(html).toContain('missing/invalid');
    expect(html).toContain('49.00 USD');
    expect(html).toContain('no valid student email on the session');
    // One counter, and nothing that navigates away from the work.
    expect(html).toContain('Payments that need you');
    expect(html).not.toContain('<a ');
  }, 60000);

  it('gives waiting an address and a grant, duplicate a refund close, and both a required reason', async () => {
    const { loadQueue } = await import('@/lib/payment-queue');
    const { PaymentQueue } = await import('@/app/admin/access/payment-queue');
    await payment('waiting', { session_id: 'cs_w' });
    await payment('duplicate', { session_id: 'cs_d' });
    const html = renderToStaticMarkup(createElement(PaymentQueue, { rows: await loadQueue() }));

    expect(html).toContain('Grant to this account');
    expect(html).toContain('Close (refunded)');
    expect(html).toContain('closing it here moves no money');
    // Both rows demand a reason: a payment closed without one is a payment nobody can explain later.
    expect((html.match(/<input required="" minLength="3"[^>]*name="reason"/g) ?? []).length).toBe(2);
    // The grant control belongs to waiting alone.
    expect((html.match(/name="email"/g) ?? []).length).toBe(1);
  }, 60000);
});

describe('closing', () => {
  it('records the reason, the operator and the time, and takes the row off the list', async () => {
    const { closePayment } = await import('@/app/admin/access/actions');
    const { loadQueue } = await import('@/lib/payment-queue');
    const p = await payment('waiting', { session_id: 'cs_close' });
    await expect(closePayment(form({ id: String(p._id), reason: 'refunded in Stripe' }))).rejects.toThrow(/REDIRECT/);

    const after = await stateOf(p._id);
    expect(after.state).toBe('closed');
    expect(after.state_reason).toBe('refunded in Stripe');
    expect(after.closed_by).toBe('ops@example.com');
    expect(after.state_at).toBeInstanceOf(Date);
    expect(await loadQueue()).toHaveLength(0);
  }, 60000);

  it('closes a duplicate too, and refuses a payment that is neither', async () => {
    const { closePayment } = await import('@/app/admin/access/actions');
    const dup = await payment('duplicate', { session_id: 'cs_cd' });
    await expect(closePayment(form({ id: String(dup._id), reason: 'refunded' }))).rejects.toThrow(/REDIRECT/);
    expect((await stateOf(dup._id)).state).toBe('closed');

    const granted = await payment('granted', { session_id: 'cs_cg' });
    redirects.length = 0;
    await expect(closePayment(form({ id: String(granted._id), reason: 'stale form' }))).rejects.toThrow(/REDIRECT/);
    expect(redirects[0]).toContain('stale=1');
    expect((await stateOf(granted._id)).state).toBe('granted');
  }, 60000);

  it('a stale form cannot close a payment granted since it was rendered', async () => {
    const { closePayment, grantQueued } = await import('@/app/admin/access/actions');
    const s = await student('kiara@example.com');
    const p = await payment('waiting', { session_id: 'cs_race_close' });
    // The operator's page was rendered while it was waiting; the grant happened first.
    await expect(grantQueued(form({ id: String(p._id), email: 'kiara@example.com' }))).rejects.toThrow(/REDIRECT/);
    redirects.length = 0;
    await expect(closePayment(form({ id: String(p._id), reason: 'thought it was a test' }))).rejects.toThrow(/REDIRECT/);

    expect(redirects[0]).toContain('stale=1');
    expect((await stateOf(p._id)).state).toBe('granted');
    const { Student } = await import('@/lib/db');
    expect((await Student.findById(s._id).lean<{ access?: unknown }>())!.access).toBeTruthy();
  }, 60000);

  it('a reason is required: nothing is written without one', async () => {
    const { closePayment } = await import('@/app/admin/access/actions');
    const p = await payment('waiting', { session_id: 'cs_noreason' });
    await expect(closePayment(form({ id: String(p._id), reason: 'no' }))).rejects.toThrow(/REDIRECT/);
    expect(redirects[0]).toContain('noreason=1');
    expect((await stateOf(p._id)).state).toBe('waiting');
  }, 60000);
});

describe('granting from the queue', () => {
  it('grants, and the row leaves the list', async () => {
    const { grantQueued } = await import('@/app/admin/access/actions');
    const { loadQueue } = await import('@/lib/payment-queue');
    await student('kiara@example.com');
    const p = await payment('waiting', { session_id: 'cs_grant' });
    await expect(grantQueued(form({ id: String(p._id), email: 'kiara@example.com' }))).rejects.toThrow(/REDIRECT/);

    expect(redirects[0]).toContain('granted=kiara%40example.com');
    expect((await stateOf(p._id)).state).toBe('granted');
    expect(await loadQueue()).toHaveLength(0);
  }, 60000);

  it('an account whose sitting is already covered moves the row to duplicate, and it stays', async () => {
    const { grantQueued } = await import('@/app/admin/access/actions');
    const { loadQueue } = await import('@/lib/payment-queue');
    const first = { sitting: SITTING, granted_at: new Date('2026-09-01T00:00:00Z'), source: 'manual', note: 'comp · pilot' };
    const s = await student('covered@example.com', first);
    const p = await payment('waiting', { session_id: 'cs_cover' });
    await expect(grantQueued(form({ id: String(p._id), email: 'covered@example.com' }))).rejects.toThrow(/REDIRECT/);

    expect(redirects[0]).toContain('duplicate=covered%40example.com');
    expect((await stateOf(p._id)).state).toBe('duplicate');
    expect((await loadQueue()).map((r) => r.id)).toEqual([String(p._id)]);
    const { Student } = await import('@/lib/db');
    expect((await Student.findById(s._id).lean<{ access: { note: string; granted_at: Date } }>())!.access).toEqual(expect.objectContaining(first));
  }, 60000);

  it('an address with no account grants nothing and leaves the row waiting', async () => {
    const { grantQueued } = await import('@/app/admin/access/actions');
    const p = await payment('waiting', { session_id: 'cs_noacct' });
    await expect(grantQueued(form({ id: String(p._id), email: 'nobody@example.com' }))).rejects.toThrow(/REDIRECT/);
    expect(redirects[0]).toContain('ungranted=nobody%40example.com');
    expect((await stateOf(p._id)).state).toBe('waiting');
  }, 60000);

  it('a failed grant keeps the row and its reason; the retry that works removes it', async () => {
    const { grantQueued } = await import('@/app/admin/access/actions');
    const { loadQueue } = await import('@/lib/payment-queue');
    const { Student } = await import('@/lib/db');
    await student('retry@example.com');
    const p = await payment('waiting', { session_id: 'cs_retry', state_reason: 'no account for the paying address' });

    const spy = vi.spyOn(Student, 'updateOne').mockImplementation((() => { throw new Error('the grant threw'); }) as typeof Student.updateOne);
    await expect(grantQueued(form({ id: String(p._id), email: 'retry@example.com' }))).rejects.toThrow(/the grant threw/);
    spy.mockRestore();

    const stillThere = await loadQueue();
    expect(stillThere.map((r) => r.id)).toEqual([String(p._id)]);
    expect(stillThere[0].state_reason).toBe('no account for the paying address');

    await expect(grantQueued(form({ id: String(p._id), email: 'retry@example.com' }))).rejects.toThrow(/REDIRECT/);
    expect(await loadQueue()).toHaveLength(0);
  }, 60000);
});

describe('/welcome reads the payment', () => {
  it('names the account the payment reached, not the address that paid', async () => {
    const { resolveWelcome } = await import('@/lib/welcome');
    const { Payment } = await import('@/lib/db');
    // The payer typed the address wrong; an operator granted the real account.
    const s = await student('kiara@example.com');
    const p = await payment('waiting', { session_id: 'cs_typo', email: 'kiara@exampel.test' });
    const { grantQueued } = await import('@/app/admin/access/actions');
    await expect(grantQueued(form({ id: String(p._id), email: 'kiara@example.com' }))).rejects.toThrow(/REDIRECT/);

    expect(await Payment.findById(p._id).lean<{ email: string }>().then((r) => r!.email)).toBe('kiara@exampel.test');
    expect(await resolveWelcome('cs_typo', { student_id: String(s._id) })).toEqual({
      state: 'payer', email: 'kiara@example.com', sitting: 'May/June 2027', studentId: String(s._id),
    });
    expect(await resolveWelcome('cs_typo', null)).toEqual({ state: 'other', email: 'kiara@example.com', sitting: 'May/June 2027' });
  }, 60000);

  it('keeps asking while a payment waits, and stops on one that is closed or not ours', async () => {
    const { resolveWelcome } = await import('@/lib/welcome');
    await student('waiting@example.com');
    await payment('waiting', { session_id: 'cs_wait', email: 'waiting@example.com' });
    expect(await resolveWelcome('cs_wait', null)).toEqual({ state: 'confirming', settled: false });

    await payment('waiting', { session_id: 'cs_unknown_addr', email: 'nobody@example.com' });
    expect(await resolveWelcome('cs_unknown_addr', null)).toEqual({ state: 'unregistered', email: 'nobody@example.com' });

    for (const state of ['closed', 'refused'] as const) {
      await payment(state, { session_id: `cs_${state}_w` });
      expect(await resolveWelcome(`cs_${state}_w`, null), state).toEqual({ state: 'confirming', settled: true });
    }
    expect(await resolveWelcome('cs_nothing_here', null)).toEqual({ state: 'confirming', settled: false });
  }, 60000);

  it('reads no fulfilment at all', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    expect(readFileSync(join(process.cwd(), 'lib', 'welcome.ts'), 'utf8')).not.toMatch(/Fulfilment/);
  });
});

describe('the switch', () => {
  it('is off: the legacy readers still stand until the cutover is verified', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    expect(PAYMENT_STATE_CUTOVER).toBe(false);
    const page = readFileSync(join(process.cwd(), 'app', 'admin', 'access', 'page.tsx'), 'utf8');
    expect(page).toContain('{PAYMENT_STATE_CUTOVER && <PaymentQueue rows={queue} />}');
    for (const legacy of ['needing.length > 0', 'unmatched.length > 0', 'refused.length > 0']) {
      expect(page).toContain(`{!PAYMENT_STATE_CUTOVER && ${legacy} && (`);
    }
  });
});
