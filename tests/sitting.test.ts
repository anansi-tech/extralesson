import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { hasAccess, type Access } from '@/lib/access';
import { accessEndsAt } from '@/lib/sittings';

// ROUND_9 Task 9: ACCESS IS GRANTED TO A SITTING. The grant records the
// sitting it was for and expires on that sitting's dates, whatever the
// account's sitting is later changed to.
let mongod: MongoMemoryServer;
let Student: typeof import('@/lib/db').Student;
let backfillAccessSitting: typeof import('@/lib/db/backfill-access-sitting').backfillAccessSitting;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  ({ Student } = await import('@/lib/db'));
  ({ backfillAccessSitting } = await import('@/lib/db/backfill-access-sitting'));
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Student.deleteMany({});
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
