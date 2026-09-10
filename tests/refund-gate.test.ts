import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { REFUND_DAYS } from '@/lib/access';
import { refundStatusChange, type RefundAttempt } from '@/lib/refund-state';
import { STUDENT_EMAIL_FIELD } from '@/lib/stripe-webhook';

// ROUND_12 — THE GATE. Twenty-two cases, against a replica set and a stubbed
// Stripe, because the completion is a transaction and the refund is a call.
const sent: { to: string; text: string }[] = [];
vi.mock('@/lib/email', async (orig) => ({
  ...(await orig<typeof import('@/lib/email')>()),
  sendEmail: async (m: { to: string; text: string }) => { sent.push(m); return { ok: true }; },
}));
vi.mock('next/cache', () => ({ revalidatePath() {} }));
let VIEWER = 'nobody';
vi.mock('next/navigation', async (orig) => ({
  ...(await orig<typeof import('next/navigation')>()),
  redirect: (url: string) => { throw new Error(`REDIRECT ${url}`); },
  usePathname: () => '/study',
  useRouter: () => ({ refresh() {}, push() {} }),
}));
vi.mock('@/lib/auth/session', () => ({
  requireAdmin: async () => ({ student_id: 'a', email: 'ops@example.com', role: 'admin' }),
  requireSession: async () => ({ student_id: VIEWER, email: 'kiara@example.com', role: 'student' }),
}));

const SITTING = 'may-june-2027';
const DAY = 86_400_000;
const OPERATOR = { email: 'ops@example.com' };
const SECRET = 'whsec_gate12';
let mongod: MongoMemoryReplSet;
beforeAll(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongod.getUri();
  process.env.STRIPE_SECRET_KEY = 'sk_test_gate';
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
}, 180000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});
beforeEach(async () => {
  const { dbConnect, Attempt, Payment, PracticeSession, RefundRequest, Student, StripeEvent } = await import('@/lib/db');
  await dbConnect();
  await Promise.all([
    Student.deleteMany({}), Payment.deleteMany({}), RefundRequest.deleteMany({}),
    PracticeSession.deleteMany({}), Attempt.deleteMany({}), StripeEvent.deleteMany({}),
  ]);
  await RefundRequest.syncIndexes();
  sent.length = 0;
  vi.restoreAllMocks();
});

/** Stripe, stubbed: one POST /refunds, one paginated GET /refunds. */
function stripe(options: { create?: () => unknown; list?: unknown[] } = {}) {
  const calls: { method: string; key?: string }[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const method = init?.method ?? 'GET';
    calls.push({ method, key: (init?.headers as Record<string, string>)?.['Idempotency-Key'] });
    if (method === 'POST') {
      const made = options.create?.() ?? { id: 're_1', amount: 4900, status: 'succeeded' };
      if (made instanceof Error) throw made;
      return { ok: true, json: async () => made } as Response;
    }
    void String(input);
    return { ok: true, json: async () => ({ data: options.list ?? [], has_more: false }) } as Response;
  });
  return calls;
}
async function student(email: string, access?: Record<string, unknown>, sitting = SITTING) {
  const { Student } = await import('@/lib/db');
  return Student.create({ email, name: 'Kiara', exam_sitting: sitting, target_modules: [1, 2, 3], password_hash: 'x', syllabus_mode: 'modular-2027', ...(access ? { access } : {}) });
}
async function payment(over: Record<string, unknown> = {}) {
  const { Payment } = await import('@/lib/db');
  const { transition } = await import('@/lib/payment-state');
  return Payment.create({
    event_id: `evt_${Math.random().toString(36).slice(2, 8)}`,
    session_id: `cs_${Math.random().toString(36).slice(2, 8)}`,
    payment_intent_id: 'pi_gate',
    amount_total: 4900,
    currency: 'usd',
    paid_at: new Date(Date.now() - 3 * DAY),
    received_at: new Date(),
    ...transition('granted'),
    ...over,
  });
}
/** A paid student and the grant bound to their payment, as the claim binds it. */
async function paid(email = 'kiara@example.com', over: Record<string, unknown> = {}) {
  const p = await payment(over);
  const s = await student(email, { sitting: SITTING, granted_at: new Date(), source: 'stripe', note: 'stripe evt_1', payment_id: p._id });
  const { Payment } = await import('@/lib/db');
  await Payment.updateOne({ _id: p._id }, { $set: { student_id: s._id } });
  return { payment: p, student: s };
}
const stateOf = async (id: unknown) => {
  const { Payment } = await import('@/lib/db');
  return (await Payment.findById(id).lean<{ state: string; state_reason?: string; refund_id?: string; refund_attempts?: RefundAttempt[] }>())!;
};
const accessOf = async (email: string) => {
  const { Student } = await import('@/lib/db');
  return (await Student.findOne({ email }).lean<{ access?: { revoked_at?: Date; revoked_by?: string; revoked_reason?: string; note: string } }>())?.access ?? null;
};
async function deliver(args: { event: string; session: string; email?: string }) {
  const { POST } = await import('@/app/api/stripe/webhook/route');
  const body = JSON.stringify({
    id: args.event,
    type: 'checkout.session.completed',
    created: Math.floor(Date.now() / 1000),
    data: { object: { id: args.session, mode: 'payment', payment_status: 'paid', amount_total: 4900, currency: 'usd', payment_intent: 'pi_gate', custom_fields: [{ key: STUDENT_EMAIL_FIELD, type: 'text', text: { value: args.email ?? 'kiara@example.com' } }], metadata: { product: 'extralesson' } } },
  });
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac('sha256', SECRET).update(`${t}.${body}`).digest('hex');
  return POST(new Request('https://extralesson.test/api/stripe/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': `t=${t},v1=${v1}` }, body }));
}
const timeout = () => Object.assign(new Error('timed out'), { name: 'TimeoutError' });

