import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHmac } from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { NO_STUDENT_EMAIL, STUDENT_EMAIL_FIELD, emailFromSession } from '@/lib/stripe-webhook';

// ROUND_11 Task 3. The student's address comes from the field that asks for
// it, by key. The payer's receipt address is not a fallback and not a field:
// the payer is often not the student, and granting to them created the
// account under the wrong person while looking like success.
vi.mock('@/lib/email', () => ({
  sendEmail: async () => ({ ok: true }),
  accessEmail: () => ({ subject: 's', html: 'h', text: 't' }),
  SENDER: 'ExtraLesson <x@y.test>',
}));

const SECRET = 'whsec_field_test';
let mongod: MongoMemoryReplSet;
beforeAll(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongod.getUri();
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
}, 120000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});
beforeEach(async () => {
  const { dbConnect, Payment, Student, StripeEvent } = await import('@/lib/db');
  await dbConnect();
  await Promise.all([Student.deleteMany({}), Payment.deleteMany({}), StripeEvent.deleteMany({})]);
});

/** A session as Stripe sends one: the named field, and the payer's own address beside it. */
function sessionBody(args: { id: string; sessionId: string; field?: string | null; payer?: string; paid?: boolean; otherFields?: { key: string; value: string }[] }) {
  const custom_fields = [
    ...(args.otherFields ?? []).map((f) => ({ key: f.key, type: 'text', text: { value: f.value } })),
    ...(args.field === undefined ? [] : args.field === null ? [{ key: STUDENT_EMAIL_FIELD, type: 'text', text: {} }] : [{ key: STUDENT_EMAIL_FIELD, type: 'text', text: { value: args.field } }]),
  ];
  return JSON.stringify({
    id: args.id,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: args.sessionId,
        mode: 'payment',
        payment_status: args.paid === false ? 'unpaid' : 'paid',
        amount_total: 4900,
        currency: 'usd',
        custom_fields,
        customer_details: { email: args.payer ?? 'aunt@example.com' },
        metadata: { product: 'extralesson' },
      },
    },
  });
}
const deliver = async (body: string) => {
  const { POST } = await import('@/app/api/stripe/webhook/route');
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac('sha256', SECRET).update(`${t}.${body}`).digest('hex');
  return POST(new Request('https://extralesson.test/api/stripe/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': `t=${t},v1=${v1}` },
    body,
  }));
};
async function student(email: string) {
  const { Student } = await import('@/lib/db');
  return Student.create({ email, name: 'Kiara', exam_sitting: 'may-june-2027', target_modules: [1, 2, 3], password_hash: 'x', syllabus_mode: 'modular-2027' });
}
const paymentOf = async (eventId: string) => {
  const { Payment } = await import('@/lib/db');
  return (await Payment.findOne({ event_id: eventId }).lean<{ email?: string; state: string; state_reason?: string; student_id?: unknown }>())!;
};
const accessOf = async (email: string) => {
  const { Student } = await import('@/lib/db');
  return (await Student.findOne({ email }).lean<{ access?: { sitting: string; note: string } }>())?.access ?? null;
};

describe('reading the field', () => {
  it('takes the named field by its key, whatever else the session carries', () => {
    expect(emailFromSession({ custom_fields: [{ key: 'somethingelse', text: { value: 'wrong@example.com' } }, { key: STUDENT_EMAIL_FIELD, text: { value: ' Kiara@Example.COM ' } }] })).toBe('kiara@example.com');
  });
  it('never takes another field that merely contains an address, and never the payer', () => {
    expect(emailFromSession({ custom_fields: [{ key: 'referredby', text: { value: 'teacher@example.com' } }], customer_details: { email: 'aunt@example.com' } })).toBeNull();
    expect(emailFromSession({ customer_details: { email: 'aunt@example.com' } })).toBeNull();
  });
  it('refuses blank and malformed values', () => {
    for (const value of ['', '   ', 'kiara', 'kiara@', '@example.com', 'kiara example.com', 'kiara@@example.com']) {
      expect(emailFromSession({ custom_fields: [{ key: STUDENT_EMAIL_FIELD, text: { value } }] }), value).toBeNull();
    }
  });
});

