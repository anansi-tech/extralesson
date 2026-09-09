import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { deriveState, reasonFromNote } from '@/lib/db/migrate-payment-state';

// ROUND_11 Task 5, first commit. The state is derived by precedence and
// never from whether a student holds access: a comp holder with a refunded
// payment must not read as a payment that granted it.
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
  const { dbConnect, Fulfilment, Payment } = await import('@/lib/db');
  await dbConnect();
  await Promise.all([Payment.deleteMany({}), Fulfilment.deleteMany({})]);
});

const payment = (over: Record<string, unknown> = {}) => ({ _id: 'p1', event_id: 'evt_1', ...over }) as never;
const fulfilment = (status: string, over: Record<string, unknown> = {}) => ({ _id: 'f1', session_id: 'cs_1', status, ts: new Date(), ...over }) as never;

describe('the precedence', () => {
  it('1 · a payment a person resolved is closed, carrying their reason and their name', () => {
    expect(deriveState(payment({ resolved_at: new Date(), note: 'resolved: refunded in Stripe', closed_by: 'ops@example.com' }), fulfilment('granted'))).toEqual({
      state: 'closed', reason: 'refunded in Stripe', closed_by: 'ops@example.com', by: 'resolved_at',
    });
  });
  it('1 · invents no operator and no reason where there is none', () => {
    expect(deriveState(payment({ resolved_at: new Date(), note: 'kept when the account was deleted' }), null)).toEqual({
      state: 'closed', reason: undefined, closed_by: undefined, by: 'resolved_at',
    });
  });
  it('2 · a duplicate fulfilment is duplicate, with its reason', () => {
    expect(deriveState(payment(), fulfilment('duplicate', { reason: 'already had access for may-june-2027' }))).toEqual({
      state: 'duplicate', reason: 'already had access for may-june-2027', by: 'fulfilment',
    });
  });
  it('3 · refused is refused, except not-paid which is pending, never stranded', () => {
    expect(deriveState(payment(), fulfilment('refused', { reason: 'not-ours' }))).toEqual({ state: 'refused', reason: 'not-ours', by: 'fulfilment' });
    expect(deriveState(payment(), fulfilment('refused', { reason: 'not-payment-mode' }))).toEqual({ state: 'refused', reason: 'not-payment-mode', by: 'fulfilment' });
    expect(deriveState(payment(), fulfilment('refused', { reason: 'not-paid' }))).toEqual({ state: 'pending', reason: 'awaiting payment confirmation', by: 'fulfilment' });
  });
  it('4 · granted is granted; 5 · pending is unfinished processing, so waiting', () => {
    expect(deriveState(payment(), fulfilment('granted'))).toEqual({ state: 'granted', by: 'fulfilment' });
    expect(deriveState(payment(), fulfilment('pending'))).toEqual({ state: 'waiting', by: 'fulfilment' });
  });
  it('6 · otherwise waiting, and the two statuses written after the spec', () => {
    expect(deriveState(payment(), null)).toEqual({ state: 'waiting', by: 'default' });
    expect(deriveState(payment(), fulfilment('unmatched', { reason: 'no account for the paying address' }))).toEqual({
      state: 'waiting', reason: 'no account for the paying address', by: 'fulfilment',
    });
    expect(deriveState(payment(), fulfilment('resolved', { reason: 'test payment' }))).toEqual({ state: 'closed', reason: 'test payment', by: 'fulfilment' });
  });
  it('a status with no rule is ambiguous, never guessed', () => {
    expect(deriveState(payment(), fulfilment('something-new'))).toEqual({ ambiguous: "fulfilment status 'something-new' has no rule" });
  });
  it('reads the reason a person typed, and nothing else', () => {
    expect(reasonFromNote('resolved: refunded')).toBe('refunded');
    expect(reasonFromNote('duplicate · already had access')).toBeUndefined();
    expect(reasonFromNote(undefined)).toBeUndefined();
  });
});