describe('1 · refund a granted payment', () => {
  it('one refund, payment refunded, that grant ended, one email, the work still readable', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { Attempt } = await import('@/lib/db');
    const { payment: p, student: s } = await paid();
    await Attempt.create({
      student_id: s._id,
      question_id: new mongoose.Types.ObjectId(),
      session_id: new mongoose.Types.ObjectId(),
      question_index: 0,
      correct: true,
      answer: '11.9',
      rubric_awarded: [],
      profile_marks: { CK: 1, AK: 0, R: 0 },
      duration_ms: 1000,
      ts: new Date(),
    });
    const calls = stripe();

    expect(await refundAndRevoke(String(p._id), OPERATOR, 'asked in the window')).toBe('done');
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(1);
    expect((await stateOf(p._id)).state).toBe('refunded');
    expect((await accessOf('kiara@example.com'))!.revoked_at).toBeInstanceOf(Date);
    expect(sent).toHaveLength(1);
    // Their work is untouched: revocation ends an entitlement, not a record.
    expect(await Attempt.countDocuments({ student_id: s._id })).toBe(1);
  }, 60000);
});

describe('2 · Stripe succeeds, then the process dies before the transaction', () => {
  it('the retry recovers the refund that exists and finishes the revocation — ONE refund', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { payment: p } = await paid();
    // The call lands; the completion never runs.
    const calls = stripe();
    const died = vi.spyOn(mongoose, 'startSession').mockImplementationOnce(() => { throw new Error('process died'); });
    await expect(refundAndRevoke(String(p._id), OPERATOR, 'asked')).rejects.toThrow(/process died/);
    died.mockRestore();

    expect((await stateOf(p._id)).state).toBe('refund_approved');
    expect(await accessOf('kiara@example.com')).toMatchObject({ note: expect.any(String) });
    expect((await accessOf('kiara@example.com'))!.revoked_at ?? null).toBeNull();
    const key = (await stateOf(p._id)).refund_attempts![0].key;

    const retry = stripe({ list: [{ id: 're_made', amount: 4900, status: 'succeeded', metadata: { attempt_key: key } }] });
    expect(await refundAndRevoke(String(p._id), OPERATOR, 'asked')).toBe('already-refunded');
    expect((await stateOf(p._id)).refund_id).toBe('re_made');
    expect((await accessOf('kiara@example.com'))!.revoked_at).toBeInstanceOf(Date);
    // One refund across both attempts: the first POST, and none on the retry.
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(1);
    expect(retry.filter((c) => c.method === 'POST')).toHaveLength(0);
  }, 60000);
});

