import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Set before the modules under test are imported: the route reads
// STRIPE_WEBHOOK_SECRET at call time, but dbConnect caches on MONGODB_URI.
let mongod: MongoMemoryServer;
const SECRET = 'whsec_ordering_test';

const REGISTERED = 'may-june-2027';
const OTHER_SITTING = 'jan-2027';

/** A genuinely signed delivery, built the way Stripe builds one. */
function signed(body: string, secret = SECRET, skewSeconds = 0) {
  const t = Math.floor(Date.now() / 1000) + skewSeconds;
  const v1 = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
  return new Request('https://extralesson.test/api/stripe/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': `t=${t},v1=${v1}` },
    body,
  });
}

function checkoutBody(args: {
  id: string;
  studentField?: string;
  payerEmail?: string;
  link?: string;
  type?: string;
  mode?: string;
  payment_status?: string;
}) {
  const custom_fields = args.studentField ? [{ text: { value: args.studentField } }] : [];
  return JSON.stringify({
    id: args.id,
    type: args.type ?? 'checkout.session.completed',
    data: {
      object: {
        id: `cs_${args.id}`,
        payment_link: args.link ?? 'plink_founding',
        mode: args.mode ?? 'payment',
        payment_status: args.payment_status ?? 'paid',
        amount_total: 2500,
        currency: 'usd',
        custom_fields,
        customer_details: args.payerEmail ? { email: args.payerEmail } : {},
      },
    },
  });
}

let POST: (req: Request) => Promise<Response>;
let Student: typeof import('@/lib/db').Student;
let Payment: typeof import('@/lib/db').Payment;
let grantFromPayment: typeof import('@/lib/grant-from-payment').grantFromPayment;
let pendingPaymentFor: typeof import('@/lib/grant-from-payment').pendingPaymentFor;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  // Mapped links are EVIDENCE only. One is mapped here, deliberately
  // disagreeing with the registration, so the note can be asserted.
  process.env.STRIPE_LINK_SITTINGS = `plink_january=${OTHER_SITTING}`;
  // Ours, and only ours: the account is shared with other Anansi products.
  process.env.STRIPE_PAYMENT_LINKS = 'plink_founding, plink_january';
  await mongoose.connect(process.env.MONGODB_URI);
  ({ POST } = await import('@/app/api/stripe/webhook/route'));
  ({ Student, Payment } = await import('@/lib/db'));
  ({ grantFromPayment, pendingPaymentFor } = await import('@/lib/grant-from-payment'));
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Student.deleteMany({});
  await Payment.deleteMany({});
});

const makeStudent = (email: string, sitting = REGISTERED) =>
  Student.create({
    email,
    name: 'Test Student',
    exam_sitting: sitting,
    syllabus_mode: sitting === 'jan-2027' ? 'legacy-jan' : 'modular-2027',
    target_modules: [1, 2, 3],
    password_hash: 'scrypt$x$y',
  });

const accessOf = async (email: string) =>
  (
    await Student.findOne({ email }).lean<{
      access?: { sitting: string; source: string; note: string; granted_at: Date };
    }>()
  )?.access;

/**
 * REGISTRATION, minus the parts a test cannot have. register() sets a session
 * cookie and redirects, both of which need a request scope; this is the same
 * two calls it makes, in the same order, and the source assertion at the bottom
 * of this file is what keeps the two in step.
 */
async function registerAndClaim(email: string, sitting = REGISTERED) {
  const student = await makeStudent(email, sitting);
  const pending = await pendingPaymentFor(email);
  if (pending) {
    await grantFromPayment({
      studentId: student._id,
      registeredSitting: sitting as 'may-june-2027' | 'jan-2027',
      payment: pending,
    });
  }
  return student;
}

describe('1. pay first, then register', () => {
  it('records the payment unmatched, then grants when the account arrives', async () => {
    const email = 'pay-first@test.invalid';
    const res = await POST(signed(checkoutBody({ id: 'evt_1', studentField: email })));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ matched: false });
    const before = await Payment.findOne({ event_id: 'evt_1' }).lean<{ student_id?: unknown }>();
    expect(before?.student_id ?? null).toBeNull();

    await registerAndClaim(email);

    expect((await accessOf(email))?.sitting).toBe(REGISTERED);
    expect((await accessOf(email))?.source).toBe('stripe');
    const after = await Payment.findOne({ event_id: 'evt_1' }).lean<{ student_id?: unknown }>();
    expect(after?.student_id).toBeTruthy();
  });
});

describe('2. register first, then pay', () => {
  it('grants inside the webhook, with no account creation involved', async () => {
    const email = 'register-first@test.invalid';
    await makeStudent(email);
    expect(await accessOf(email)).toBeUndefined();

    const res = await POST(signed(checkoutBody({ id: 'evt_2', studentField: email })));

    expect(await res.json()).toEqual({ matched: true });
    expect((await accessOf(email))?.sitting).toBe(REGISTERED);
    const paid = await Payment.findOne({ event_id: 'evt_2' }).lean<{ student_id?: unknown }>();
    expect(paid?.student_id).toBeTruthy();
  });
});

