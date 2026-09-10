import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

// ROUND_12 Task 2. The order is the opposite of the claim's, because the
// external act is the irreversible one: never recorded as done before it has
// happened, and never done without a record that it was attempted.
const sent: { to: string; subject: string; text: string }[] = [];
vi.mock('@/lib/email', async (orig) => ({
  ...(await orig<typeof import('@/lib/email')>()),
  sendEmail: async (m: { to: string; subject: string; text: string }) => { sent.push(m); return { ok: true }; },
}));

const SITTING = 'may-june-2027';
const OPERATOR = { email: 'ops@example.com' };
let mongod: MongoMemoryReplSet;
beforeAll(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongod.getUri();
  process.env.STRIPE_SECRET_KEY = 'sk_test_refund';
}, 180000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});
beforeEach(async () => {
  const { dbConnect, Payment, Student } = await import('@/lib/db');
  await dbConnect();
  await Promise.all([Student.deleteMany({}), Payment.deleteMany({})]);
  sent.length = 0;
  vi.restoreAllMocks();
});

/** Stripe, as this path sees it: one POST /refunds and one GET /refunds list. */
function stripe(options: { create?: () => unknown; list?: unknown[]; pages?: unknown[][] } = {}) {
  const calls: { method: string; url: string; key?: string; body?: string }[] = [];
  let page = 0;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    calls.push({ method, url, key: (init?.headers as Record<string, string>)?.['Idempotency-Key'], body: String(init?.body ?? '') });
    if (method === 'POST') {
      const made = options.create?.() ?? { id: 're_new', amount: 4900, status: 'succeeded' };
      if (made instanceof Error) throw made;
      return { ok: true, json: async () => made } as Response;
    }
    const pages = options.pages ?? [options.list ?? []];
    const data = pages[Math.min(page, pages.length - 1)] ?? [];
    const has_more = page < pages.length - 1;
    page += 1;
    return { ok: true, json: async () => ({ data, has_more }) } as Response;
  });
  return calls;
}

async function student(email: string, access?: Record<string, unknown>) {
  const { Student } = await import('@/lib/db');
  return Student.create({ email, name: 'Kiara', exam_sitting: SITTING, target_modules: [1, 2, 3], password_hash: 'x', syllabus_mode: 'modular-2027', ...(access ? { access } : {}) });
}
async function payment(over: Record<string, unknown> = {}) {
  const { Payment } = await import('@/lib/db');
  const { transition } = await import('@/lib/payment-state');
  return Payment.create({
    event_id: `evt_${Math.random().toString(36).slice(2, 8)}`,
    session_id: `cs_${Math.random().toString(36).slice(2, 8)}`,
    payment_intent_id: 'pi_1',
    amount_total: 4900,
    received_at: new Date(),
    ...transition('granted'),
    ...over,
  });
}
/** A paid payment and the grant it bought, bound as the claim binds them. */
async function paidWithGrant(email = 'kiara@example.com') {
  const p = await payment();
  const s = await student(email, { sitting: SITTING, granted_at: new Date(), source: 'stripe', note: 'stripe evt_1', payment_id: p._id });
  return { payment: p, student: s };
}
const stateOf = async (id: unknown) => {
  const { Payment } = await import('@/lib/db');
  return (await Payment.findById(id).lean<{ state: string; state_reason?: string; refund_id?: string; refund_status?: string; refund_attempts?: { key: string; outcome: string; error?: string }[] }>())!;
};
const accessOf = async (email: string) => {
  const { Student } = await import('@/lib/db');
  return (await Student.findOne({ email }).lean<{ access?: { revoked_at?: Date; revoked_by?: string; revoked_reason?: string; note: string } }>())?.access ?? null;
};