describe('3 · a timeout calling Stripe', () => {
  it('is unknown-outcome: still approved, nothing revoked, and the retry completes it', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { payment: p } = await paid();
    stripe({ create: () => timeout() });

    expect(await refundAndRevoke(String(p._id), OPERATOR, 'asked')).toBe('unknown-outcome');
    expect((await stateOf(p._id)).state).toBe('refund_approved');
    expect((await accessOf('kiara@example.com'))!.revoked_at ?? null).toBeNull();
    expect(sent).toHaveLength(0);

    stripe();
    expect(await refundAndRevoke(String(p._id), OPERATOR, 'asked')).toBe('done');
    expect((await stateOf(p._id)).state).toBe('refunded');
  }, 60000);
});

describe('4 · concurrent refund clicks on one payment', () => {
  it('one approval, one refund — not necessarily one HTTP call — one email', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { payment: p } = await paid();
    const calls = stripe();

    await Promise.all([refundAndRevoke(String(p._id), OPERATOR, 'asked'), refundAndRevoke(String(p._id), OPERATOR, 'asked')]);

    const after = await stateOf(p._id);
    expect(after.state).toBe('refunded');
    expect(after.refund_attempts).toHaveLength(1);
    const posts = calls.filter((c) => c.method === 'POST');
    expect(new Set(posts.map((c) => c.key)).size).toBe(1);
    expect(sent).toHaveLength(1);
  }, 120000);
});

describe('5 · Stripe rejects', () => {
  it('refund_rejected, refund_failed with the reason, on the queue, nothing revoked; the retry takes a new key', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { StripeError } = await import('@/lib/stripe-api');
    const { loadQueue } = await import('@/lib/payment-queue');
    const { payment: p } = await paid();
    stripe({ create: () => new StripeError(402, 'card_declined', 'Declined.') });

    expect(await refundAndRevoke(String(p._id), OPERATOR, 'asked')).toBe('refund_rejected');
    const failed = await stateOf(p._id);
    expect(failed.state).toBe('refund_failed');
    expect(failed.state_reason).toContain('card_declined');
    expect((await accessOf('kiara@example.com'))!.revoked_at ?? null).toBeNull();
    expect((await loadQueue()).map((r) => r.id)).toContain(String(p._id));

    const calls = stripe();
    expect(await refundAndRevoke(String(p._id), OPERATOR, 'retrying')).toBe('done');
    const after = await stateOf(p._id);
    expect(after.refund_attempts).toHaveLength(2);
    expect(after.refund_attempts![1].key).not.toBe(after.refund_attempts![0].key);
    expect(calls.find((c) => c.method === 'POST')!.key).toBe(after.refund_attempts![1].key);
  }, 60000);
});

describe('6 · a refund-status event reporting failure after acceptance', () => {
  it('moves the payment to refund_failed and leaves the access revoked', () => {
    const attempts: RefundAttempt[] = [{ key: 'k1', at: new Date(), outcome: 'succeeded', refund_id: 're_1' }];
    const change = refundStatusChange({ state: 'refunded', refund_attempts: attempts }, { refund_id: 're_1', outcome: 'failed' })!;
    expect(change.state).toBe('refund_failed');
    // Nothing here touches the grant: the operator decides what happens next.
    expect(Object.keys(change)).toEqual(['index', 'attempt', 'state']);
  });

  it('and a redelivered CHECKOUT event changes no refund state', async () => {
    const { Payment } = await import('@/lib/db');
    const { transition } = await import('@/lib/payment-state');
    const { payment: p } = await paid();
    await Payment.updateOne({ _id: p._id }, { $set: transition('refunded'), $unset: { student_id: '' } });

    await deliver({ event: 'evt_re', session: (await stateOf(p._id)) && String((await Payment.findById(p._id).lean<{ session_id: string }>())!.session_id) });
    expect((await stateOf(p._id)).state).toBe('refunded');
  }, 60000);
});

