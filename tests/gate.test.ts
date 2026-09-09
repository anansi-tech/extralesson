import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { STUDENT_EMAIL_FIELD } from '@/lib/stripe-webhook';

// ROUND_11 Task 6 — THE GATE. Nine cases, against a replica set, because the
// claim is a transaction and a test that cannot open one would prove nothing.
// Nothing else ships until this passes.
const sent: { to: string }[] = [];
vi.mock('@/lib/email', () => ({
  sendEmail: async (m: { to: string }) => { sent.push(m); return { ok: true }; },
  accessEmail: () => ({ subject: 's', html: 'h', text: 't' }),
  SENDER: 'ExtraLesson <x@y.test>',
}));
vi.mock('next/cache', () => ({ revalidatePath() {} }));
const redirects: string[] = [];
vi.mock('next/navigation', async (orig) => ({
  ...(await orig<typeof import('next/navigation')>()),
  redirect: (url: string) => { redirects.push(url); throw new Error(`REDIRECT ${url}`); },
}));
vi.mock('@/lib/auth/session', () => ({
  requireAdmin: async () => ({ student_id: 'a', email: 'ops@example.com', role: 'admin' }),
  setSessionCookie: async () => {},
}));

const SECRET = 'whsec_gate';
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
  sent.length = 0;
  redirects.length = 0;
});