describe('3. the custom field beats the payer address', () => {
  it('grants the STUDENT, not the person holding the card', async () => {
    // §8e with a real victim: an aunt pays for her nephew. If the payer address
    // won, she would get the account and he would get nothing.
    const student = 'nephew@test.invalid';
    const payer = 'aunt@test.invalid';
    await makeStudent(student);
    await makeStudent(payer);

    await POST(signed(checkoutBody({ id: 'evt_3', studentField: student, payerEmail: payer })));

    expect((await accessOf(student))?.sitting).toBe(REGISTERED);
    expect(await accessOf(payer)).toBeUndefined();
  });
});

describe('4. no custom field falls back to the payer address', () => {
  it('grants on the receipt address — correct, and why the Stripe field must be Required', async () => {
    const payer = 'payer-only@test.invalid';
    await makeStudent(payer);

    await POST(signed(checkoutBody({ id: 'evt_4', payerEmail: payer })));

    expect((await accessOf(payer))?.sitting).toBe(REGISTERED);
  });

  it('says in the note that it used the payer address', async () => {
    // Tolerated, not desired. With the field Required this can only fire on a
    // misconfiguration, so it has to be visible on /admin/access after the
    // FIRST sale rather than the twentieth.
    const payer = 'payer-noted@test.invalid';
    await makeStudent(payer);

    await POST(signed(checkoutBody({ id: 'evt_4b', payerEmail: payer })));

    expect((await accessOf(payer))?.note).toContain('payer address, no student field');
  });

  it('says nothing of the sort when the student field was used', async () => {
    const email = 'clean-match@test.invalid';
    await makeStudent(email);
    await POST(signed(checkoutBody({ id: 'evt_4c', studentField: email, payerEmail: 'other@test.invalid' })));
    expect((await accessOf(email))?.note).not.toContain('payer address');
  });
});

describe('5. the sitting comes from the registration, never the link', () => {
  it('grants the registered sitting when a mapped link disagrees, and records the disagreement', async () => {
    // Granting January to a May/June candidate would lock them out in February,
    // before the paper they are revising for. Only one way of being wrong costs
    // a student their sitting.
    const email = 'link-disagrees@test.invalid';
    await makeStudent(email, REGISTERED);

    await POST(signed(checkoutBody({ id: 'evt_5', studentField: email, link: 'plink_january' })));

    const access = await accessOf(email);
    expect(access?.sitting).toBe(REGISTERED);
    expect(access?.note).toContain(`link says ${OTHER_SITTING}`);
  });

  it('says nothing about the link when there is nothing to disagree about', async () => {
    const email = 'link-unmapped@test.invalid';
    await makeStudent(email, REGISTERED);
    await POST(signed(checkoutBody({ id: 'evt_5b', studentField: email, link: 'plink_founding' })));
    expect((await accessOf(email))?.note).not.toContain('link says');
  });

  it('holds through the pay-first ordering too', async () => {
    const email = 'link-disagrees-order-a@test.invalid';
    await POST(signed(checkoutBody({ id: 'evt_5c', studentField: email, link: 'plink_january' })));
    await registerAndClaim(email, REGISTERED);
    const access = await accessOf(email);
    expect(access?.sitting).toBe(REGISTERED);
    expect(access?.note).toContain(`link says ${OTHER_SITTING}`);
  });
});

describe('6. a typo stays unmatched', () => {
  it('records the payment for /admin/access rather than dropping it', async () => {
    const res = await POST(signed(checkoutBody({ id: 'evt_6', studentField: 'typo@test.invalid' })));

    expect(await res.json()).toEqual({ matched: false });
    const unmatched = await Payment.find({ student_id: null, resolved_at: null }).lean<
      { email: string; amount_total?: number; received_at: Date }[]
    >();
    expect(unmatched).toHaveLength(1);
    // The admin screen resolves these by hand, so it needs enough to do it.
    expect(unmatched[0].email).toBe('typo@test.invalid');
    expect(unmatched[0].amount_total).toBe(2500);
    expect(unmatched[0].received_at).toBeInstanceOf(Date);
  });
});

describe('7. a Stripe retry does not grant twice', () => {
  it('recognises the event id and reports the duplicate', async () => {
    const email = 'retry@test.invalid';
    await makeStudent(email);
    const body = checkoutBody({ id: 'evt_7', studentField: email });

    const first = await POST(signed(body));
    const granted = (await accessOf(email))!.granted_at;
    const second = await POST(signed(body));

    expect(await first.json()).toEqual({ matched: true });
    expect(await second.json()).toEqual({ duplicate: true });
    expect(await Payment.countDocuments({ event_id: 'evt_7' })).toBe(1);
    // Not re-granted: the timestamp is the one from the first delivery.
    expect(new Date((await accessOf(email))!.granted_at).getTime()).toBe(new Date(granted).getTime());
  });
});