describe('7 · a crash inside the transaction', () => {
  it('changes neither the state nor the grant', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { Student } = await import('@/lib/db');
    const { payment: p } = await paid();
    stripe();
    const spy = vi.spyOn(Student, 'updateOne').mockImplementation((() => { throw new Error('crash inside the transaction'); }) as typeof Student.updateOne);

    await expect(refundAndRevoke(String(p._id), OPERATOR, 'asked')).rejects.toThrow(/crash inside the transaction/);
    spy.mockRestore();
    expect((await stateOf(p._id)).state).toBe('refund_approved');
    expect((await accessOf('kiara@example.com'))!.revoked_at ?? null).toBeNull();
    expect(sent).toHaveLength(0);
  }, 60000);
});

describe('8 · refunding an old payment after a newer grant exists', () => {
  it('ends only the grant whose payment_id matches, and never one with none', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const august = await payment();
    const september = await payment();
    const s = await student('newer@example.com', { sitting: SITTING, granted_at: new Date(), source: 'stripe', note: 'stripe evt_sep', payment_id: september._id });
    await student('comp@example.com', { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'comp · teacher' });
    stripe();

    expect(await refundAndRevoke(String(august._id), OPERATOR, 'refunding August')).toBe('done');
    expect((await accessOf('newer@example.com'))!.revoked_at ?? null).toBeNull();
    expect((await accessOf('comp@example.com'))!.revoked_at ?? null).toBeNull();
    void s;
  }, 60000);
});

describe('9 · a refunded payment redelivered by a checkout event', () => {
  it('grants nothing and changes no state', async () => {
    const { Payment } = await import('@/lib/db');
    const { transition } = await import('@/lib/payment-state');
    await student('kiara@example.com');
    const p = await payment({ ...transition('refunded'), session_id: 'cs_refunded' });

    await deliver({ event: 'evt_again', session: 'cs_refunded' });
    expect((await stateOf(p._id)).state).toBe('refunded');
    expect(await accessOf('kiara@example.com')).toBeNull();
  }, 60000);
});

describe('10 · a revoked student with unused free sessions', () => {
  it('starts nothing, still nothing after a sitting change, and keeps their work', async () => {
    const { canStartSession } = await import('@/lib/access');
    const { applySittingChange } = await import('@/lib/change-sitting');
    const { openSession } = await import('@/lib/study/open-session');
    const { loadHistory } = await import('@/lib/study/history');
    const { PracticeSession } = await import('@/lib/db');
    const revoked = { sitting: SITTING, granted_at: new Date(), source: 'stripe', note: 'stripe evt_1', revoked_at: new Date(), revoked_by: 'ops@example.com', revoked_reason: 'refunded' };
    const s = await student('revoked@example.com', revoked);
    await PracticeSession.create({ student_id: s._id, mode: 'adaptive', started_at: new Date(), question_ids: [new mongoose.Types.ObjectId()], target_modules: [1] });

    for (const mode of ['adaptive', 'diagnostic', 'first', 'topic']) {
      expect(await canStartSession(String(s._id), revoked as never, mode), mode).toEqual({ allowed: false, reason: 'revoked' });
    }
    await applySittingChange(String(s._id), 'jan-2028');
    for (const mode of ['adaptive', 'diagnostic', 'first']) {
      expect(await canStartSession(String(s._id), null, mode), `${mode} after the change`).toEqual({ allowed: false, reason: 'revoked' });
    }
    // A session already in flight finishes, and the records stay open.
    expect(await openSession(String(s._id))).not.toBeNull();
    expect(await loadHistory(String(s._id))).toEqual([]);
  }, 60000);
});

describe('11 · a refund past the window', () => {
  it('works, and the record says it was late', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { payment: p } = await paid('late@example.com', { paid_at: new Date(Date.now() - (REFUND_DAYS + 9) * DAY) });
    stripe();

    expect(await refundAndRevoke(String(p._id), OPERATOR, 'asked late')).toBe('done');
    const access = await accessOf('late@example.com');
    expect(access!.revoked_reason).toContain('asked late');
    expect(access!.revoked_reason).toContain(`past the ${REFUND_DAYS}-day window`);
    expect((await stateOf(p._id)).state_reason).toContain('late:');
  }, 60000);
});

