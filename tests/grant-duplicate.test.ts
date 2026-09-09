import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// A SECOND PAYMENT FOR A SITTING ALREADY COVERED grants nothing: the grant
// that exists is the evidence of how access was given, and a duplicate must
// not move its date or erase its note. The money is flagged for a refund.
const sent: unknown[] = [];
vi.mock('@/lib/email', () => ({
  sendEmail: async (m: unknown) => { sent.push(m); return { ok: true }; },
  accessEmail: () => ({ subject: 's', html: 'h', text: 't' }),
  SENDER: 'ExtraLesson <x@y.test>',
}));

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
  const { dbConnect, Fulfilment, Payment, Student } = await import('@/lib/db');
  await dbConnect();
  await Promise.all([Student.deleteMany({}), Payment.deleteMany({}), Fulfilment.deleteMany({})]);
  sent.length = 0;
});
afterEach(() => {
  vi.useRealTimers();
});

const SITTING = 'may-june-2027';

/** A student, a payment for them, and the fulfilment the webhook opens. */
async function setup(access: Record<string, unknown> | null, eventId: string) {
  const { Fulfilment, Payment, Student } = await import('@/lib/db');
  const student = await Student.create({
    email: `s-${eventId}@example.com`,
    name: 'Kiara',
    exam_sitting: SITTING,
    target_modules: [1, 2, 3],
    password_hash: 'x',
    syllabus_mode: 'modular-2027',
    ...(access ? { access } : {}),
  });
  const payment = await Payment.create({ event_id: eventId, email: student.email, received_at: new Date() });
  await Fulfilment.create({ session_id: `cs_${eventId}`, event_id: eventId, payment_id: payment._id, status: 'pending', ts: new Date() });
  return { student, payment };
}

describe('a payment for a sitting the account already has', () => {
  it('leaves the grant untouched, flags the payment, and sends nothing', async () => {
    const { grantFromPayment } = await import('@/lib/grant-from-payment');
    const { Fulfilment, Payment, Student } = await import('@/lib/db');
    const grantedAt = new Date('2026-09-01T10:00:00Z');
    const first = { sitting: SITTING, granted_at: grantedAt, source: 'manual', note: 'comp · teacher · st-marys · 2026-09-01' };
    const { student, payment } = await setup(first, 'evt_dup');

    const outcome = await grantFromPayment({
      studentId: student._id,
      registeredSitting: SITTING,
      payment: { _id: payment._id, event_id: 'evt_dup', email_source: 'custom_field' },
    });

    expect(outcome).toBe('duplicate');
    const after = await Student.findById(student._id).lean<{ access: { sitting: string; granted_at: Date; source: string; note: string } }>();
    expect(after!.access.note).toBe(first.note);
    expect(after!.access.source).toBe('manual');
    expect(after!.access.granted_at.getTime()).toBe(grantedAt.getTime());
    // Flagged, matched to the account so it is not read as unmatched, and named for a refund.
    const paid = await Payment.findById(payment._id).lean<{ student_id: unknown; note: string }>();
    expect(String(paid!.student_id)).toBe(String(student._id));
    expect(paid!.note).toContain('duplicate');
    expect(paid!.note).toContain(first.note);
    const f = await Fulfilment.findOne({ payment_id: payment._id }).lean<{ status: string; reason: string }>();
    expect(f!.status).toBe('duplicate');
    expect(f!.reason).toBe(`already had access for ${SITTING}`);
    expect(sent).toHaveLength(0);
  }, 60000);

  it('paying twice leaves one grant, the first one', async () => {
    const { grantFromPayment } = await import('@/lib/grant-from-payment');
    const { Payment, Student } = await import('@/lib/db');
    const { student, payment } = await setup(null, 'evt_one');
    await grantFromPayment({ studentId: student._id, registeredSitting: SITTING, payment: { _id: payment._id, event_id: 'evt_one' } });
    const once = await Student.findById(student._id).lean<{ access: { note: string; granted_at: Date } }>();

    const second = await Payment.create({ event_id: 'evt_two', email: student.email, received_at: new Date() });
    const outcome = await grantFromPayment({ studentId: student._id, registeredSitting: SITTING, payment: { _id: second._id, event_id: 'evt_two' } });

    expect(outcome).toBe('duplicate');
    const twice = await Student.findById(student._id).lean<{ access: { note: string; granted_at: Date } }>();
    expect(twice!.access.note).toBe(once!.access.note);
    expect(twice!.access.note).toContain('evt_one');
    expect(twice!.access.note).not.toContain('evt_two');
    expect(twice!.access.granted_at.getTime()).toBe(once!.access.granted_at.getTime());
    expect(sent).toHaveLength(1);
  }, 60000);

  // The branch keys on THIS PAYMENT'S sitting having no live grant, never on
  // the account's grant being the most recent or expired: a student who enters
  // for another sitting can hold a live grant for one and pay for another.
  it('grants when the live grant they have is for another sitting, keeping what it said', async () => {
    const { grantFromPayment } = await import('@/lib/grant-from-payment');
    const { Student } = await import('@/lib/db');
    const { hasAccess } = await import('@/lib/access');
    const live = { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'comp · pilot · 3 of 8' };
    expect(hasAccess(live), 'the grant they hold is live').toBe(true);
    const { student, payment } = await setup(live, 'evt_other');

    const outcome = await grantFromPayment({
      studentId: student._id,
      registeredSitting: 'jan-2028',
      payment: { _id: payment._id, event_id: 'evt_other' },
    });

    expect(outcome).toBe('granted');
    const after = await Student.findById(student._id).lean<{ access: { sitting: string; note: string } }>();
    expect(after!.access.sitting).toBe('jan-2028');
    // One grant per account: the live one it replaced is readable only in the note.
    expect(after!.access.note).toContain('was may-june-2027 manual: comp · pilot · 3 of 8');
    expect(sent).toHaveLength(1);
  }, 60000);

  it('grants when the grant they have is for a sitting that has passed, keeping what it said', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2028-06-01T00:00:00Z'));
    const { grantFromPayment } = await import('@/lib/grant-from-payment');
    const { Student } = await import('@/lib/db');
    const old = { sitting: 'jan-2027', granted_at: new Date('2026-11-01T00:00:00Z'), source: 'manual', note: 'comp · pilot · 3 of 8' };
    const { student, payment } = await setup(old, 'evt_expired');

    const outcome = await grantFromPayment({
      studentId: student._id,
      registeredSitting: 'jan-2027',
      payment: { _id: payment._id, event_id: 'evt_expired' },
    });

    expect(outcome).toBe('granted');
    const after = await Student.findById(student._id).lean<{ access: { sitting: string; source: string; note: string } }>();
    expect(after!.access.sitting).toBe('jan-2027');
    expect(after!.access.source).toBe('stripe');
    expect(after!.access.note).toContain('stripe evt_expired');
    // The grant it replaced is still readable in the note it wrote.
    expect(after!.access.note).toContain('comp · pilot · 3 of 8');
    expect(sent).toHaveLength(1);
  }, 60000);
});
