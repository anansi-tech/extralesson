import { createHmac } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { canStartSession, grantFor, hasAccess, type Access } from '@/lib/access';
import { accessEndsAt } from '@/lib/sittings';

// ROUND_9 Task 9: ACCESS IS GRANTED TO A SITTING. The grant records the
// sitting it was for and expires on that sitting's dates, whatever the
// account's sitting is later changed to.
let mongod: MongoMemoryServer;
const SECRET = 'whsec_sitting_test';
let Student: typeof import('@/lib/db').Student;
let SittingChange: typeof import('@/lib/db').SittingChange;
let backfillAccessSitting: typeof import('@/lib/db/backfill-access-sitting').backfillAccessSitting;
let applySittingChange: typeof import('@/lib/change-sitting').applySittingChange;
let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  await mongoose.connect(process.env.MONGODB_URI);
  ({ Student, SittingChange } = await import('@/lib/db'));
  ({ backfillAccessSitting } = await import('@/lib/db/backfill-access-sitting'));
  ({ applySittingChange } = await import('@/lib/change-sitting'));
  ({ POST } = await import('@/app/api/stripe/webhook/route'));
}, 120000);

/** A signed checkout for this address, the way Stripe delivers one. */
function paid(id: string, email: string): Request {
  const body = JSON.stringify({
    id,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: `cs_${id}`,
        metadata: { product: 'extralesson' },
        mode: 'payment',
        payment_status: 'paid',
        amount_total: 4900,
        currency: 'usd',
        custom_fields: [{ text: { value: email } }],
        customer_details: { email },
      },
    },
  });
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac('sha256', SECRET).update(`${t}.${body}`).digest('hex');
  return new Request('https://extralesson.test/api/stripe/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': `t=${t},v1=${v1}` },
    body,
  });
}

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  vi.restoreAllMocks();
  await Promise.all([Student.deleteMany({}), SittingChange.deleteMany({})]);
});

let n = 0;
const student = (sitting: 'jan-2027' | 'may-june-2027', access?: Partial<Access>) =>
  Student.create({
    email: `kiara${++n}@example.com`,
    name: 'Kiara',
    exam_sitting: sitting,
    syllabus_mode: sitting === 'jan-2027' ? 'legacy-jan' : 'modular-2027',
    target_modules: [1, 2, 3],
    ...(access ? { access: { sitting, granted_at: new Date('2026-09-01T00:00:00Z'), source: 'manual', ...access } } : {}),
  });

const readAccess = async (id: unknown) => (await Student.findById(id).select('access').lean<{ access: Access }>())!.access;

describe('a grant is to a sitting', () => {
  it('changing the student’s sitting leaves an existing grant’s expiry unchanged', async () => {
    const s = await student('jan-2027', {});
    const before = await readAccess(s._id);
    expect(accessEndsAt(before.sitting)).toEqual(accessEndsAt('jan-2027'));

    await Student.updateOne({ _id: s._id }, { $set: { exam_sitting: 'may-june-2027', syllabus_mode: 'modular-2027' } });

    const after = await readAccess(s._id);
    expect(after.sitting).toBe('jan-2027');
    expect(accessEndsAt(after.sitting)).toEqual(accessEndsAt(before.sitting));
    // The January grant is over on the day it was always going to be over.
    expect(hasAccess(after, new Date('2027-02-20T00:00:00Z'))).toBe(true);
    expect(hasAccess(after, new Date('2027-04-01T00:00:00Z'))).toBe(false);
  });

  it('backfills a grant with no sitting from the student’s sitting at grant time, and touches nothing else', async () => {
    const bare = await student('jan-2027');
    const named = await student('may-june-2027', { sitting: 'jan-2027' });
    const free = await student('may-june-2027');
    await Student.collection.updateOne({ _id: bare._id }, { $set: { access: { granted_at: new Date('2026-08-01T00:00:00Z'), source: 'manual' } } });

    expect(await backfillAccessSitting()).toEqual({ filled: 1 });

    expect((await readAccess(bare._id)).sitting).toBe('jan-2027');
    expect((await readAccess(named._id)).sitting).toBe('jan-2027');
    expect(await readAccess(free._id)).toBeUndefined();
    expect(await backfillAccessSitting()).toEqual({ filled: 0 });
  });
});

// ROUND_9 Task 9: CHANGE SITTING. Allowed any time; appended, never edited;
// the grant does not move with the account.
describe('change sitting', () => {
  it('changing while paid does not extend access: the new sitting has no grant', async () => {
    const s = await student('jan-2027', {});
    await applySittingChange(String(s._id), 'may-june-2027');

    const after = await Student.findById(s._id).lean<{ exam_sitting: string; syllabus_mode: string; access: Access }>();
    expect(after!.exam_sitting).toBe('may-june-2027');
    expect(after!.syllabus_mode).toBe('modular-2027');
    expect(after!.access.sitting).toBe('jan-2027');
    expect(accessEndsAt(after!.access.sitting)).toEqual(accessEndsAt('jan-2027'));
    // For the sitting the account is now entered for, the grant is nobody's.
    expect(grantFor(after!.access, 'may-june-2027')).toBeNull();
    expect(await canStartSession(String(s._id), grantFor(after!.access, after!.exam_sitting), 'adaptive')).toEqual(
      await canStartSession(String(s._id), null, 'adaptive'),
    );

    const changes = await SittingChange.find({ student_id: s._id }).lean<{ from: string; to: string; ts: Date }[]>();
    expect(changes.map((c) => [c.from, c.to])).toEqual([['jan-2027', 'may-june-2027']]);
    expect(changes[0].ts).toBeInstanceOf(Date);
  });

  it('changing to the sitting the account already has appends nothing', async () => {
    const s = await student('may-june-2027');
    await applySittingChange(String(s._id), 'may-june-2027');
    expect(await SittingChange.countDocuments({})).toBe(0);
  });

  it('the January re-sit is the whole paper, as at registration', async () => {
    const s = await student('may-june-2027');
    await Student.updateOne({ _id: s._id }, { $set: { target_modules: [1] } });
    await applySittingChange(String(s._id), 'jan-2027');
    const after = await Student.findById(s._id).lean<{ syllabus_mode: string; target_modules: number[] }>();
    expect(after!.syllabus_mode).toBe('legacy-jan');
    expect(after!.target_modules).toEqual([1, 2, 3]);
  });

  it('paying after a change grants the new sitting', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const s = await student('jan-2027', {});
    await applySittingChange(String(s._id), 'may-june-2027');

    const res = await POST(paid('evt_after_change', s.email));
    expect(res.status).toBe(200);

    const after = await readAccess(s._id);
    expect(after.sitting).toBe('may-june-2027');
    expect(grantFor(after, 'may-june-2027')).not.toBeNull();
    expect(hasAccess(after, new Date('2027-06-15T00:00:00Z'))).toBe(true);
    // The old grant's dates are gone with it: this one ends on the new sitting's.
    expect(accessEndsAt(after.sitting)).toEqual(accessEndsAt('may-june-2027'));
  });
});
