import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { STUDENT_EMAIL_FIELD, paidAtOf, paymentIntentOf } from '@/lib/stripe-webhook';
import { eventIdInNote, isCompNote } from '@/lib/db/backfill-refund-references';

// ROUND_12 Task 0. A refund is created on a payment intent and measured from
// the moment Stripe confirmed payment, and it must end THIS payment's grant
// and no other. None of that is inferred: what cannot be resolved is reported.
vi.mock('@/lib/email', () => ({
  sendEmail: async () => ({ ok: true }),
  accessEmail: () => ({ subject: 's', html: 'h', text: 't' }),
  SENDER: 'ExtraLesson <x@y.test>',
}));

vi.mock('next/cache', () => ({ revalidatePath() {} }));
vi.mock('next/navigation', async (orig) => ({
  ...(await orig<typeof import('next/navigation')>()),
  redirect: (url: string) => { throw new Error(`REDIRECT ${url}`); },
}));
vi.mock('@/lib/auth/session', () => ({ requireAdmin: async () => ({ student_id: 'a', email: 'ops@example.com', role: 'admin' }) }));

const SECRET = 'whsec_refs';
const SITTING = 'may-june-2027';
let mongod: MongoMemoryReplSet;
beforeAll(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongod.getUri();
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
}, 180000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});
beforeEach(async () => {
  const { dbConnect, Payment, Student, StripeEvent } = await import('@/lib/db');
  await dbConnect();
  await Promise.all([Student.deleteMany({}), Payment.deleteMany({}), StripeEvent.deleteMany({})]);
});

const PAID_AT = 1_757_400_000; // seconds, as Stripe sends them
async function deliver(args: { event: string; session: string; email?: string; paid?: boolean; type?: string; intent?: unknown; created?: number }) {
  const { POST } = await import('@/app/api/stripe/webhook/route');
  const body = JSON.stringify({
    id: args.event,
    type: args.type ?? 'checkout.session.completed',
    created: args.created ?? PAID_AT,
    data: {
      object: {
        id: args.session,
        mode: 'payment',
        payment_status: args.paid === false ? 'unpaid' : 'paid',
        amount_total: 4900,
        currency: 'usd',
        payment_intent: args.intent ?? 'pi_test_123',
        custom_fields: [{ key: STUDENT_EMAIL_FIELD, type: 'text', text: { value: args.email ?? 'kiara@example.com' } }],
        metadata: { product: 'extralesson' },
      },
    },
  });
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac('sha256', SECRET).update(`${t}.${body}`).digest('hex');
  return POST(new Request('https://extralesson.test/api/stripe/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': `t=${t},v1=${v1}` },
    body,
  }));
}
async function makeStudent(email: string, access?: Record<string, unknown>) {
  const { Student } = await import('@/lib/db');
  return Student.create({ email, name: 'Kiara', exam_sitting: SITTING, target_modules: [1, 2, 3], password_hash: 'x', syllabus_mode: 'modular-2027', ...(access ? { access } : {}) });
}
const paymentOf = async (session: string) => {
  const { Payment } = await import('@/lib/db');
  return (await import('@/lib/db')).Payment.findOne({ session_id: session }).lean<{ _id: unknown; payment_intent_id?: string; paid_at?: Date; state: string }>().then((p) => p!) ?? Payment;
};
const accessOf = async (email: string) => {
  const { Student } = await import('@/lib/db');
  return (await Student.findOne({ email }).lean<{ access?: { payment_id?: unknown; source: string; note: string } }>())?.access ?? null;
};

describe('reading the references off a session', () => {
  it('takes the payment intent as an id or as an expanded object, and nothing else', () => {
    expect(paymentIntentOf({ payment_intent: 'pi_1' })).toBe('pi_1');
    expect(paymentIntentOf({ payment_intent: { id: 'pi_2', object: 'payment_intent' } })).toBe('pi_2');
    expect(paymentIntentOf({})).toBeNull();
    expect(paymentIntentOf({ payment_intent: '' })).toBeNull();
    expect(paymentIntentOf({ payment_intent: { object: 'payment_intent' } })).toBeNull();
  });
  it('takes the moment from the event that confirmed payment', () => {
    expect(paidAtOf({ created: PAID_AT })).toEqual(new Date(PAID_AT * 1000));
    expect(paidAtOf({})).toBeNull();
  });
});

