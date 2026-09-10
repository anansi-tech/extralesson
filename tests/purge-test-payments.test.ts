import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { isLiveSession, isTestSession } from '@/lib/db/purge-test-payments';

// A one-off that deletes financial records, so its refusals matter more than
// its deletions: a live key or a live payment stops it, and a row whose mode
// cannot be PROVEN is left alone rather than guessed at.
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
  const { dbConnect, Payment, RefundRequest, Student } = await import('@/lib/db');
  await dbConnect();
  await Promise.all([Payment.deleteMany({}), RefundRequest.deleteMany({}), Student.deleteMany({})]);
  process.env.STRIPE_SECRET_KEY = 'sk_test_purge';
  vi.restoreAllMocks();
});

async function payment(over: Record<string, unknown> = {}) {
  const { Payment } = await import('@/lib/db');
  const { transition } = await import('@/lib/payment-state');
  return Payment.create({
    event_id: `evt_${Math.random().toString(36).slice(2, 8)}`,
    session_id: `cs_test_${Math.random().toString(36).slice(2, 8)}`,
    payment_intent_id: 'pi_x',
    amount_total: 4900,
    received_at: new Date(),
    ...transition('granted'),
    ...over,
  });
}
const stripeAnswers = (ok: boolean) =>
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    ok
      ? ({ ok: true, json: async () => ({ id: 'pi_x' }) } as Response)
      : ({ ok: false, json: async () => ({ error: { code: 'resource_missing', message: 'No such payment_intent' } }) } as Response),
  );

describe('reading the mode', () => {
  it('off the session id, which is the only part that says it', () => {
    expect(isTestSession('cs_test_abc')).toBe(true);
    expect(isLiveSession('cs_live_abc')).toBe(true);
    expect(isTestSession('cs_live_abc')).toBe(false);
    expect(isLiveSession('legacy:evt_1')).toBe(false);
    expect(isTestSession('legacy:evt_1')).toBe(false);
  });

  it('and off Stripe for a row that predates session ids: an answer is the proof', async () => {
    const { classify } = await import('@/lib/db/purge-test-payments');
    stripeAnswers(true);
    expect(await classify({ _id: '1', session_id: 'legacy:evt_1', payment_intent_id: 'pi_x', state: 'closed' })).toMatchObject({ mode: 'test' });
    vi.restoreAllMocks();

    // No answer proves nothing: it may be a live object this key cannot see.
    stripeAnswers(false);
    expect(await classify({ _id: '2', session_id: 'legacy:evt_2', payment_intent_id: 'pi_y', state: 'closed' })).toMatchObject({ mode: 'unknown' });
    vi.restoreAllMocks();

    expect(await classify({ _id: '3', session_id: 'legacy:evt_3', state: 'refused' })).toMatchObject({ mode: 'unknown' });
  }, 60000);
});

describe('the plan', () => {
  it('names what goes, and everything it would leave behind', async () => {
    const { planPurge } = await import('@/lib/db/purge-test-payments');
    const { RefundRequest, Student } = await import('@/lib/db');
    stripeAnswers(false);
    const going = await payment({ session_id: 'cs_test_going' });
    const live = await payment({ session_id: 'cs_live_staying' });
    const unproven = await payment({ session_id: 'legacy:evt_old' });
    const s = await Student.create({ email: 'still-here@example.com', name: 'K', exam_sitting: 'may-june-2027', target_modules: [1], password_hash: 'x', syllabus_mode: 'modular-2027', access: { sitting: 'may-june-2027', granted_at: new Date(), source: 'stripe', note: 'stripe evt_1', payment_id: going._id } });
    await RefundRequest.create({ student_id: s._id, payment_id: going._id, asked_at: new Date(), state: 'open' });
    await RefundRequest.create({ student_id: s._id, payment_id: live._id, asked_at: new Date(), state: 'open' });

    const plan = await planPurge();
    expect(plan.test.map((p) => p.id)).toEqual([String(going._id)]);
    expect(plan.live.map((p) => p.id)).toEqual([String(live._id)]);
    expect(plan.unknown.map((p) => p.id)).toEqual([String(unproven._id)]);
    expect(plan.requests.map((r) => r.payment_id)).toEqual([String(going._id)]);
    expect(plan.requestsLeft.map((r) => r.payment_id)).toEqual([String(live._id)]);
    // The account was not deleted first, so its grant would be left naming nothing.
    expect(plan.danglingGrants).toEqual([{ studentId: String(s._id), email: 'still-here@example.com', payment_id: String(going._id) }]);
  }, 60000);
});

describe('the refusals', () => {
  it('a live payment stops it, and nothing is deleted', async () => {
    const { applyPurge, planPurge } = await import('@/lib/db/purge-test-payments');
    const { Payment } = await import('@/lib/db');
    stripeAnswers(true);
    await payment({ session_id: 'cs_test_1' });
    await payment({ session_id: 'cs_live_1' });

    const res = await applyPurge(await planPurge());
    expect(res).toMatchObject({ ok: false });
    expect((res as { reason: string }).reason).toContain('live payment');
    expect(await Payment.countDocuments({})).toBe(2);
  }, 60000);

  it('a live key stops it, whatever the collection holds', async () => {
    const { applyPurge, planPurge } = await import('@/lib/db/purge-test-payments');
    const { Payment } = await import('@/lib/db');
    stripeAnswers(true);
    await payment({ session_id: 'cs_test_2' });
    const plan = await planPurge();
    process.env.STRIPE_SECRET_KEY = 'sk_live_something';

    const res = await applyPurge(plan);
    expect(res).toMatchObject({ ok: false, reason: 'the key is not a test key' });
    expect(await Payment.countDocuments({})).toBe(1);
  }, 60000);
});

describe('writing', () => {
  it('takes the test payments and the requests pointing at them, and nothing else', async () => {
    const { applyPurge, planPurge } = await import('@/lib/db/purge-test-payments');
    const { Payment, RefundRequest, Student } = await import('@/lib/db');
    stripeAnswers(false);
    const going = await payment({ session_id: 'cs_test_go' });
    const staying = await payment({ session_id: 'legacy:evt_unproven' });
    const s = await Student.create({ email: 'gone@example.com', name: 'K', exam_sitting: 'may-june-2027', target_modules: [1], password_hash: 'x', syllabus_mode: 'modular-2027' });
    await RefundRequest.create({ student_id: s._id, payment_id: going._id, asked_at: new Date(), state: 'open' });
    await RefundRequest.create({ student_id: s._id, payment_id: staying._id, asked_at: new Date(), state: 'resolved' });

    const res = await applyPurge(await planPurge());
    expect(res).toEqual({ ok: true, payments: 1, requests: 1 });
    expect((await Payment.find({}).lean<{ _id: unknown }[]>()).map((p) => String(p._id))).toEqual([String(staying._id)]);
    expect((await RefundRequest.find({}).lean<{ payment_id: unknown }[]>()).map((r) => String(r.payment_id))).toEqual([String(staying._id)]);
    // The student is untouched: deleting accounts is a separate act.
    expect(await Student.countDocuments({})).toBe(1);
  }, 60000);
});
