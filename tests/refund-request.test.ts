import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { REFUND_DAYS } from '@/lib/access';

// ROUND_12 Task 5. Asking is one tap; deciding is a person. Nothing here
// returns money on its own.
vi.mock('@/lib/email', async (orig) => ({
  ...(await orig<typeof import('@/lib/email')>()),
  sendEmail: async () => ({ ok: true }),
}));
vi.mock('next/cache', () => ({ revalidatePath() {} }));
vi.mock('next/navigation', async (orig) => ({
  ...(await orig<typeof import('next/navigation')>()),
  redirect: (url: string) => { throw new Error(`REDIRECT ${url}`); },
  // The chrome renders the tabs, which read the path they are on.
  usePathname: () => '/study',
  useRouter: () => ({ refresh() {}, push() {} }),
}));
let VIEWER = 'nobody';
vi.mock('@/lib/auth/session', () => ({
  requireAdmin: async () => ({ student_id: 'a', email: 'ops@example.com', role: 'admin' }),
  requireSession: async () => ({ student_id: VIEWER, email: 'kiara@example.com', role: 'student' }),
}));

const SITTING = 'may-june-2027';
const DAY = 86_400_000;
const OPERATOR = { email: 'ops@example.com' };
let mongod: MongoMemoryReplSet;
beforeAll(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongod.getUri();
  process.env.STRIPE_SECRET_KEY = 'sk_test_request';
}, 180000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});
beforeEach(async () => {
  const { dbConnect, Payment, RefundRequest, Student } = await import('@/lib/db');
  await dbConnect();
  await Promise.all([Student.deleteMany({}), Payment.deleteMany({}), RefundRequest.deleteMany({})]);
  await RefundRequest.syncIndexes();
});

async function payment(over: Record<string, unknown> = {}) {
  const { Payment } = await import('@/lib/db');
  const { transition } = await import('@/lib/payment-state');
  return Payment.create({
    event_id: `evt_${Math.random().toString(36).slice(2, 8)}`,
    session_id: `cs_${Math.random().toString(36).slice(2, 8)}`,
    payment_intent_id: 'pi_req',
    amount_total: 4900,
    currency: 'usd',
    paid_at: new Date(Date.now() - 3 * DAY),
    received_at: new Date(),
    ...transition('granted'),
    ...over,
  });
}
async function student(email: string, access?: Record<string, unknown>) {
  const { Student } = await import('@/lib/db');
  return Student.create({ email, name: 'Kiara', exam_sitting: SITTING, target_modules: [1, 2, 3], password_hash: 'x', syllabus_mode: 'modular-2027', ...(access ? { access } : {}) });
}
/** A paid student, their payment, and the grant that binds them. */
async function paidStudent(email = 'kiara@example.com') {
  const p = await payment();
  const s = await student(email, { sitting: SITTING, granted_at: new Date(), source: 'stripe', note: 'stripe evt_1', payment_id: p._id });
  await (await import('@/lib/db')).Payment.updateOne({ _id: p._id }, { $set: { student_id: s._id } });
  return { payment: p, student: s };
}
const requests = async () => {
  const { RefundRequest } = await import('@/lib/db');
  return RefundRequest.find({}).lean<{ payment_id: unknown; student_id: unknown; state: string; resolved_by?: string; resolution_reason?: string; asked_at: Date }[]>();
};
const queue = async () => {
  const { PaymentQueue } = await import('@/app/admin/access/payment-queue');
  const { loadQueue } = await import('@/lib/payment-queue');
  const rows = await loadQueue();
  const html = renderToStaticMarkup(createElement(PaymentQueue, { rows }));
  return { rows, html, text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
};
const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

describe('asking', () => {
  it('writes the request and hands back a prefilled mail to the help address', async () => {
    const { requestRefund } = await import('@/app/study/actions');
    const { LANDING } = await import('@/lib/landing-content');
    const { payment: p, student: s } = await paidStudent();
    VIEWER = String(s._id);

    const res = await requestRefund(String(p._id));
    expect(res.ok).toBe(true);
    expect(res.mailto).toContain(`mailto:${LANDING.contactEmail}`);
    expect(res.mailto).toContain('subject=Refund%20request');
    // The explanation is optional: the policy says no questions asked.
    expect(decodeURIComponent(res.mailto!)).toContain('You do not have to.');

    const rows = await requests();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ state: 'open' });
    expect(String(rows[0].payment_id)).toBe(String(p._id));
    expect(String(rows[0].student_id)).toBe(String(s._id));
  }, 60000);

  it('is one request however many times it is tapped', async () => {
    const { requestRefund } = await import('@/app/study/actions');
    const { payment: p, student: s } = await paidStudent();
    VIEWER = String(s._id);

    for (let i = 0; i < 3; i++) expect((await requestRefund(String(p._id))).ok).toBe(true);
    expect(await requests()).toHaveLength(1);
  }, 60000);

  it('is refused for somebody else’s payment, whatever the form says', async () => {
    const { requestRefund } = await import('@/app/study/actions');
    const { payment: theirs } = await paidStudent('theirs@example.com');
    const mine = await student('mine@example.com');
    VIEWER = String(mine._id);

    expect(await requestRefund(String(theirs._id))).toEqual({ ok: false });
    expect(await requests()).toHaveLength(0);
  }, 60000);
});