describe('a paid session', () => {
  it('grants to the address in the named field, not to the payer', async () => {
    const s = await student('kiara@example.com');
    await student('aunt@example.com');
    await deliver(sessionBody({ id: 'evt_named', sessionId: 'cs_named', field: 'kiara@example.com', payer: 'aunt@example.com' }));

    const p = await paymentOf('evt_named');
    expect(p.email).toBe('kiara@example.com');
    expect(p.state).toBe('granted');
    expect(String(p.student_id)).toBe(String(s._id));
    expect((await accessOf('kiara@example.com'))!.sitting).toBe('may-june-2027');
    expect(await accessOf('aunt@example.com')).toBeNull();
  }, 60000);

  it('waits with the reason when the field is missing, blank or malformed — and grants nobody', async () => {
    await student('aunt@example.com');
    const cases = [
      { id: 'evt_absent', sessionId: 'cs_absent', field: undefined },
      { id: 'evt_blank', sessionId: 'cs_blank', field: null },
      { id: 'evt_spaces', sessionId: 'cs_spaces', field: '   ' },
      { id: 'evt_broken', sessionId: 'cs_broken', field: 'kiara(at)example.com' },
    ] as const;
    for (const c of cases) {
      await deliver(sessionBody({ ...c, payer: 'aunt@example.com' }));
      const p = await paymentOf(c.id);
      expect(p.state, c.id).toBe('waiting');
      expect(p.state_reason, c.id).toBe(NO_STUDENT_EMAIL);
      expect(p.email ?? null, c.id).toBeNull();
      expect(p.student_id ?? null, c.id).toBeNull();
    }
    // The payer's own account is never the one that gets it.
    expect(await accessOf('aunt@example.com')).toBeNull();
  }, 60000);

  it('waits with the other reason when the address is valid but nobody has that account', async () => {
    await deliver(sessionBody({ id: 'evt_typo', sessionId: 'cs_typo', field: 'nobody@example.com' }));
    const p = await paymentOf('evt_typo');
    expect(p.state).toBe('waiting');
    expect(p.state_reason).toBe('no account for the paying address');
    expect(p.email).toBe('nobody@example.com');
  }, 60000);
});

describe('an unpaid session', () => {
  it('is pending, not waiting, whatever its student field says', async () => {
    await deliver(sessionBody({ id: 'evt_unpaid', sessionId: 'cs_unpaid', field: undefined, paid: false }));
    const p = await paymentOf('evt_unpaid');
    expect(p.state).toBe('pending');
    expect(p.student_id ?? null).toBeNull();
  }, 60000);

  it('is pending even with a valid field and an account waiting for it', async () => {
    await student('kiara@example.com');
    await deliver(sessionBody({ id: 'evt_unpaid2', sessionId: 'cs_unpaid2', field: 'kiara@example.com', paid: false }));
    expect((await paymentOf('evt_unpaid2')).state).toBe('pending');
    expect(await accessOf('kiara@example.com')).toBeNull();
  }, 60000);

  it('never reaches the operator as a payment with no matching account', async () => {
    await deliver(sessionBody({ id: 'evt_unpaid3', sessionId: 'cs_unpaid3', field: undefined, paid: false }));
    const { default: AccessPage } = await import('@/app/admin/access/page');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(await AccessPage({ searchParams: Promise.resolve({}) }));
    expect(html).not.toContain('evt_unpaid3');
  }, 60000);
});

describe('the fallback is gone, not merely unused', () => {
  const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
  it('leaves no email_source and no payer-address note anywhere', () => {
    for (const f of [['lib', 'stripe-webhook.ts'], ['lib', 'db', 'payment.ts'], ['lib', 'claim.ts'], ['app', 'api', 'stripe', 'webhook', 'route.ts'], ['app', 'admin', 'access', 'actions.ts']]) {
      expect(at(...f), f.join('/')).not.toMatch(/email_source|EmailSource|payer address/);
    }
    expect(at('lib', 'stripe-webhook.ts')).not.toMatch(/customer_details/);
  });
});
