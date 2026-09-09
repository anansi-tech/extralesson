import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { renderToStaticMarkup } from 'react-dom/server';

// A PAYMENT WHOSE ADDRESS HAS NO ACCOUNT says so. Left pending it read as a
// webhook that had not finished, and /admin/access told an operator to go
// looking in Stripe for a session that was paid and fine.
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

let mongod: MongoMemoryServer;
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
}, 120000);
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

const HOUR = 60 * 60 * 1000;

/** A payment nobody has an account for, and the record the webhook opened for it. */
async function unmatchedPayment(eventId: string, ts = new Date()) {
  const { Fulfilment, Payment } = await import('@/lib/db');
  const payment = await Payment.create({ event_id: eventId, email: `payer-${eventId}@example.com`, received_at: ts });
  const fulfilment = await Fulfilment.create({ session_id: `cs_${eventId}`, event_id: eventId, payment_id: payment._id, status: 'pending', ts });
  return { payment, fulfilment };
}

async function student(email: string) {
  const { Student } = await import('@/lib/db');
  return Student.create({ email, name: 'Kiara', exam_sitting: 'may-june-2027', target_modules: [1, 2, 3], password_hash: 'x', syllabus_mode: 'modular-2027' });
}

const statusOf = async (eventId: string) => {
  const { Fulfilment } = await import('@/lib/db');
  return Fulfilment.findOne({ event_id: eventId }).lean<{ status: string; reason?: string }>();
};

describe('the webhook says an address has no account', () => {
  it('marks the fulfilment unmatched rather than leaving it pending', async () => {
    const { POST } = await import('@/app/api/stripe/webhook/route');
    const { createHmac } = await import('node:crypto');
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_unmatched_test';
    const body = JSON.stringify({
      id: 'evt_nobody',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_nobody', payment_status: 'paid', amount_total: 4900, currency: 'usd', customer_details: { email: 'nobody@example.com' }, mode: 'payment', metadata: { product: 'extralesson' } } },
    });
    const t = Math.floor(Date.now() / 1000);
    const v1 = createHmac('sha256', 'whsec_unmatched_test').update(`${t}.${body}`).digest('hex');
    const res = await POST(new Request('https://extralesson.test/api/stripe/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'stripe-signature': `t=${t},v1=${v1}` },
      body,
    }));

    expect(await res.json()).toEqual({ matched: false });
    const f = await statusOf('evt_nobody');
    expect(f!.status).toBe('unmatched');
    expect(f!.reason).toBe('no account for the paying address');
  }, 60000);
});

describe('closing a payment closes the record it opened', () => {
  it('resolving marks the fulfilment resolved, with the reason', async () => {
    const { resolvePayment } = await import('@/app/admin/access/actions');
    const { payment } = await unmatchedPayment('evt_resolve');
    const form = new FormData();
    form.set('id', String(payment._id));
    form.set('reason', 'refunded in Stripe, test payment');
    await resolvePayment(form);
    const f = await statusOf('evt_resolve');
    expect(f!.status).toBe('resolved');
    expect(f!.reason).toBe('refunded in Stripe, test payment');
  }, 60000);

  it('giving it an account grants through the webhook’s own path and closes it', async () => {
    const { matchPayment } = await import('@/app/admin/access/actions');
    const { Payment, Student } = await import('@/lib/db');
    const { payment } = await unmatchedPayment('evt_match');
    const s = await student('kiara@example.com');
    const form = new FormData();
    form.set('id', String(payment._id));
    form.set('email', 'kiara@example.com');
    await expect(matchPayment(form)).rejects.toThrow(/REDIRECT/);

    const after = await Student.findById(s._id).lean<{ access: { sitting: string; source: string; note: string } }>();
    expect(after!.access.sitting).toBe('may-june-2027');
    expect(after!.access.source).toBe('stripe');
    expect(after!.access.note).toContain('evt_match');
    expect((await statusOf('evt_match'))!.status).toBe('granted');
    // Attached, so it leaves the unmatched list too.
    const paid = await Payment.findById(payment._id).lean<{ student_id: unknown }>();
    expect(String(paid!.student_id)).toBe(String(s._id));
    expect(redirects[0]).toContain('granted=kiara%40example.com');
  }, 60000);

  it('an address with no account grants nothing and says so', async () => {
    const { matchPayment } = await import('@/app/admin/access/actions');
    const { payment } = await unmatchedPayment('evt_nomatch');
    const form = new FormData();
    form.set('id', String(payment._id));
    form.set('email', 'nobody@example.com');
    await expect(matchPayment(form)).rejects.toThrow(/REDIRECT/);
    expect(redirects[0]).toContain('ungranted=nobody%40example.com');
    expect((await statusOf('evt_nomatch'))!.status).toBe('pending');
  }, 60000);
});

describe('the backfill', () => {
  it('marks the stale rows whose payment matched nobody, and leaves genuine stale pending alone', async () => {
    const { backfillUnmatchedFulfilments } = await import('@/lib/db/backfill-unmatched-fulfilments');
    const { Payment } = await import('@/lib/db');
    const old = new Date(Date.now() - 2 * HOUR);
    await unmatchedPayment('evt_old_a', old);
    await unmatchedPayment('evt_old_b', old);
    // A stale pending whose payment DID match an account: the webhook stopped mid-flight.
    const { payment: matched } = await unmatchedPayment('evt_stale_matched', old);
    const s = await student('stale@example.com');
    await Payment.updateOne({ _id: matched._id }, { $set: { student_id: s._id } });
    // And one only minutes old, which may still be in flight.
    await unmatchedPayment('evt_fresh');

    expect(await backfillUnmatchedFulfilments()).toEqual({ marked: 2 });
    expect((await statusOf('evt_old_a'))!.status).toBe('unmatched');
    expect((await statusOf('evt_old_b'))!.status).toBe('unmatched');
    expect((await statusOf('evt_stale_matched'))!.status).toBe('pending');
    expect((await statusOf('evt_fresh'))!.status).toBe('pending');
    // Running it again changes nothing.
    expect(await backfillUnmatchedFulfilments()).toEqual({ marked: 0 });
  }, 60000);
});

describe('/admin/access on an unmatched payment', () => {
  it('names it, sends the operator to the payment rather than to Stripe', async () => {
    const { Fulfilment } = await import('@/lib/db');
    const { payment } = await unmatchedPayment('evt_screen', new Date(Date.now() - 2 * HOUR));
    await Fulfilment.updateOne({ event_id: 'evt_screen' }, { $set: { status: 'unmatched', reason: 'no account for the paying address' } });
    const { default: AccessPage } = await import('@/app/admin/access/page');
    const html = renderToStaticMarkup(await AccessPage({ searchParams: Promise.resolve({}) }));

    expect(html).toContain('no account for the paying address');
    expect(html).toContain(`href="#payment-${String(payment._id)}"`);
    expect(html).toContain(`id="payment-${String(payment._id)}"`);
    // The Stripe-resend advice belongs to a failed grant and a genuine stale pending.
    const row = html.slice(html.indexOf('no account for the paying address'), html.indexOf('payments-unmatched'));
    expect(row).not.toContain('resend the event');
  }, 60000);
});
