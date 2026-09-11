import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { transition } from '@/lib/payment-state';

// ROUND_9 Task 1: /welcome reads the fulfilment the webhook wrote and
// resolves who is holding the phone; the confirming page asks every three
// seconds for a minute and then stops.
let mongod: MongoMemoryReplSet;
let Student: typeof import('@/lib/db').Student;
let Payment: typeof import('@/lib/db').Payment;
let resolveWelcome: typeof import('@/lib/welcome').resolveWelcome;
let welcome: typeof import('@/lib/welcome');

beforeAll(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  ({ Student, Payment } = await import('@/lib/db'));
  welcome = await import('@/lib/welcome');
  ({ resolveWelcome } = welcome);
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([Student.deleteMany({}), Payment.deleteMany({})]);
});

const EMAIL = 'kiara@example.com';
const student = (email = EMAIL, access?: { sitting: 'jan-2027' | 'may-june-2027' }) =>
  Student.create({ email, name: 'Kiara', exam_sitting: 'may-june-2027', syllabus_mode: 'modular-2027', target_modules: [1, 2, 3], password_hash: 'x', ...(access ? { access: { ...access, source: 'stripe' } } : {}) });
/** The payment for the session, which is what /welcome reads (ROUND_11 Task 4). */
const paid = async (state: 'waiting' | 'granted' | 'closed' | 'refused', email: string | null = EMAIL, studentId?: unknown) =>
  Payment.create({
    event_id: `evt_${state}`,
    session_id: 'cs_1',
    email: email ?? undefined,
    received_at: new Date(),
    ...transition(state),
    ...(studentId ? { student_id: studentId } : {}),
  });

describe('resolveWelcome', () => {
  it('confirming while the webhook has written nothing yet', async () => {
    expect(await resolveWelcome('cs_1', null)).toEqual({ state: 'confirming', settled: false });
  });
  it('settled, never an error, for a payment closed, not ours, or with no address to name', async () => {
    await paid('closed');
    expect(await resolveWelcome('cs_1', null)).toEqual({ state: 'confirming', settled: true });
    await Payment.deleteMany({});
    await paid('refused');
    expect(await resolveWelcome('cs_1', null)).toEqual({ state: 'confirming', settled: true });
    await Payment.deleteMany({});
    await paid('waiting', null);
    expect(await resolveWelcome('cs_1', null)).toEqual({ state: 'confirming', settled: true });
  });
  it('not yet registered: no account on the address and nobody signed in', async () => {
    await paid('waiting');
    expect(await resolveWelcome('cs_1', null)).toEqual({ state: 'unregistered', email: EMAIL });
  });
  it('signed in as the payer once the grant has landed', async () => {
    const s = await student(EMAIL, { sitting: 'may-june-2027' });
    await paid('granted', EMAIL, s._id);
    expect(await resolveWelcome('cs_1', { student_id: String(s._id) })).toEqual({ state: 'payer', email: EMAIL, sitting: 'May/June 2027', studentId: String(s._id) });
  });
  it('keeps confirming while the account exists and the claim is in flight', async () => {
    await student();
    await paid('waiting');
    expect(await resolveWelcome('cs_1', null)).toEqual({ state: 'confirming', settled: false });
  });
  it('bought for someone else: signed in as another account, or not signed in and the address has an account', async () => {
    const other = await student('parent@example.com');
    const holder = await student(EMAIL, { sitting: 'may-june-2027' });
    await paid('granted', EMAIL, holder._id);
    expect(await resolveWelcome('cs_1', { student_id: String(other._id) })).toEqual({ state: 'other', email: EMAIL, sitting: 'May/June 2027' });
    expect(await resolveWelcome('cs_1', null)).toEqual({ state: 'other', email: EMAIL, sitting: 'May/June 2027' });
    // The account is gone and the payment is waiting again: the address is all there is to say.
    await Student.deleteOne({ email: EMAIL });
    await Payment.updateOne({ session_id: 'cs_1' }, { $set: { ...transition('waiting') }, $unset: { student_id: '' } });
    expect(await resolveWelcome('cs_1', { student_id: String(other._id) })).toEqual({ state: 'other', email: EMAIL, sitting: null });
  });
});

describe('the poll and the mask', () => {
  it('asks every three seconds for a minute, then stops', async () => {
    // In their own module, out of the database's reach: the client polls with
    // these, and importing them from lib/welcome bundled Mongoose.
    const poll = await import('@/lib/welcome-poll');
    expect(poll.POLL_EVERY_MS).toBe(3000);
    expect(poll.pollDue(0, 0)).toBe(true);
    expect(poll.pollDue(0, 59_999)).toBe(true);
    expect(poll.pollDue(0, 60_000)).toBe(false);
    expect(poll.pollDue(1_000, 61_000)).toBe(false);
  });
});
