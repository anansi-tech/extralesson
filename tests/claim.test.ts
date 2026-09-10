import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

// ROUND_11 Task 2. A replica set, not a standalone: the point of this task is
// the transaction, and a test that cannot run one would prove nothing.
const sent: { to: string }[] = [];
vi.mock('@/lib/email', () => ({
  sendEmail: async (m: { to: string }) => { sent.push(m); return { ok: true }; },
  accessEmail: () => ({ subject: 's', html: 'h', text: 't' }),
  SENDER: 'ExtraLesson <x@y.test>',
}));

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
  const { dbConnect, Payment, Student } = await import('@/lib/db');
  await dbConnect();
  await Promise.all([Student.deleteMany({}), Payment.deleteMany({})]);
  sent.length = 0;
});

const SITTING = 'may-june-2027';

async function student(email: string, access?: Record<string, unknown>) {
  const { Student } = await import('@/lib/db');
  return Student.create({ email, name: 'Kiara', exam_sitting: SITTING, target_modules: [1, 2, 3], password_hash: 'x', syllabus_mode: 'modular-2027', ...(access ? { access } : {}) });
}
async function waitingPayment(sessionId: string, email = 'payer@example.com', receivedAt = new Date()) {
  const { Payment } = await import('@/lib/db');
  const { transition } = await import('@/lib/payment-state');
  return Payment.create({ event_id: `evt_${sessionId}`, session_id: sessionId, email, received_at: receivedAt, ...transition('waiting') });
}
const paymentOf = async (sessionId: string) => {
  const { Payment } = await import('@/lib/db');
  return (await Payment.findOne({ session_id: sessionId }).lean<{ state: string; state_reason?: string; student_id?: unknown; note?: string }>())!;
};
const accessOf = async (email: string) => {
  const { Student } = await import('@/lib/db');
  const s = await Student.findOne({ email }).lean<{ access?: { sitting: string; source: string; note: string; granted_at: Date } }>();
  return s?.access ?? null;
};

describe('claim', () => {
  it('grants: the payment and the access commit together, with one email', async () => {
    const { claim } = await import('@/lib/claim');
    const s = await student('kiara@example.com');
    await waitingPayment('cs_grant');

    expect(await claim('cs_grant', { id: s._id })).toBe('granted');
    const p = await paymentOf('cs_grant');
    expect(p.state).toBe('granted');
    expect(String(p.student_id)).toBe(String(s._id));
    const access = await accessOf('kiara@example.com');
    expect(access!.sitting).toBe(SITTING);
    expect(access!.note).toContain('stripe evt_cs_grant');
    expect(sent.map((m) => m.to)).toEqual(['kiara@example.com']);
  }, 60000);

  it('only waiting is claimable: granted, closed and refused are terminal', async () => {
    const { claim } = await import('@/lib/claim');
    const { Payment } = await import('@/lib/db');
    const s = await student('terminal@example.com');
    for (const state of ['granted', 'closed', 'refused', 'pending'] as const) {
      await Payment.deleteMany({});
      const p = await waitingPayment(`cs_${state}`);
      await Payment.updateOne({ _id: p._id }, { $set: { state } });
      expect(await claim(`cs_${state}`, { id: s._id }), state).toBe('not-claimable');
      expect(await accessOf('terminal@example.com'), state).toBeNull();
    }
    expect(sent).toHaveLength(0);
  }, 60000);

  it('an unknown session, and an account that is gone, are not claimable', async () => {
    const { claim } = await import('@/lib/claim');
    const s = await student('here@example.com');
    expect(await claim('cs_nothing', { id: s._id })).toBe('not-claimable');
    await waitingPayment('cs_orphan');
    expect(await claim('cs_orphan', { id: new mongoose.Types.ObjectId() })).toBe('not-claimable');
    expect((await paymentOf('cs_orphan')).state).toBe('waiting');
  }, 60000);

  it('a live grant for their sitting is duplicate: no access written, the grant and its note untouched', async () => {
    const { claim } = await import('@/lib/claim');
    const granted_at = new Date('2026-09-01T10:00:00Z');
    const first = { sitting: SITTING, granted_at, source: 'manual', note: 'comp · teacher · st-marys' };
    const s = await student('covered@example.com', first);
    await waitingPayment('cs_dup');

    expect(await claim('cs_dup', { id: s._id })).toBe('duplicate');
    const access = await accessOf('covered@example.com');
    expect(access).toEqual(expect.objectContaining({ ...first, granted_at }));
    const p = await paymentOf('cs_dup');
    expect(p.state).toBe('duplicate');
    expect(p.state_reason).toBe(`already had access for ${SITTING}`);
    expect(p.note).toContain(first.note);
    expect(sent).toHaveLength(0);
  }, 60000);

  it('a grant for another sitting, or an expired one, is claimable', async () => {
    const { claim } = await import('@/lib/claim');
    const s = await student('other@example.com', { sitting: 'jan-2028', granted_at: new Date(), source: 'manual', note: 'comp · pilot' });
    await waitingPayment('cs_other');
    expect(await claim('cs_other', { id: s._id })).toBe('granted');
    const access = await accessOf('other@example.com');
    expect(access!.sitting).toBe(SITTING);
    expect(access!.note).toContain('was jan-2028 manual: comp · pilot');
  }, 60000);
});