describe('the happy path', () => {
  it('refunds once, ends that grant, records both, and writes one email', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { payment: p } = await paidWithGrant();
    const calls = stripe();

    expect(await refundAndRevoke(String(p._id), OPERATOR, 'asked within the window')).toBe('done');

    const after = await stateOf(p._id);
    expect(after.state).toBe('refunded');
    expect(after.refund_id).toBe('re_new');
    expect(after.refund_status).toBe('succeeded');
    expect(after.refund_attempts).toHaveLength(1);
    expect(after.refund_attempts![0]).toMatchObject({ outcome: 'succeeded' });

    const access = await accessOf('kiara@example.com');
    expect(access!.revoked_at).toBeInstanceOf(Date);
    expect(access!.revoked_by).toBe('ops@example.com');
    expect(access!.revoked_reason).toBe('asked within the window');
    // The grant is ended, not erased: its note is still there.
    expect(access!.note).toContain('stripe evt_1');

    const posts = calls.filter((c) => c.method === 'POST');
    expect(posts).toHaveLength(1);
    expect(posts[0].url).toContain('/v1/refunds');
    expect(posts[0].body).toContain('payment_intent=pi_1');
    // The key goes into the refund's metadata, so a later recovery finds THIS attempt.
    expect(posts[0].body).toContain(`metadata%5Battempt_key%5D=${after.refund_attempts![0].key}`);
    expect(posts[0].key).toBe(after.refund_attempts![0].key);
    expect(sent).toHaveLength(1);
    expect(sent[0].text).toContain('access has ended');
  }, 60000);

  it('is bound to the grant: an older payment never revokes a newer purchase', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { Student } = await import('@/lib/db');
    const august = await payment();
    const september = await payment();
    // The account's live grant was bought with the SEPTEMBER payment.
    const s = await student('kiara@example.com', { sitting: SITTING, granted_at: new Date(), source: 'stripe', note: 'stripe evt_sep', payment_id: september._id });
    // And another account holds a grant with no payment at all: a comp.
    await student('comp@example.com', { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'comp · teacher' });
    stripe();

    expect(await refundAndRevoke(String(august._id), OPERATOR, 'refunded the August charge')).toBe('done');

    expect((await Student.findById(s._id).lean<{ access: { revoked_at?: Date } }>())!.access.revoked_at ?? null).toBeNull();
    expect((await accessOf('comp@example.com'))!.revoked_at ?? null).toBeNull();
    // Nobody was told anything, because nobody's access ended.
    expect(sent).toHaveLength(0);
  }, 60000);
});

describe('money held with no grant', () => {
  it('refunds a waiting payment, touches no access, and never says access ended', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { transition } = await import('@/lib/payment-state');
    const s = await student('waiting@example.com');
    const p = await payment({ ...transition('waiting'), student_id: s._id });
    stripe();

    expect(await refundAndRevoke(String(p._id), OPERATOR, 'paid twice')).toBe('done');
    expect((await stateOf(p._id)).state).toBe('refunded');
    expect(await accessOf('waiting@example.com')).toBeNull();
    expect(sent).toHaveLength(1);
    expect(sent[0].text).not.toContain('access has ended');
    expect(sent[0].text).toContain('refunded');
  }, 60000);

  it('a duplicate is refundable too, and a state that was never paid is not', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { transition } = await import('@/lib/payment-state');
    stripe();
    const dup = await payment({ ...transition('duplicate') });
    expect(await refundAndRevoke(String(dup._id), OPERATOR, 'refunded')).toBe('done');

    for (const state of ['pending', 'closed', 'refused'] as const) {
      const p = await payment({ ...transition(state) });
      expect(await refundAndRevoke(String(p._id), OPERATOR, 'no'), state).toBe('not-refundable');
      expect((await stateOf(p._id)).state, state).toBe(state);
    }
    expect(await refundAndRevoke(String(new mongoose.Types.ObjectId()), OPERATOR, 'no')).toBe('not-refundable');
    // No payment intent is no refund: there is nothing to issue it against.
    const noIntent = await payment({ payment_intent_id: undefined });
    expect(await refundAndRevoke(String(noIntent._id), OPERATOR, 'no')).toBe('not-refundable');
  }, 60000);
});