describe('the plan', () => {
  const seed = async () => {
    const { Fulfilment, Payment } = await import('@/lib/db');
    const rows = {
      granted: await Payment.create({ event_id: 'evt_g', email: 'a@example.com', received_at: new Date() }),
      dup: await Payment.create({ event_id: 'evt_d', email: 'b@example.com', received_at: new Date() }),
      closed: await Payment.create({ event_id: 'evt_c', email: 'c@example.com', received_at: new Date(), resolved_at: new Date(), note: 'resolved: refunded' }),
      lonely: await Payment.create({ event_id: 'evt_l', email: 'd@example.com', received_at: new Date() }),
      live: await Payment.create({ event_id: 'evt_live', session_id: 'cs_live', email: 'e@example.com', received_at: new Date(), state: 'granted', state_at: new Date() }),
    };
    await Fulfilment.create({ session_id: 'cs_g', event_id: 'evt_g', payment_id: rows.granted._id, status: 'granted', ts: new Date() });
    await Fulfilment.create({ session_id: 'cs_d', event_id: 'evt_d', payment_id: rows.dup._id, status: 'duplicate', reason: 'already had access', ts: new Date() });
    await Fulfilment.create({ session_id: 'cs_c', event_id: 'evt_c', payment_id: rows.closed._id, status: 'granted', ts: new Date() });
    // A refused session that never wrote a payment at all.
    await Fulfilment.create({ session_id: 'cs_refused', event_id: 'evt_r', status: 'refused', reason: 'not-ours', ts: new Date() });
    return rows;
  };

  it('counts each state, takes the session id from the fulfilment, and names what it cannot place', async () => {
    const { planMigration } = await import('@/lib/db/migrate-payment-state');
    const rows = await seed();
    const plan = await planMigration();

    expect(plan.counts).toEqual({ granted: 1, duplicate: 1, closed: 1, refused: 1, waiting: 1 });
    expect(plan.updates.find((u) => u.id === String(rows.granted._id))!.session_id).toBe('cs_g');
    // resolved_at beats the granted fulfilment beside it.
    expect(plan.updates.find((u) => u.id === String(rows.closed._id))!.derived).toMatchObject({ state: 'closed', reason: 'refunded' });
    // A fulfilment with no payment becomes one, keyed by its session.
    expect(plan.creates).toEqual([{ session_id: 'cs_refused', event_id: 'cs_refused', derived: { state: 'refused', reason: 'not-ours', by: 'fulfilment' } }]);
    // A payment with no fulfilment: reported by id, and still given a state.
    expect(plan.noFulfilment.map((p) => p.id)).toEqual([String(rows.lonely._id)]);
    // Older than session tracking: keyed by its event rather than left unkeyable.
    const legacy = plan.updates.find((u) => u.id === String(rows.lonely._id))!;
    expect(legacy).toMatchObject({ session_id: 'legacy:evt_l', synthetic: true, derived: { state: 'waiting', by: 'default' } });
    expect(plan.ambiguous).toEqual([]);
    // A row a live transition already settled is left alone.
    expect(plan.live).toEqual([{ id: String(rows.live._id), state: 'granted' }]);
  }, 60000);

  it('never reads the entitlement: a comp holder with a refunded payment stays closed', async () => {
    const { Fulfilment, Payment, Student } = await import('@/lib/db');
    const { planMigration } = await import('@/lib/db/migrate-payment-state');
    await Student.create({ email: 'comp@example.com', name: 'K', exam_sitting: 'may-june-2027', target_modules: [1], password_hash: 'x', syllabus_mode: 'modular-2027', access: { sitting: 'may-june-2027', granted_at: new Date(), source: 'manual', note: 'comp · teacher' } });
    const p = await Payment.create({ event_id: 'evt_comp', email: 'comp@example.com', received_at: new Date(), resolved_at: new Date(), note: 'resolved: refunded, they had a comp' });
    await Fulfilment.create({ session_id: 'cs_comp', event_id: 'evt_comp', payment_id: p._id, status: 'pending', ts: new Date() });

    const plan = await planMigration();
    expect(plan.updates[0].derived).toMatchObject({ state: 'closed', reason: 'refunded, they had a comp' });
  }, 60000);

  it('reports two fulfilments for one payment rather than choosing between them', async () => {
    const { Fulfilment, Payment } = await import('@/lib/db');
    const { planMigration } = await import('@/lib/db/migrate-payment-state');
    const p = await Payment.create({ event_id: 'evt_two', received_at: new Date() });
    await Fulfilment.create({ session_id: 'cs_two_a', event_id: 'evt_two', payment_id: p._id, status: 'granted', ts: new Date() });
    await Fulfilment.create({ session_id: 'cs_two_b', event_id: 'evt_two', payment_id: p._id, status: 'refused', reason: 'not-ours', ts: new Date() });

    const plan = await planMigration();
    expect(plan.updates).toHaveLength(0);
    expect(plan.ambiguous).toEqual([
      { id: String(p._id), session_id: null, why: '2 fulfilments point at this payment', detail: expect.stringContaining('matched to nobody') },
    ]);
  }, 60000);
});