describe('every new payment carries them', () => {
  it('a paid session records the intent and the moment, which is not when we received it', async () => {
    await makeStudent('kiara@example.com');
    await deliver({ event: 'evt_ref', session: 'cs_ref' });
    const p = await paymentOf('cs_ref');
    expect(p.payment_intent_id).toBe('pi_test_123');
    expect(p.paid_at).toEqual(new Date(PAID_AT * 1000));
  }, 60000);

  it('an unpaid session records the intent and NO moment: the money has not arrived', async () => {
    await makeStudent('kiara@example.com');
    await deliver({ event: 'evt_pend', session: 'cs_pend', paid: false });
    const pending = await paymentOf('cs_pend');
    expect(pending.state).toBe('pending');
    expect(pending.payment_intent_id).toBe('pi_test_123');
    expect(pending.paid_at ?? null).toBeNull();

    // The delayed payment succeeds days later: that event is the moment.
    const later = PAID_AT + 3 * 24 * 60 * 60;
    await deliver({ event: 'evt_pend2', session: 'cs_pend', type: 'checkout.session.async_payment_succeeded', created: later });
    const paid = await paymentOf('cs_pend');
    expect(paid.state).toBe('granted');
    expect(paid.paid_at).toEqual(new Date(later * 1000));
  }, 60000);
});

describe('every new grant names its payment', () => {
  it('a claimed grant carries the payment it was bought with', async () => {
    await makeStudent('kiara@example.com');
    await deliver({ event: 'evt_bind', session: 'cs_bind' });
    const p = await paymentOf('cs_bind');
    const access = await accessOf('kiara@example.com');
    expect(String(access!.payment_id)).toBe(String(p._id));
  }, 60000);

  it('a comp carries none', async () => {
    const { grantAccess } = await import('@/app/admin/access/actions');
    await makeStudent('comp@example.com');
    const form = new FormData();
    form.set('email', 'comp@example.com');
    form.set('sitting', SITTING);
    form.set('note', 'comp · teacher · st-marys · 2026-09-09');
    await expect(grantAccess(form)).rejects.toThrow(/REDIRECT/);
    const access = await accessOf('comp@example.com');
    expect(access!.source).toBe('manual');
    expect(access!.payment_id ?? null).toBeNull();
  }, 60000);
});