describe('when the outcome is not known', () => {
  it('a timeout leaves the payment approved on the queue, revokes nothing, and the retry recovers', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { payment: p } = await paidWithGrant();
    stripe({ create: () => Object.assign(new Error('timed out'), { name: 'TimeoutError' }) });

    expect(await refundAndRevoke(String(p._id), OPERATOR, 'asked')).toBe('unknown-outcome');
    const mid = await stateOf(p._id);
    expect(mid.state).toBe('refund_approved');
    expect(mid.refund_attempts).toHaveLength(1);
    expect((await accessOf('kiara@example.com'))!.revoked_at ?? null).toBeNull();
    expect(sent).toHaveLength(0);

    // The request had in fact been received: the retry finds it and finishes.
    const key = mid.refund_attempts![0].key;
    const calls = stripe({ list: [{ id: 're_found', amount: 4900, status: 'succeeded', metadata: { attempt_key: key } }] });
    expect(await refundAndRevoke(String(p._id), OPERATOR, 'asked')).toBe('already-refunded');

    const after = await stateOf(p._id);
    expect(after.state).toBe('refunded');
    expect(after.refund_id).toBe('re_found');
    // ONE refund: the retry adopted the one that existed rather than making another.
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0);
    expect(after.refund_attempts).toHaveLength(1);
    expect((await accessOf('kiara@example.com'))!.revoked_at).toBeInstanceOf(Date);
    expect(sent).toHaveLength(1);
  }, 60000);

  it('reads every page before concluding there is nothing to recover', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { Payment } = await import('@/lib/db');
    const { payment: p } = await paidWithGrant();
    stripe({ create: () => Object.assign(new Error('timed out'), { name: 'TimeoutError' }) });
    await refundAndRevoke(String(p._id), OPERATOR, 'asked');
    const key = (await stateOf(p._id)).refund_attempts![0].key;

    const noise = Array.from({ length: 100 }, (_, i) => ({ id: `re_other_${i}`, amount: 4900, status: 'succeeded', metadata: {} }));
    const calls = stripe({ pages: [noise, [{ id: 're_page_two', amount: 4900, status: 'succeeded', metadata: { attempt_key: key } }]] });

    expect(await refundAndRevoke(String(p._id), OPERATOR, 'asked')).toBe('already-refunded');
    expect(calls.filter((c) => c.method === 'GET')).toHaveLength(2);
    expect((await stateOf(p._id)).refund_id).toBe('re_page_two');
    expect(await Payment.countDocuments({ _id: p._id, state: 'refunded' })).toBe(1);
  }, 60000);

  it('adopts no refund that is not this attempt’s: failed, canceled, partial, or the dashboard’s', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { payment: p } = await paidWithGrant();
    stripe({ create: () => Object.assign(new Error('timed out'), { name: 'TimeoutError' }) });
    await refundAndRevoke(String(p._id), OPERATOR, 'asked');
    const key = (await stateOf(p._id)).refund_attempts![0].key;

    const calls = stripe({
      list: [
        { id: 're_failed', amount: 4900, status: 'failed', metadata: { attempt_key: key } },
        { id: 're_canceled', amount: 4900, status: 'canceled', metadata: { attempt_key: key } },
        { id: 're_partial', amount: 2000, status: 'succeeded', metadata: { attempt_key: key } },
        { id: 're_dashboard', amount: 4900, status: 'succeeded', metadata: {} },
      ],
      create: () => ({ id: 're_ours', amount: 4900, status: 'succeeded' }),
    });

    expect(await refundAndRevoke(String(p._id), OPERATOR, 'asked')).toBe('done');
    // None of those blocked the retry it was approved for.
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(1);
    expect((await stateOf(p._id)).refund_id).toBe('re_ours');
  }, 60000);

  it('an empty list does not prove the request failed: the same attempt and key are kept', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { payment: p } = await paidWithGrant();
    stripe({ create: () => Object.assign(new Error('timed out'), { name: 'TimeoutError' }) });
    await refundAndRevoke(String(p._id), OPERATOR, 'asked');
    const key = (await stateOf(p._id)).refund_attempts![0].key;

    const calls = stripe({ list: [] });
    expect(await refundAndRevoke(String(p._id), OPERATOR, 'asked')).toBe('done');
    const after = await stateOf(p._id);
    expect(after.refund_attempts).toHaveLength(1);
    expect(after.refund_attempts![0].key).toBe(key);
    expect(calls.find((c) => c.method === 'POST')!.key).toBe(key);
  }, 60000);
});

describe('when Stripe refuses', () => {
  it('records the failure with its reason and revokes nothing; the approved retry takes a new key', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { StripeError } = await import('@/lib/stripe-api');
    const { payment: p } = await paidWithGrant();
    stripe({ create: () => new StripeError(400, 'charge_already_refunded', 'Charge has already been refunded.') });

    // Rejected, not not-refundable: Stripe refused it, and the payment says so.
    expect(await refundAndRevoke(String(p._id), OPERATOR, 'asked')).toBe('refund_rejected');
    const failed = await stateOf(p._id);
    expect(failed.state).toBe('refund_failed');
    expect(failed.state_reason).toContain('charge_already_refunded');
    expect(failed.refund_attempts![0]).toMatchObject({ outcome: 'failed' });
    expect((await accessOf('kiara@example.com'))!.revoked_at ?? null).toBeNull();
    expect(sent).toHaveLength(0);

    const calls = stripe();
    expect(await refundAndRevoke(String(p._id), OPERATOR, 'trying again')).toBe('done');
    const after = await stateOf(p._id);
    expect(after.refund_attempts).toHaveLength(2);
    // The old key is spent — Stripe caches the failure against it — so the retry takes a new one.
    expect(after.refund_attempts![1].key).not.toBe(after.refund_attempts![0].key);
    expect(calls.find((c) => c.method === 'POST')!.key).toBe(after.refund_attempts![1].key);
  }, 60000);
});