describe('two payments racing one account', () => {
  it('gives exactly one granted and one duplicate, whichever wins', async () => {
    const { claim } = await import('@/lib/claim');
    const s = await student('race@example.com');
    await waitingPayment('cs_race_a');
    await waitingPayment('cs_race_b');

    const outcomes = await Promise.all([claim('cs_race_a', { id: s._id }), claim('cs_race_b', { id: s._id })]);
    expect([...outcomes].sort()).toEqual(['duplicate', 'granted']);
    const states = [(await paymentOf('cs_race_a')).state, (await paymentOf('cs_race_b')).state];
    expect([...states].sort()).toEqual(['duplicate', 'granted']);
    // One account, one grant, one email.
    const access = await accessOf('race@example.com');
    expect(access!.source).toBe('stripe');
    expect(sent).toHaveLength(1);
  }, 120000);

  it('claiming the same payment twice at once grants once', async () => {
    const { claim } = await import('@/lib/claim');
    const s = await student('same@example.com');
    await waitingPayment('cs_same');
    const outcomes = await Promise.all([claim('cs_same', { id: s._id }), claim('cs_same', { id: s._id })]);
    expect(outcomes.filter((o) => o === 'granted')).toHaveLength(1);
    expect((await paymentOf('cs_same')).state).toBe('granted');
    expect(sent).toHaveLength(1);
  }, 120000);
});

describe('neither write lands without the other', () => {
  it('a failure inside the transaction leaves the state and the access as they were', async () => {
    const { claim } = await import('@/lib/claim');
    const { Student } = await import('@/lib/db');
    const s = await student('crash@example.com');
    await waitingPayment('cs_crash');
    // The last write of the transaction throws; everything before it must roll back.
    const spy = vi.spyOn(Student, 'updateOne').mockImplementation((() => {
      throw new Error('crash between the two writes');
    }) as typeof Student.updateOne);

    await expect(claim('cs_crash', { id: s._id })).rejects.toThrow(/crash between the two writes/);
    spy.mockRestore();

    expect((await paymentOf('cs_crash')).state).toBe('waiting');
    expect(await accessOf('crash@example.com')).toBeNull();
    expect(sent).toHaveLength(0);
  }, 60000);
});

describe('registration claims what is waiting for the address', () => {
  it('oldest first: the first grants, the rest are duplicates', async () => {
    const { claimWaitingFor } = await import('@/lib/claim');
    const s = await student('multi@example.com');
    await waitingPayment('cs_old', 'multi@example.com', new Date('2026-09-01T09:00:00Z'));
    await waitingPayment('cs_new', 'multi@example.com', new Date('2026-09-02T09:00:00Z'));

    expect(await claimWaitingFor('multi@example.com', { id: s._id })).toEqual(['granted', 'duplicate']);
    expect((await paymentOf('cs_old')).state).toBe('granted');
    expect((await paymentOf('cs_new')).state).toBe('duplicate');
    expect(sent).toHaveLength(1);
  }, 120000);

  it('leaves another address alone', async () => {
    const { claimWaitingFor } = await import('@/lib/claim');
    const s = await student('mine@example.com');
    await waitingPayment('cs_theirs', 'theirs@example.com');
    expect(await claimWaitingFor('mine@example.com', { id: s._id })).toEqual([]);
    expect((await paymentOf('cs_theirs')).state).toBe('waiting');
  }, 60000);
});

describe('the orderings that cannot miss each other', () => {
  const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
  it('the webhook persists the payment before it looks up the student; registration persists the student first', () => {
    const route = at('app', 'api', 'stripe', 'webhook', 'route.ts');
    expect(route.indexOf('Payment.findOne({ session_id: sessionId })')).toBeLessThan(route.indexOf('const student = email'));
    const register = at('app', '(door)', 'study', 'login', 'actions.ts');
    expect(register.indexOf('const student = await Student.create(')).toBeLessThan(register.indexOf('claimWaitingFor(email'));
  });
  it('comps take their own path and never touch payment state', () => {
    const actions = at('app', 'admin', 'access', 'actions.ts');
    const grant = actions.slice(actions.indexOf('export async function grantAccess'), actions.indexOf('export async function revokeAccess'));
    expect(grant).not.toMatch(/Payment\.|transition\(|claim\(/);
  });
  it('the email is sent after the transaction commits, never inside it', () => {
    const claimSrc = at('lib', 'claim.ts');
    expect(claimSrc.indexOf('await session.withTransaction(')).toBeLessThan(claimSrc.indexOf('sendEmail('));
    const body = claimSrc.slice(claimSrc.indexOf('await session.withTransaction('), claimSrc.indexOf('} finally {'));
    expect(body).not.toContain('sendEmail');
  });
});
