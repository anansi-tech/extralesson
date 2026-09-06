import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// ROUND_9 Task 1: /welcome reads the fulfilment the webhook wrote and
// resolves who is holding the phone; the confirming page asks every three
// seconds for a minute and then stops.
let mongod: MongoMemoryServer;
let Student: typeof import('@/lib/db').Student;
let Payment: typeof import('@/lib/db').Payment;
let Fulfilment: typeof import('@/lib/db').Fulfilment;
let resolveWelcome: typeof import('@/lib/welcome').resolveWelcome;
let welcome: typeof import('@/lib/welcome');

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  ({ Student, Payment, Fulfilment } = await import('@/lib/db'));
  welcome = await import('@/lib/welcome');
  ({ resolveWelcome } = welcome);
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([Student.deleteMany({}), Payment.deleteMany({}), Fulfilment.deleteMany({})]);
});

const EMAIL = 'kiara@example.com';
const student = (email = EMAIL, access?: { sitting: 'jan-2027' | 'may-june-2027' }) =>
  Student.create({ email, name: 'Kiara', exam_sitting: 'may-june-2027', syllabus_mode: 'modular-2027', target_modules: [1, 2, 3], password_hash: 'x', ...(access ? { access: { ...access, source: 'stripe' } } : {}) });
const paid = async (status: 'pending' | 'granted' | 'failed' | 'refused', email: string | null = EMAIL) => {
  const payment = status === 'refused' ? null : await Payment.create({ event_id: `evt_${status}`, email: email ?? undefined });
  await Fulfilment.create({ session_id: 'cs_1', event_id: `evt_${status}`, payment_id: payment?._id, status, ts: new Date() });
};

describe('resolveWelcome', () => {
  it('confirming while the webhook has written nothing yet', async () => {
    expect(await resolveWelcome('cs_1', null)).toEqual({ state: 'confirming', settled: false });
  });
  it('settled, never an error, for a refused or failed fulfilment or one with no address', async () => {
    await paid('refused');
    expect(await resolveWelcome('cs_1', null)).toEqual({ state: 'confirming', settled: true });
    await Fulfilment.deleteMany({});
    await paid('failed');
    expect(await resolveWelcome('cs_1', null)).toEqual({ state: 'confirming', settled: true });
    await Fulfilment.deleteMany({});
    await paid('pending', null);
    expect(await resolveWelcome('cs_1', null)).toEqual({ state: 'confirming', settled: true });
  });
  it('not yet registered: no account on the address and nobody signed in', async () => {
    await paid('pending');
    expect(await resolveWelcome('cs_1', null)).toEqual({ state: 'unregistered', email: EMAIL });
  });
  it('signed in as the payer once the grant has landed', async () => {
    const s = await student(EMAIL, { sitting: 'may-june-2027' });
    await paid('granted');
    expect(await resolveWelcome('cs_1', { student_id: String(s._id) })).toEqual({ state: 'payer', email: EMAIL, sitting: 'May/June 2027', studentId: String(s._id) });
  });
  it('keeps confirming while the account exists and the grant is in flight', async () => {
    await student();
    await paid('pending');
    expect(await resolveWelcome('cs_1', null)).toEqual({ state: 'confirming', settled: false });
  });
  it('bought for someone else: signed in as another account, or not signed in and the address has an account', async () => {
    const other = await student('parent@example.com');
    await student(EMAIL, { sitting: 'may-june-2027' });
    await paid('granted');
    expect(await resolveWelcome('cs_1', { student_id: String(other._id) })).toEqual({ state: 'other', email: EMAIL, sitting: 'May/June 2027' });
    expect(await resolveWelcome('cs_1', null)).toEqual({ state: 'other', email: EMAIL, sitting: 'May/June 2027' });
    await Student.deleteOne({ email: EMAIL });
    await Fulfilment.updateOne({ session_id: 'cs_1' }, { $set: { status: 'pending' } });
    expect(await resolveWelcome('cs_1', { student_id: String(other._id) })).toEqual({ state: 'other', email: EMAIL, sitting: null });
  });
});

describe('the poll and the mask', () => {
  it('asks every three seconds for a minute, then stops', () => {
    expect(welcome.POLL_EVERY_MS).toBe(3000);
    expect(welcome.pollDue(0, 0)).toBe(true);
    expect(welcome.pollDue(0, 59_999)).toBe(true);
    expect(welcome.pollDue(0, 60_000)).toBe(false);
    expect(welcome.pollDue(1_000, 61_000)).toBe(false);
  });
  it('masks everything but the first letter and the domain', () => {
    expect(welcome.maskEmail('kiara@example.com')).toBe('k···@example.com');
    expect(welcome.maskEmail('a@b.gd')).toBe('a···@b.gd');
    expect(welcome.maskEmail('nonsense')).toBe('···');
  });
});