/** A signed delivery, as Stripe builds one. */
async function deliver(args: { event: string; session: string; email?: string | null; paid?: boolean; type?: string }) {
  const { POST } = await import('@/app/api/stripe/webhook/route');
  const body = JSON.stringify({
    id: args.event,
    type: args.type ?? 'checkout.session.completed',
    data: {
      object: {
        id: args.session,
        mode: 'payment',
        payment_status: args.paid === false ? 'unpaid' : 'paid',
        amount_total: 4900,
        currency: 'usd',
        custom_fields: args.email === null ? [] : [{ key: STUDENT_EMAIL_FIELD, type: 'text', text: { value: args.email ?? 'kiara@example.com' } }],
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
/** Registration's half: the account is persisted, then it claims what waits. */
async function registerAndClaim(email: string) {
  const s = await makeStudent(email);
  const { claimWaitingFor } = await import('@/lib/claim');
  return { student: s, outcomes: await claimWaitingFor(email, { id: s._id }) };
}
const payments = async () => {
  const { Payment } = await import('@/lib/db');
  return Payment.find({}).sort({ received_at: 1 }).lean<{ _id: unknown; session_id?: string; state?: string; state_reason?: string; student_id?: unknown }[]>();
};
const accessOf = async (email: string) => {
  const { Student } = await import('@/lib/db');
  return (await Student.findOne({ email }).lean<{ access?: { sitting: string; source: string; note: string; granted_at: Date } }>())?.access ?? null;
};

describe('1 · retry', () => {
  it('the same event twice: one payment, one grant, one email', async () => {
    await makeStudent('kiara@example.com');
    await deliver({ event: 'evt_1', session: 'cs_1' });
    await deliver({ event: 'evt_1', session: 'cs_1' });

    expect(await payments()).toHaveLength(1);
    expect((await payments())[0].state).toBe('granted');
    expect(sent).toHaveLength(1);
  }, 60000);

  it('a different event for the same session: still one payment, one grant, one email', async () => {
    // No account yet, so the first delivery cannot grant and the second is a
    // real redelivery of the same session under a new event id.
    await deliver({ event: 'evt_2a', session: 'cs_2' });
    await deliver({ event: 'evt_2b', session: 'cs_2' });
    expect(await payments()).toHaveLength(1);

    const { outcomes } = await registerAndClaim('kiara@example.com');
    expect(outcomes).toEqual(['granted']);
    expect(await payments()).toHaveLength(1);
    expect(sent).toHaveLength(1);
  }, 60000);
});

describe('2 · concurrent registration, forced', () => {
  it('webhook then registration: one grant', async () => {
    await deliver({ event: 'evt_3', session: 'cs_3' });
    const { outcomes } = await registerAndClaim('kiara@example.com');
    expect(outcomes).toEqual(['granted']);
    expect((await payments())[0].state).toBe('granted');
    expect(sent).toHaveLength(1);
  }, 60000);

  it('registration then webhook: one grant', async () => {
    await makeStudent('kiara@example.com');
    await deliver({ event: 'evt_4', session: 'cs_4' });
    expect((await payments())[0].state).toBe('granted');
    expect(sent).toHaveLength(1);
  }, 60000);

  it('both mid-flight — the payment persisted, the account persisted, then both claim', async () => {
    // The window the ordering rule exists for: neither side can miss the
    // other, and only one of them may grant.
    await deliver({ event: 'evt_5', session: 'cs_5' });
    const s = await makeStudent('kiara@example.com');
    const { claim, claimWaitingFor } = await import('@/lib/claim');

    const [fromWebhook, fromRegistration] = await Promise.all([
      claim('cs_5', { id: s._id }),
      claimWaitingFor('kiara@example.com', { id: s._id }),
    ]);
    const outcomes = [fromWebhook, ...fromRegistration];
    expect(outcomes.filter((o) => o === 'granted')).toHaveLength(1);
    expect(outcomes.filter((o) => o === 'duplicate')).toHaveLength(0);
    expect((await payments())[0].state).toBe('granted');
    expect(sent).toHaveLength(1);
  }, 120000);

  it('two registrations at once: one account, one grant', async () => {
    await deliver({ event: 'evt_6', session: 'cs_6' });
    const { Student } = await import('@/lib/db');
    await Student.syncIndexes();
    const both = await Promise.allSettled([registerAndClaim('kiara@example.com'), registerAndClaim('kiara@example.com')]);
    const won = both.filter((r) => r.status === 'fulfilled');
    expect(won.length).toBeGreaterThanOrEqual(1);
    expect(await Student.countDocuments({ email: 'kiara@example.com' })).toBe(1);
    expect((await payments())[0].state).toBe('granted');
    expect(sent).toHaveLength(1);
  }, 120000);
});

describe('3 · two payments, one student', () => {
  it('claimed concurrently: one granted, one duplicate', async () => {
    const s = await makeStudent('kiara@example.com');
    await deliver({ event: 'evt_7a', session: 'cs_7a', email: 'nobody@example.com' });
    await deliver({ event: 'evt_7b', session: 'cs_7b', email: 'nobody@example.com' });
    const { claim } = await import('@/lib/claim');

    const outcomes = await Promise.all([claim('cs_7a', { id: s._id }), claim('cs_7b', { id: s._id })]);
    expect([...outcomes].sort()).toEqual(['duplicate', 'granted']);
    expect((await payments()).map((p) => p.state).sort()).toEqual(['duplicate', 'granted']);
    expect(sent).toHaveLength(1);
  }, 120000);
});

describe('4 · close racing a claim', () => {
  it('one wins, the other is refused, and the loser writes no access', async () => {
    const s = await makeStudent('kiara@example.com');
    await deliver({ event: 'evt_8', session: 'cs_8', email: 'nobody@example.com' });
    const [{ claim }, { closePayment }] = await Promise.all([import('@/lib/claim'), import('@/app/admin/access/actions')]);
    const id = String((await payments())[0]._id);
    const form = new FormData();
    form.set('id', id);
    form.set('reason', 'thought it was a test');

    const [claimed, closed] = await Promise.allSettled([claim('cs_8', { id: s._id }), closePayment(form)]);
    const state = (await payments())[0].state;
    const access = await accessOf('kiara@example.com');

    if (state === 'granted') {
      expect(claimed).toMatchObject({ status: 'fulfilled', value: 'granted' });
      expect(access).not.toBeNull();
      expect(redirects.some((r) => r.includes('stale=1'))).toBe(true);
    } else {
      expect(state).toBe('closed');
      expect(access).toBeNull();
      expect(claimed).toMatchObject({ status: 'fulfilled', value: 'not-claimable' });
    }
    void closed;
    expect(sent.length).toBe(state === 'granted' ? 1 : 0);
  }, 120000);
});

describe('5 · duplicate charge', () => {
  it('writes no access, leaves the grant and its note intact, and the row is duplicate', async () => {
    const granted_at = new Date('2026-09-01T10:00:00Z');
    const first = { sitting: SITTING, granted_at, source: 'manual', note: 'comp · teacher · st-marys' };
    await makeStudent('kiara@example.com', first);
    await deliver({ event: 'evt_9', session: 'cs_9' });

    expect(await accessOf('kiara@example.com')).toEqual(expect.objectContaining({ ...first, granted_at }));
    const p = (await payments())[0];
    expect(p.state).toBe('duplicate');
    expect(p.state_reason).toBe(`already had access for ${SITTING}`);
    expect(sent).toHaveLength(0);
  }, 60000);
});

describe('6 · a terminal state redelivered', () => {
  it('grants nothing and changes nothing, for closed, refused and granted alike', async () => {
    const { Payment } = await import('@/lib/db');
    const { claim } = await import('@/lib/claim');
    const s = await makeStudent('kiara@example.com');
    for (const state of ['closed', 'refused', 'granted'] as const) {
      await Payment.deleteMany({});
      await deliver({ event: `evt_10_${state}`, session: `cs_10_${state}`, email: 'nobody@example.com' });
      await Payment.updateOne({ session_id: `cs_10_${state}` }, { $set: { state, state_at: new Date('2026-09-01') } });

      // Redelivered by Stripe, and claimed by hand: neither moves it.
      await deliver({ event: `evt_10_${state}_again`, session: `cs_10_${state}`, email: 'nobody@example.com' });
      expect(await claim(`cs_10_${state}`, { id: s._id }), state).toBe('not-claimable');

      const after = (await payments())[0];
      expect(after.state, state).toBe(state);
      expect(await accessOf('kiara@example.com'), state).toBeNull();
    }
    expect(sent).toHaveLength(0);
  }, 120000);
});

describe('7 · a delayed payment', () => {
  it('completed unpaid is pending; async_payment_succeeded moves that row to waiting and claims', async () => {
    await makeStudent('kiara@example.com');
    await deliver({ event: 'evt_11', session: 'cs_11', paid: false });
    const before = await payments();
    expect(before).toHaveLength(1);
    expect(before[0].state).toBe('pending');
    expect(await accessOf('kiara@example.com')).toBeNull();

    await deliver({ event: 'evt_11b', session: 'cs_11', type: 'checkout.session.async_payment_succeeded' });
    const after = await payments();
    expect(after, 'the same row, not a second one').toHaveLength(1);
    expect(after[0].state).toBe('granted');
    expect((await accessOf('kiara@example.com'))!.sitting).toBe(SITTING);
    expect(sent).toHaveLength(1);
  }, 60000);
});

describe('8 · a crash between the two writes', () => {
  it('changes neither the state nor the access', async () => {
    const { Student } = await import('@/lib/db');
    const { claim } = await import('@/lib/claim');
    const s = await makeStudent('kiara@example.com');
    await deliver({ event: 'evt_12', session: 'cs_12', email: 'nobody@example.com' });

    const spy = vi.spyOn(Student, 'updateOne').mockImplementation((() => { throw new Error('crash inside the transaction'); }) as typeof Student.updateOne);
    await expect(claim('cs_12', { id: s._id })).rejects.toThrow(/crash inside the transaction/);
    spy.mockRestore();

    expect((await payments())[0].state).toBe('waiting');
    expect(await accessOf('kiara@example.com')).toBeNull();
    expect(sent).toHaveLength(0);
  }, 60000);
});

describe('9 · one payment, one place', () => {
  it('no payment is in two lists, and the count is the list', async () => {
    const { Payment } = await import('@/lib/db');
    const { loadQueue } = await import('@/lib/payment-queue');
    const { QUEUE_STATES } = await import('@/lib/payment-state');
    const s = await makeStudent('kiara@example.com');
    // One of every state, from the paths that write them.
    await deliver({ event: 'evt_13a', session: 'cs_13a', email: 'nobody@example.com' });          // waiting
    await deliver({ event: 'evt_13b', session: 'cs_13b', paid: false });                          // pending
    await deliver({ event: 'evt_13c', session: 'cs_13c' });                                       // granted
    await deliver({ event: 'evt_13d', session: 'cs_13d' });                                       // duplicate
    await Payment.updateOne({ session_id: 'cs_13a' }, { $set: { state: 'refused' } });            // refused
    await deliver({ event: 'evt_13e', session: 'cs_13e', email: 'nobody@example.com' });          // waiting
    void s;

    const all = await payments();
    const queue = await loadQueue();
    // Every payment is in exactly one state, and the queue is the states with work.
    expect(all.every((p) => typeof p.state === 'string')).toBe(true);
    const inQueue = all.filter((p) => QUEUE_STATES.includes(p.state as 'waiting'));
    expect(queue.map((r) => r.id).sort()).toEqual(inQueue.map((p) => String(p._id)).sort());
    expect(new Set(queue.map((r) => r.id)).size).toBe(queue.length);
    expect(queue.length).toBe(inQueue.length);
    // A settled payment cannot be in the queue at all: the row type is the two
    // states with work, so the compiler refuses the comparison.
    expect(queue.every((r) => QUEUE_STATES.includes(r.state))).toBe(true);
  }, 120000);
});