describe('writing it', () => {
  it('is restartable and never overwrites a transition that happened since', async () => {
    const { Fulfilment, Payment } = await import('@/lib/db');
    const { applyMigration } = await import('@/lib/db/migrate-payment-state');
    const p = await Payment.create({ event_id: 'evt_r1', received_at: new Date() });
    await Fulfilment.create({ session_id: 'cs_r1', event_id: 'evt_r1', payment_id: p._id, status: 'pending', ts: new Date() });

    expect(await applyMigration()).toEqual({ updated: 1, created: 0, skipped: 0 });
    expect((await Payment.findById(p._id).lean<{ state: string; session_id: string }>())!).toMatchObject({ state: 'waiting', session_id: 'cs_r1' });

    // A person grants it, and the migration runs again.
    await Payment.updateOne({ _id: p._id }, { $set: { state: 'granted', state_at: new Date() } });
    expect(await applyMigration()).toEqual({ updated: 0, created: 0, skipped: 0 });
    expect((await Payment.findById(p._id).lean<{ state: string }>())!.state).toBe('granted');
  }, 60000);

  it('creates the payment a refused session never wrote, once', async () => {
    const { Fulfilment, Payment } = await import('@/lib/db');
    const { applyMigration } = await import('@/lib/db/migrate-payment-state');
    await Fulfilment.create({ session_id: 'cs_only', event_id: 'evt_only', status: 'refused', reason: 'not-ours', ts: new Date() });

    expect(await applyMigration()).toMatchObject({ created: 1 });
    expect(await applyMigration()).toMatchObject({ created: 0 });
    expect(await Payment.countDocuments({ session_id: 'cs_only' })).toBe(1);
    expect((await Payment.findOne({ session_id: 'cs_only' }).lean<{ state: string }>())!.state).toBe('refused');
  }, 60000);
});

describe('a row older than session tracking', () => {
  it('is keyed by its event, uniquely, and says it holds no real session', async () => {
    const { Payment } = await import('@/lib/db');
    const { applyMigration, legacyKey, LEGACY_KEY_PREFIX } = await import('@/lib/db/migrate-payment-state');
    const p = await Payment.create({ event_id: 'evt_old', received_at: new Date('2026-08-26'), amount_total: 2500, currency: 'usd' });
    expect(legacyKey('evt_old')).toBe('legacy:evt_old');

    await applyMigration();
    const after = (await Payment.findById(p._id).lean<{ session_id: string; state: string }>())!;
    expect(after.session_id).toBe('legacy:evt_old');
    expect(after.session_id.startsWith(LEGACY_KEY_PREFIX)).toBe(true);
    // Waiting, because the precedence never reads the entitlement: a person closes it.
    expect(after.state).toBe('waiting');
    // The key is a key: two rows cannot share one.
    await Payment.syncIndexes();
    await expect(Payment.create({ event_id: 'evt_other', session_id: 'legacy:evt_old', received_at: new Date() })).rejects.toThrow();
  }, 60000);
});

describe('nothing has switched', () => {
  it('the cutover is still false and nothing is dropped', async () => {
    const { PAYMENT_STATE_CUTOVER } = await import('@/lib/cutover');
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    expect(PAYMENT_STATE_CUTOVER).toBe(false);
    // Fulfilment is still a model, and resolved_at is still on the payment.
    expect(readFileSync(join(process.cwd(), 'lib', 'db', 'fulfilment.ts'), 'utf8')).toContain('export const Fulfilment');
    expect(readFileSync(join(process.cwd(), 'lib', 'db', 'payment.ts'), 'utf8')).toContain('resolved_at');
  });
});