describe('where the tap lives', () => {
  const chrome = async (refundablePaymentId: string | null) => {
    const { StudyChrome } = await import('@/app/study/study-chrome');
    return renderToStaticMarkup(createElement(StudyChrome, { sitting: 'May/June 2027', current: SITTING, email: 'kiara@example.com', refundablePaymentId, children: null }));
  };

  it('is in the disclosure while the account holds a live paid grant', async () => {
    expect(await chrome('pay1')).toContain('Request a refund');
  });
  it('is absent for a comp, a revoked grant and no grant at all', async () => {
    // The layout passes null for each: a comp has no payment_id, and a revoked
    // grant does not read as access.
    expect(await chrome(null)).not.toContain('Request a refund');
    const layout = (await import('node:fs')).readFileSync((await import('node:path')).join(process.cwd(), 'app', 'study', 'layout.tsx'), 'utf8');
    expect(layout).toContain('hasAccess(student?.access) && student?.access?.payment_id');
  });
  it('a payer who is not the student has no disclosure, and no verified path was built', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
    // The request is written for the signed-in student's own payment, and there
    // is nothing anywhere that verifies a payer instead.
    expect(at('app', 'study', 'actions.ts')).toContain('Payment.findOne({ _id: paymentId, student_id: auth.student_id })');
    for (const f of [['app', 'welcome', 'welcome-view.tsx'], ['app', 'study', 'study-chrome.tsx']]) {
      expect(at(...f), f.join('/')).not.toMatch(/verifyPayer|payer_token|payerSession/);
    }
  });
});

describe('on the queue', () => {
  it('joins that payment’s single row, with the student, the amount and the window from when they asked', async () => {
    const { requestRefund } = await import('@/app/study/actions');
    const { RefundRequest } = await import('@/lib/db');
    const { payment: p, student: s } = await paidStudent();
    VIEWER = String(s._id);
    await requestRefund(String(p._id));
    // They asked five days after paying, which is what the row must count.
    await RefundRequest.updateOne({ payment_id: p._id }, { $set: { asked_at: new Date(Date.now() + 2 * DAY) } });

    const { rows, html, text } = await queue();
    // ONE ROW, ONE COUNT: a granted payment is only here because of the request.
    expect(rows).toHaveLength(1);
    expect(rows[0].state).toBe('granted');
    expect((html.match(/<li /g) ?? []).length).toBe(1);
    expect(html).toContain('>1</span>');

    expect(text).toContain('kiara@example.com asked for a refund on');
    expect(text).toContain('5 days after paying');
    expect(text).toContain('49.00 USD');
    expect(html).toContain('Refund and revoke');
    expect(html).toContain('Dismiss');
  }, 60000);

  it('counts from when they asked, not from when an operator got to it', async () => {
    const { requestRefund } = await import('@/app/study/actions');
    const { RefundRequest } = await import('@/lib/db');
    const { payment: p, student: s } = await paidStudent();
    VIEWER = String(s._id);
    await requestRefund(String(p._id));
    // Asked inside the window; an operator opens the screen long after.
    await RefundRequest.updateOne({ payment_id: p._id }, { $set: { asked_at: new Date(Date.now() - 3 * DAY + 2 * DAY) } });
    const { rows, text } = await queue();

    expect(rows[0].request!.days).toBe(2);
    expect(rows[0].request!.late).toBe(false);
    expect(text).not.toContain(`past the ${REFUND_DAYS}-day window`);
  }, 60000);

  it('a payment with an open request AND a refund state is still one row', async () => {
    const { requestRefund } = await import('@/app/study/actions');
    const { Payment } = await import('@/lib/db');
    const { transition } = await import('@/lib/payment-state');
    const { payment: p, student: s } = await paidStudent();
    VIEWER = String(s._id);
    await requestRefund(String(p._id));
    await Payment.updateOne({ _id: p._id }, { $set: transition('refund_failed', { reason: 'card_declined' }) });

    const { rows, html } = await queue();
    expect(rows).toHaveLength(1);
    expect((html.match(/<li /g) ?? []).length).toBe(1);
    expect(html).toContain('>1</span>');
  }, 60000);
});