describe('the backfill resolves only what is provable', () => {
  const payment = async (over: Record<string, unknown>) => {
    const { Payment } = await import('@/lib/db');
    const { transition } = await import('@/lib/payment-state');
    return Payment.create({ received_at: new Date(), ...transition('granted'), ...over });
  };

  it('reads the event a note names, however the note says it', () => {
    expect(eventIdInNote('stripe evt_abc123')).toBe('evt_abc123');
    expect(eventIdInNote('manual · typo at checkout · evt_xyz789')).toBe('evt_xyz789');
    expect(eventIdInNote('comp · teacher · st-marys')).toBeNull();
    expect(eventIdInNote(undefined)).toBeNull();
    expect(isCompNote('comp · pilot · 3 of 8')).toBe(true);
    expect(isCompNote('friend')).toBe(false);
  });

  it('links a grant to the payment its note names, and refuses another account’s', async () => {
    const { planRefundReferences } = await import('@/lib/db/backfill-refund-references');
    const mine = await payment({ event_id: 'evt_mine', session_id: 'cs_mine', payment_intent_id: 'pi_1', paid_at: new Date() });
    const theirs = await makeStudent('theirs@example.com');
    await payment({ event_id: 'evt_theirs', session_id: 'cs_theirs', student_id: theirs._id, payment_intent_id: 'pi_2', paid_at: new Date() });
    const linked = await makeStudent('linked@example.com', { sitting: SITTING, granted_at: new Date(), source: 'stripe', note: 'stripe evt_mine' });
    const poacher = await makeStudent('poacher@example.com', { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'manual · evt_theirs' });

    const plan = await planRefundReferences();
    expect(plan.links).toContainEqual(expect.objectContaining({ studentId: String(linked._id), paymentId: String(mine._id) }));
    expect(plan.links.map((l) => l.studentId)).not.toContain(String(poacher._id));
    expect([...plan.unresolvedGrants, ...plan.unlabelledGrants]).toContainEqual(
      expect.objectContaining({ studentId: String(poacher._id), why: expect.stringContaining('matched to another account') }),
    );
  }, 60000);

  it('a paid grant it cannot resolve is not a comp, and is reported apart from one with no payments', async () => {
    const { planRefundReferences } = await import('@/lib/db/backfill-refund-references');
    const paidStudent = await makeStudent('paid@example.com', { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'friend' });
    await payment({ event_id: 'evt_p', session_id: 'cs_p', student_id: paidStudent._id, payment_intent_id: 'pi_3', paid_at: new Date() });
    const noPayments = await makeStudent('free@example.com', { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'free' });
    const comp = await makeStudent('comp2@example.com', { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'comp · pilot · 1 of 8' });

    const plan = await planRefundReferences();
    expect(plan.unresolvedGrants).toEqual([expect.objectContaining({ studentId: String(paidStudent._id), paymentsOnAccount: 1 })]);
    expect(plan.unlabelledGrants).toEqual([expect.objectContaining({ studentId: String(noPayments._id), paymentsOnAccount: 0 })]);
    expect(plan.comps).toEqual([expect.objectContaining({ studentId: String(comp._id) })]);
  }, 60000);

  it('a legacy key is an event to ask about, never a checkout session', async () => {
    const { planRefundReferences } = await import('@/lib/db/backfill-refund-references');
    await payment({ event_id: 'evt_old', session_id: 'legacy:evt_old', state: 'closed' });
    await payment({ event_id: 'evt_new', session_id: 'cs_new' });

    const plan = await planRefundReferences();
    expect(plan.gaps).toContainEqual(expect.objectContaining({ session_id: 'legacy:evt_old', kind: 'legacy-event', lookup: 'evt_old' }));
    expect(plan.gaps).toContainEqual(expect.objectContaining({ session_id: 'cs_new', kind: 'session', lookup: 'cs_new' }));
  }, 60000);

  it('asks for no moment of payment where none exists, and writes only the links', async () => {
    const { applyGrantLinks, planRefundReferences } = await import('@/lib/db/backfill-refund-references');
    const { Payment } = await import('@/lib/db');
    await payment({ event_id: 'evt_refused', session_id: 'cs_refused', state: 'refused' });
    await payment({ event_id: 'evt_pending', session_id: 'cs_pending', state: 'pending', payment_intent_id: 'pi_4' });
    const p = await payment({ event_id: 'evt_link', session_id: 'cs_link', payment_intent_id: 'pi_5', paid_at: new Date() });
    const s = await makeStudent('link@example.com', { sitting: SITTING, granted_at: new Date(), source: 'stripe', note: 'stripe evt_link' });

    const plan = await planRefundReferences();
    // A refused payment was never paid; a pending one has its intent already.
    expect(plan.gaps.find((g) => g.session_id === 'cs_refused')!.needs).toEqual(['payment_intent_id']);
    expect(plan.gaps.find((g) => g.session_id === 'cs_pending')).toBeUndefined();

    expect(await applyGrantLinks()).toEqual({ linked: 1 });
    expect(String((await accessOf('link@example.com'))!.payment_id)).toBe(String(p._id));
    // Restartable, and it invents no Stripe reference on the way.
    expect(await applyGrantLinks()).toEqual({ linked: 0 });
    expect((await Payment.findById(p._id).lean<{ payment_intent_id: string }>())!.payment_intent_id).toBe('pi_5');
    void s;
  }, 60000);
});