describe('12 · already-refunded and not-refundable', () => {
  it('are told apart: one is money already back, the other was never paid', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { transition } = await import('@/lib/payment-state');
    const { payment: p } = await paid('twice@example.com');
    stripe();
    await refundAndRevoke(String(p._id), OPERATOR, 'first');
    expect(await refundAndRevoke(String(p._id), OPERATOR, 'again')).toBe('already-refunded');

    for (const state of ['pending', 'closed', 'refused'] as const) {
      const never = await payment({ ...transition(state) });
      expect(await refundAndRevoke(String(never._id), OPERATOR, 'no'), state).toBe('not-refundable');
    }
  }, 60000);
});

describe('13 · refunding a waiting or duplicate payment', () => {
  it('returns the money, touches no grant anywhere, and never says access ended', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { transition } = await import('@/lib/payment-state');
    const holder = await student('holder@example.com', { sitting: SITTING, granted_at: new Date(), source: 'stripe', note: 'stripe evt_x', payment_id: new mongoose.Types.ObjectId() });
    for (const state of ['waiting', 'duplicate'] as const) {
      sent.length = 0;
      const s = await student(`${state}@example.com`);
      const p = await payment({ ...transition(state), student_id: s._id });
      stripe();

      expect(await refundAndRevoke(String(p._id), OPERATOR, 'refunding'), state).toBe('done');
      expect((await stateOf(p._id)).state, state).toBe('refunded');
      expect(await accessOf(`${state}@example.com`), state).toBeNull();
      expect((await accessOf('holder@example.com'))!.revoked_at ?? null, state).toBeNull();
      expect(sent, state).toHaveLength(1);
      expect(sent[0].text, state).not.toContain('access has ended');
    }
    void holder;
  }, 60000);
});

describe('14 · a comp', () => {
  it('is revoked with a reason, calls nobody, and no payment changes state', async () => {
    const { revokeComp } = await import('@/lib/refund');
    const s = await student('comp2@example.com', { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'comp · pilot · 2 of 8' });
    const p = await payment();
    const calls = stripe();

    expect(await revokeComp(String(s._id), OPERATOR, 'the pilot ended')).toBe('done');
    expect(await accessOf('comp2@example.com')).toMatchObject({ revoked_by: 'ops@example.com', revoked_reason: 'the pilot ended' });
    expect(calls).toHaveLength(0);
    expect((await stateOf(p._id)).state).toBe('granted');
    expect(sent).toHaveLength(0);
  }, 60000);
});

describe('15 · an unauthorised refund request', () => {
  it('is refused server-side', async () => {
    const { requestRefund } = await import('@/app/study/actions');
    const { RefundRequest } = await import('@/lib/db');
    const { payment: theirs } = await paid('theirs@example.com');
    const mine = await student('mine@example.com');
    VIEWER = String(mine._id);

    expect(await requestRefund(String(theirs._id))).toEqual({ ok: false });
    expect(await RefundRequest.countDocuments({})).toBe(0);
  }, 60000);
});

describe('16 · one request, however many taps', () => {
  it('resolves only on a successful refund or an explicit dismissal', async () => {
    const { requestRefund } = await import('@/app/study/actions');
    const { refundAndRevoke } = await import('@/lib/refund');
    const { StripeError } = await import('@/lib/stripe-api');
    const { RefundRequest } = await import('@/lib/db');
    const { payment: p, student: s } = await paid('asks@example.com');
    VIEWER = String(s._id);
    for (let i = 0; i < 3; i++) await requestRefund(String(p._id));
    expect(await RefundRequest.countDocuments({})).toBe(1);

    stripe({ create: () => new StripeError(402, 'card_declined', 'Declined.') });
    await refundAndRevoke(String(p._id), OPERATOR, 'asked');
    expect((await RefundRequest.findOne({}).lean<{ state: string }>())!.state, 'a rejected refund leaves it outstanding').toBe('open');

    stripe();
    await refundAndRevoke(String(p._id), OPERATOR, 'asked');
    expect((await RefundRequest.findOne({}).lean<{ state: string }>())!.state).toBe('resolved');
  }, 60000);
});