describe('how a request ends', () => {
  it('resolves when the money actually goes back, and not before', async () => {
    const { requestRefund } = await import('@/app/study/actions');
    const { refundPayment } = await import('@/app/admin/access/actions');
    const { payment: p, student: s } = await paidStudent();
    VIEWER = String(s._id);
    await requestRefund(String(p._id));

    // Stripe refuses: the request stays outstanding, in front of a person.
    const { StripeError } = await import('@/lib/stripe-api');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => { throw new StripeError(400, 'card_declined', 'Declined.'); });
    await expect(refundPayment(form({ id: String(p._id), reason: 'asked' }))).rejects.toThrow(/REDIRECT/);
    expect((await requests())[0].state).toBe('open');
    vi.restoreAllMocks();

    // The retry succeeds, and only then does it close.
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => ({ ok: true, json: async () => ({ id: 're_1', amount: 4900, status: 'succeeded' }) } as Response));
    await expect(refundPayment(form({ id: String(p._id), reason: 'asked within the window' }))).rejects.toThrow(/REDIRECT/);
    const [row] = await requests();
    expect(row.state).toBe('resolved');
    expect(row.resolved_by).toBe('ops@example.com');
    expect(row.resolution_reason).toContain('refunded: asked within the window');
    vi.restoreAllMocks();
    void s;
  }, 60000);

  it('a dismissal closes it directly, with the reason kept, and refunds nothing', async () => {
    const { requestRefund } = await import('@/app/study/actions');
    const { dismissRequest } = await import('@/app/admin/access/actions');
    const { payment: p, student: s } = await paidStudent();
    VIEWER = String(s._id);
    await requestRefund(String(p._id));
    const calls: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => { calls.push(String(input)); return { ok: true, json: async () => ({}) } as Response; });

    await expect(dismissRequest(form({ id: String(p._id), reason: 'spoke to them, they are staying' }))).rejects.toThrow(/REDIRECT/);

    const [row] = await requests();
    expect(row.state).toBe('resolved');
    expect(row.resolution_reason).toBe('dismissed: spoke to them, they are staying');
    expect(calls).toHaveLength(0);
    // Nothing was refunded and nothing revoked.
    const { Payment, Student } = await import('@/lib/db');
    expect((await Payment.findById(p._id).lean<{ state: string }>())!.state).toBe('granted');
    expect((await Student.findById(s._id).lean<{ access: { revoked_at?: Date } }>())!.access.revoked_at ?? null).toBeNull();
    // The row is kept, resolved.
    expect(await requests()).toHaveLength(1);
    vi.restoreAllMocks();
  }, 60000);

  it('a dismissal without a reason writes nothing', async () => {
    const { requestRefund } = await import('@/app/study/actions');
    const { dismissRequest } = await import('@/app/admin/access/actions');
    const { payment: p, student: s } = await paidStudent();
    VIEWER = String(s._id);
    await requestRefund(String(p._id));

    await expect(dismissRequest(form({ id: String(p._id), reason: 'no' }))).rejects.toThrow(/REDIRECT/);
    expect((await requests())[0].state).toBe('open');
  }, 60000);
});

describe('erasure', () => {
  it('takes the request with the account, leaving the payment as the record', async () => {
    const { requestRefund } = await import('@/app/study/actions');
    const { deleteStudent } = await import('@/lib/delete-student');
    const { Payment } = await import('@/lib/db');
    const { payment: p, student: s } = await paidStudent('gone@example.com');
    VIEWER = String(s._id);
    await requestRefund(String(p._id));

    const res = await deleteStudent('gone@example.com');
    expect(res).toMatchObject({ ok: true });
    expect(await requests()).toHaveLength(0);
    // The money stays, stripped of the person.
    const kept = await Payment.findById(p._id).lean<{ student_id?: unknown; amount_total: number }>();
    expect(kept!.amount_total).toBe(4900);
    expect(kept!.student_id ?? null).toBeNull();
  }, 60000);
});