describe('8. the oldest waiting payment is taken', () => {
  it('claims the first, and leaves a double charge to be looked at', async () => {
    const email = 'paid-twice@test.invalid';
    await POST(signed(checkoutBody({ id: 'evt_8_first', studentField: email })));
    await POST(signed(checkoutBody({ id: 'evt_8_second', studentField: email })));

    await registerAndClaim(email);

    const first = await Payment.findOne({ event_id: 'evt_8_first' }).lean<{ student_id?: unknown }>();
    const second = await Payment.findOne({ event_id: 'evt_8_second' }).lean<{ student_id?: unknown }>();
    expect(first?.student_id).toBeTruthy();
    expect(second?.student_id ?? null).toBeNull();
    // A double charge is exactly the case a person should see.
    expect(await Payment.countDocuments({ student_id: null, resolved_at: null })).toBe(1);
  });
});

describe('9. a resolved payment is not re-taken', () => {
  it('leaves a payment an admin has already dealt with alone', async () => {
    const email = 'already-resolved@test.invalid';
    await POST(signed(checkoutBody({ id: 'evt_9', studentField: email })));
    await Payment.updateOne({ event_id: 'evt_9' }, { $set: { resolved_at: new Date() } });

    expect(await pendingPaymentFor(email)).toBeNull();
    await registerAndClaim(email);
    expect(await accessOf(email)).toBeUndefined();
  });
});

describe('10. a bad signature records nothing', () => {
  it('rejects a body signed with another secret', async () => {
    const email = 'forged@test.invalid';
    await makeStudent(email);

    const res = await POST(signed(checkoutBody({ id: 'evt_10', studentField: email }), 'whsec_wrong'));

    expect(res.status).toBe(400);
    expect(await Payment.countDocuments()).toBe(0);
    expect(await accessOf(email)).toBeUndefined();
  });

  it('rejects a replay outside the tolerance, and a tampered body', async () => {
    const email = 'replayed@test.invalid';
    await makeStudent(email);
    const body = checkoutBody({ id: 'evt_10b', studentField: email });

    expect((await POST(signed(body, SECRET, -600))).status).toBe(400);

    const req = signed(body);
    const tampered = new Request(req.url, {
      method: 'POST',
      headers: req.headers,
      body: body.replace('evt_10b', 'evt_10c'),
    });
    expect((await POST(tampered)).status).toBe(400);
    expect(await Payment.countDocuments()).toBe(0);
  });
});

describe('11. a payment for another Anansi product is not ours (ROUND_6 Task 2)', () => {
  it('acknowledges a Cognicare session and grants nothing, writing nothing', async () => {
    const email = 'cognicare-buyer@test.invalid';
    await makeStudent(email);
    const res = await POST(signed(checkoutBody({ id: 'evt_11', studentField: email, link: 'plink_cognicare' })));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ refused: 'link-not-ours' });
    expect(await accessOf(email)).toBeUndefined();
    expect(await Payment.countDocuments()).toBe(0);
  });

  it('refuses a session that is not in payment mode, or carries no link', async () => {
    const email = 'subscription@test.invalid';
    await makeStudent(email);
    expect(await (await POST(signed(checkoutBody({ id: 'evt_11b', studentField: email, mode: 'subscription' })))).json()).toEqual({ refused: 'not-payment-mode' });
    const noLink = JSON.parse(checkoutBody({ id: 'evt_11c', studentField: email }));
    delete noLink.data.object.payment_link;
    expect(await (await POST(signed(JSON.stringify(noLink)))).json()).toEqual({ refused: 'no-link' });
    expect(await accessOf(email)).toBeUndefined();
    expect(await Payment.countDocuments()).toBe(0);
  });

  it('holds a delayed payment until Stripe says it is paid', async () => {
    const email = 'bank-transfer@test.invalid';
    await makeStudent(email);
    const completed = await POST(signed(checkoutBody({ id: 'evt_11d', studentField: email, payment_status: 'unpaid' })));
    expect(await completed.json()).toEqual({ refused: 'not-paid' });
    expect(await accessOf(email)).toBeUndefined();

    const paid = await POST(
      signed(checkoutBody({ id: 'evt_11e', studentField: email, type: 'checkout.session.async_payment_succeeded', payment_status: 'paid' })),
    );
    expect(await paid.json()).toEqual({ matched: true });
    expect((await accessOf(email))?.sitting).toBe(REGISTERED);
  });
});

// THE ONLY SOURCE ASSERTION PERMITTED IN THIS FILE (ROUND_3 §4).
//
// register() sets a session cookie and redirects, both of which need a request
// scope, so it cannot be called here. registerAndClaim above performs the same
// two calls in the same order; this is what keeps that stand-in honest.
describe('register() still performs the claim this file simulates', () => {
  it('calls pendingPaymentFor and grantFromPayment', () => {
    const src = readFileSync(join(process.cwd(), 'app', 'study', 'login', 'actions.ts'), 'utf8');
    expect(src).toContain('pendingPaymentFor');
    expect(src).toContain('grantFromPayment');
  });
});