describe('17 · one row, one count', () => {
  it('for a payment carrying both an open request and a refund state', async () => {
    const { requestRefund } = await import('@/app/study/actions');
    const { Payment } = await import('@/lib/db');
    const { transition } = await import('@/lib/payment-state');
    const { loadQueue } = await import('@/lib/payment-queue');
    const { PaymentQueue } = await import('@/app/admin/access/payment-queue');
    const { payment: p, student: s } = await paid('both@example.com');
    VIEWER = String(s._id);
    await requestRefund(String(p._id));
    await Payment.updateOne({ _id: p._id }, { $set: transition('refund_failed', { reason: 'card_declined' }) });

    const rows = await loadQueue();
    expect(rows).toHaveLength(1);
    const html = renderToStaticMarkup(createElement(PaymentQueue, { rows }));
    expect((html.match(/<li /g) ?? []).length).toBe(1);
    expect(html).toContain('>1</span>');
  }, 60000);
});

describe('18 · a concurrent completion of an already-completed refund', () => {
  it('sends no second email, overwrites no history, and preserves the revocation', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { payment: p } = await paid('once@example.com');
    stripe();
    await refundAndRevoke(String(p._id), OPERATOR, 'the first reason');
    const first = await accessOf('once@example.com');
    sent.length = 0;

    stripe();
    expect(await refundAndRevoke(String(p._id), { email: 'other@example.com' }, 'a second reason')).toBe('already-refunded');
    const after = await accessOf('once@example.com');
    expect(after!.revoked_at).toEqual(first!.revoked_at);
    expect(after!.revoked_by).toBe('ops@example.com');
    expect(after!.revoked_reason).toBe('the first reason');
    expect(sent).toHaveLength(0);
  }, 60000);
});

describe('19 · a failed earlier refund does not block an approved retry', () => {
  it('is not adopted by recovery, and the retry creates a new refund under a new key', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { payment: p } = await paid('retry@example.com');
    stripe({ create: () => timeout() });
    await refundAndRevoke(String(p._id), OPERATOR, 'asked');
    const key = (await stateOf(p._id)).refund_attempts![0].key;

    // A failed refund carrying this very key is on the intent; it proves nothing.
    const calls = stripe({ list: [{ id: 're_failed', amount: 4900, status: 'failed', metadata: { attempt_key: key } }], create: () => ({ id: 're_second', amount: 4900, status: 'succeeded' }) });
    expect(await refundAndRevoke(String(p._id), OPERATOR, 'asked')).toBe('done');
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(1);
    expect((await stateOf(p._id)).refund_id).toBe('re_second');
  }, 60000);
});

describe('20 · a delayed failure from a superseded attempt', () => {
  it('leaves a succeeded refund and its revocation alone', () => {
    const attempts: RefundAttempt[] = [
      { key: 'k1', at: new Date(), outcome: 'unknown', refund_id: 're_old' },
      { key: 'k2', at: new Date(), outcome: 'succeeded', refund_id: 're_new' },
    ];
    const change = refundStatusChange({ state: 'refunded', refund_attempts: attempts }, { refund_id: 're_old', outcome: 'failed' })!;
    expect(change.index).toBe(0);
    expect(change.attempt.outcome).toBe('failed');
    expect(change.state, 'the payment rests on the second attempt').toBeUndefined();
  });
});

describe('21 · an out-of-order pending event', () => {
  it('does not undo a recorded failure', () => {
    const attempts: RefundAttempt[] = [{ key: 'k1', at: new Date(), outcome: 'failed', refund_id: 're_1' }];
    expect(refundStatusChange({ state: 'refund_failed', refund_attempts: attempts }, { refund_id: 're_1', outcome: 'pending' })).toBeNull();
  });
});

describe('22 · a partial or dashboard-issued refund on the same intent', () => {
  it('is never adopted as this operation’s refund', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { payment: p } = await paid('partial@example.com');
    stripe({ create: () => timeout() });
    await refundAndRevoke(String(p._id), OPERATOR, 'asked');
    const key = (await stateOf(p._id)).refund_attempts![0].key;

    const calls = stripe({
      list: [
        { id: 're_partial', amount: 2000, status: 'succeeded', metadata: { attempt_key: key } },
        { id: 're_dashboard', amount: 4900, status: 'succeeded', metadata: {} },
      ],
      create: () => ({ id: 're_ours', amount: 4900, status: 'succeeded' }),
    });
    expect(await refundAndRevoke(String(p._id), OPERATOR, 'asked')).toBe('done');
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(1);
    expect((await stateOf(p._id)).refund_id).toBe('re_ours');
  }, 60000);
});