describe('already refunded', () => {
  it('changes nothing, keeps the revocation it has, and sends no second email', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { payment: p } = await paidWithGrant();
    stripe();
    await refundAndRevoke(String(p._id), OPERATOR, 'first time');
    const first = await accessOf('kiara@example.com');
    sent.length = 0;

    const calls = stripe();
    expect(await refundAndRevoke(String(p._id), { email: 'someone.else@example.com' }, 'again')).toBe('already-refunded');

    const after = await accessOf('kiara@example.com');
    expect(after!.revoked_at).toEqual(first!.revoked_at);
    expect(after!.revoked_by).toBe('ops@example.com');
    expect(after!.revoked_reason).toBe('first time');
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0);
    expect(sent).toHaveLength(0);
  }, 60000);

  it('revokes a grant that a refund left standing', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { transition } = await import('@/lib/payment-state');
    const p = await payment({ ...transition('refunded'), refund_id: 're_old' });
    await student('stranded@example.com', { sitting: SITTING, granted_at: new Date(), source: 'stripe', note: 'stripe evt_1', payment_id: p._id });

    expect(await refundAndRevoke(String(p._id), OPERATOR, 'tidying up')).toBe('already-refunded');
    expect((await accessOf('stranded@example.com'))!.revoked_at).toBeInstanceOf(Date);
    expect(sent).toHaveLength(0);
  }, 60000);
});

describe('two clicks on one payment', () => {
  it('are one approval, one refund and one email', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { payment: p } = await paidWithGrant();
    const calls = stripe();

    const both = await Promise.all([
      refundAndRevoke(String(p._id), OPERATOR, 'asked'),
      refundAndRevoke(String(p._id), OPERATOR, 'asked'),
    ]);

    expect(both.filter((r) => r === 'done' || r === 'already-refunded')).toHaveLength(2);
    const after = await stateOf(p._id);
    expect(after.state).toBe('refunded');
    // ONE APPROVAL and ONE REFUND — not necessarily one HTTP call. The loser
    // joins the winner's approval, so every call carries the same key and
    // Stripe answers with the same refund.
    expect(after.refund_attempts).toHaveLength(1);
    const posts = calls.filter((c) => c.method === 'POST');
    expect(posts.length).toBeGreaterThanOrEqual(1);
    expect(new Set(posts.map((c) => c.key)).size).toBe(1);
    expect(posts[0].key).toBe(after.refund_attempts![0].key);
    expect(sent).toHaveLength(1);
  }, 120000);
});

describe('a crash inside the transaction', () => {
  it('changes neither the state nor the grant', async () => {
    const { refundAndRevoke } = await import('@/lib/refund');
    const { Student } = await import('@/lib/db');
    const { payment: p } = await paidWithGrant();
    stripe();
    const spy = vi.spyOn(Student, 'updateOne').mockImplementation((() => { throw new Error('crash inside the transaction'); }) as typeof Student.updateOne);

    await expect(refundAndRevoke(String(p._id), OPERATOR, 'asked')).rejects.toThrow(/crash inside the transaction/);
    spy.mockRestore();

    expect((await stateOf(p._id)).state).toBe('refund_approved');
    expect((await accessOf('kiara@example.com'))!.revoked_at ?? null).toBeNull();
    expect(sent).toHaveLength(0);
  }, 60000);
});

describe('a comp', () => {
  it('is revoked with a reason and an operator, and nobody is called', async () => {
    const { revokeComp } = await import('@/lib/refund');
    await student('comp@example.com', { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'comp · teacher · st-marys' });
    const calls = stripe();

    expect(await revokeComp((await (await import('@/lib/db')).Student.findOne({ email: 'comp@example.com' }).lean<{ _id: unknown }>())!._id as string, OPERATOR, 'the pilot ended')).toBe('done');
    const access = await accessOf('comp@example.com');
    expect(access).toMatchObject({ revoked_by: 'ops@example.com', revoked_reason: 'the pilot ended' });
    expect(access!.note).toContain('comp · teacher');
    expect(calls).toHaveLength(0);
    expect(sent).toHaveLength(0);
  }, 60000);

  it('cannot be revoked twice', async () => {
    const { revokeComp } = await import('@/lib/refund');
    const s = await student('twice@example.com', { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'comp · pilot' });
    expect(await revokeComp(String(s._id), OPERATOR, 'first')).toBe('done');
    expect(await revokeComp(String(s._id), OPERATOR, 'second')).toBe('not-revocable');
    expect((await accessOf('twice@example.com'))!.revoked_reason).toBe('first');
  }, 60000);
});

describe('who calls it', () => {
  it('is the operator, through the two admin actions, and nothing automatic', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
    const actions = at('app', 'admin', 'access', 'actions.ts');
    // Each behind requireAdmin and a required reason (ROUND_12 Task 4).
    expect(actions).toMatch(/refundPayment[\s\S]*requireAdmin\(\)[\s\S]*reason\.length < 3[\s\S]*refundAndRevoke\(/);
    expect(actions).toMatch(/revokeGrant[\s\S]*requireAdmin\(\)[\s\S]*reason\.length < 3[\s\S]*revokeComp\(/);
    // Never from a webhook: a status arriving from Stripe authorises nothing.
    expect(at('app', 'api', 'stripe', 'webhook', 'route.ts')).not.toMatch(/refundAndRevoke|revokeComp/);
  });
});
