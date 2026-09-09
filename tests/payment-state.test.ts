import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createHmac } from 'node:crypto';
import { STUDENT_EMAIL_FIELD } from '@/lib/stripe-webhook';

// ROUND_11 Task 1, ADDITIVE: the payment carries what happened to the money,
// written beside the old fields. Nothing reads it yet, and every writer that
// changes what happened keeps both representations agreeing.
vi.mock('@/lib/email', () => ({
  sendEmail: async () => ({ ok: true }),
  accessEmail: () => ({ subject: 's', html: 'h', text: 't' }),
  SENDER: 'ExtraLesson <x@y.test>',
}));
vi.mock('next/cache', () => ({ revalidatePath() {} }));
vi.mock('@/lib/auth/session', () => ({ requireAdmin: async () => ({ student_id: 'a', email: 'ops@example.com', role: 'admin' }) }));

const SECRET = 'whsec_state_test';
let mongod: MongoMemoryServer;
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
}, 120000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});
beforeEach(async () => {
  const { dbConnect, Fulfilment, Payment, Student, StripeEvent } = await import('@/lib/db');
  await dbConnect();
  await Promise.all([Student.deleteMany({}), Payment.deleteMany({}), Fulfilment.deleteMany({}), StripeEvent.deleteMany({})]);
});

const delivery = (eventId: string, sessionId: string, email: string) => {
  const body = JSON.stringify({
    id: eventId,
    type: 'checkout.session.completed',
    data: { object: { id: sessionId, mode: 'payment', payment_status: 'paid', amount_total: 4900, currency: 'usd', custom_fields: [{ key: STUDENT_EMAIL_FIELD, type: 'text', text: { value: email } }], metadata: { product: 'extralesson' } } },
  });
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac('sha256', SECRET).update(`${t}.${body}`).digest('hex');
  return new Request('https://extralesson.test/api/stripe/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': `t=${t},v1=${v1}` },
    body,
  });
};

async function student(email: string, access?: Record<string, unknown>) {
  const { Student } = await import('@/lib/db');
  return Student.create({ email, name: 'Kiara', exam_sitting: 'may-june-2027', target_modules: [1, 2, 3], password_hash: 'x', syllabus_mode: 'modular-2027', ...(access ? { access } : {}) });
}
const stateOf = async (eventId: string) => {
  const { Payment } = await import('@/lib/db');
  return Payment.findOne({ event_id: eventId }).lean<{ session_id?: string; state?: string; state_reason?: string; state_at?: Date; closed_by?: string; resolved_at?: Date }>();
};

describe('the record', () => {
  it('keys the payment to its checkout session, uniquely over the rows that have one', async () => {
    const { Payment } = await import('@/lib/db');
    await Payment.syncIndexes();
    await Payment.create({ event_id: 'e1', session_id: 'cs_x', received_at: new Date() });
    await expect(Payment.create({ event_id: 'e2', session_id: 'cs_x', received_at: new Date() })).rejects.toThrow();
    // Rows written before R11 have no session_id, and any number of them coexist.
    await Payment.create({ event_id: 'e3', received_at: new Date() });
    await Payment.create({ event_id: 'e4', received_at: new Date() });
    expect(await Payment.countDocuments({ session_id: { $exists: false } })).toBe(2);
  }, 60000);

  it('a new payment is written waiting, with its session and the moment', async () => {
    const { POST } = await import('@/app/api/stripe/webhook/route');
    await POST(delivery('evt_w', 'cs_w', 'nobody@example.com'));
    const p = await stateOf('evt_w');
    expect(p!.session_id).toBe('cs_w');
    expect(p!.state).toBe('waiting');
    expect(p!.state_reason).toBe('no account for the paying address');
    expect(p!.state_at).toBeInstanceOf(Date);
  }, 60000);
});

describe('every writer keeps both representations', () => {
  it('a grant writes granted beside the fulfilment', async () => {
    const { Fulfilment } = await import('@/lib/db');
    await student('kiara@example.com');
    const { POST } = await import('@/app/api/stripe/webhook/route');
    await POST(delivery('evt_g', 'cs_g', 'kiara@example.com'));
    expect((await stateOf('evt_g'))!.state).toBe('granted');
    expect((await Fulfilment.findOne({ event_id: 'evt_g' }).lean<{ status: string }>())!.status).toBe('granted');
  }, 60000);

  it('a payment for a covered sitting writes duplicate, with the reason', async () => {
    await student('paid@example.com', { sitting: 'may-june-2027', granted_at: new Date(), source: 'manual', note: 'comp · pilot' });
    const { POST } = await import('@/app/api/stripe/webhook/route');
    await POST(delivery('evt_d', 'cs_d', 'paid@example.com'));
    const p = await stateOf('evt_d');
    expect(p!.state).toBe('duplicate');
    expect(p!.state_reason).toBe('already had access for may-june-2027');
  }, 60000);

  it('resolving writes closed, the reason and the operator, beside resolved_at', async () => {
    const { Payment } = await import('@/lib/db');
    const { resolvePayment } = await import('@/app/admin/access/actions');
    const p = await Payment.create({ event_id: 'evt_c', session_id: 'cs_c', received_at: new Date() });
    const form = new FormData();
    form.set('id', String(p._id));
    form.set('reason', 'refunded in Stripe');
    await resolvePayment(form);
    const after = await stateOf('evt_c');
    expect(after!.state).toBe('closed');
    expect(after!.state_reason).toBe('refunded in Stripe');
    expect(after!.closed_by).toBe('ops@example.com');
    // The old field is still written: nothing reads state yet.
    expect(after!.resolved_at).toBeInstanceOf(Date);
  }, 60000);
});

describe('additive', () => {
  it('no reader reads the new fields yet', () => {
    const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
    for (const f of [['app', 'admin', 'access', 'page.tsx'], ['app', 'welcome', 'page.tsx']]) {
      expect(at(...f), f.join('/')).not.toMatch(/\bstate_reason\b|\bstate_at\b|\bclosed_by\b|Payment\.state/);
    }
  });
});
