import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { REFUND_DAYS } from '@/lib/access';
import { reasonWithWindow } from '@/lib/refund';
import { dashboardUrl, windowOf } from '@/lib/payment-queue';

// ROUND_12 Task 4. What an operator sees and what they can do about it.
vi.mock('@/lib/email', async (orig) => ({
  ...(await orig<typeof import('@/lib/email')>()),
  sendEmail: async () => ({ ok: true }),
}));
vi.mock('next/cache', () => ({ revalidatePath() {} }));
vi.mock('next/navigation', async (orig) => ({
  ...(await orig<typeof import('next/navigation')>()),
  redirect: (url: string) => { throw new Error(`REDIRECT ${url}`); },
}));
vi.mock('@/lib/auth/session', () => ({ requireAdmin: async () => ({ student_id: 'a', email: 'ops@example.com', role: 'admin' }) }));

const SITTING = 'may-june-2027';
const DAY = 86_400_000;
let mongod: MongoMemoryReplSet;
beforeAll(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongod.getUri();
  process.env.STRIPE_SECRET_KEY = 'sk_test_operator';
}, 180000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});
beforeEach(async () => {
  const { dbConnect, Payment, Student } = await import('@/lib/db');
  await dbConnect();
  await Promise.all([Student.deleteMany({}), Payment.deleteMany({})]);
});

async function payment(over: Record<string, unknown> = {}) {
  const { Payment } = await import('@/lib/db');
  const { transition } = await import('@/lib/payment-state');
  return Payment.create({
    event_id: `evt_${Math.random().toString(36).slice(2, 8)}`,
    session_id: `cs_${Math.random().toString(36).slice(2, 8)}`,
    payment_intent_id: 'pi_row',
    amount_total: 4900,
    currency: 'usd',
    paid_at: new Date(Date.now() - 2 * DAY),
    received_at: new Date(),
    ...transition('granted'),
    ...over,
  });
}
async function student(email: string, access?: Record<string, unknown>) {
  const { Student } = await import('@/lib/db');
  return Student.create({ email, name: 'Kiara', exam_sitting: SITTING, target_modules: [1, 2, 3], password_hash: 'x', syllabus_mode: 'modular-2027', ...(access ? { access } : {}) });
}
const screen = async () => {
  const { default: AccessPage } = await import('@/app/admin/access/page');
  const html = renderToStaticMarkup(await AccessPage({ searchParams: Promise.resolve({}) }));
  return { html, text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
};
const queue = async () => {
  const { PaymentQueue } = await import('@/app/admin/access/payment-queue');
  const { loadQueue } = await import('@/lib/payment-queue');
  const html = renderToStaticMarkup(createElement(PaymentQueue, { rows: await loadQueue() }));
  return { html, text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
};

describe('a student with a live paid grant', () => {
  it('carries Refund and revoke, with a required reason and what will happen', async () => {
    const p = await payment();
    await student('kiara@example.com', { sitting: SITTING, granted_at: new Date(), source: 'stripe', note: 'stripe evt_1', payment_id: p._id });
    const { html, text } = await screen();

    expect(text).toContain('The money goes back, access ends now, and their work stays.');
    // A server action is not serialized into static markup: the form is found by what it holds.
    expect(html).toMatch(/<form[^>]*>(?:(?!<\/form>)[\s\S])*Refund and revoke/);
    expect(html).toMatch(/<input required="" minLength="3"[^>]*name="reason"/);
    // The row says how old the money is, against the window.
    expect(text).toContain('Paid 2 days ago');
    // And links to the payment itself, in the mode this key belongs to.
    expect(html).toContain(`href="https://dashboard.stripe.com/test/payments/pi_row"`);
  }, 60000);

  it('past the window it still refunds, and says the record will note it', async () => {
    const p = await payment({ paid_at: new Date(Date.now() - (REFUND_DAYS + 6) * DAY) });
    await student('late@example.com', { sitting: SITTING, granted_at: new Date(), source: 'stripe', note: 'stripe evt_1', payment_id: p._id });
    const { html, text } = await screen();

    expect(text).toContain(`past the ${REFUND_DAYS}-day window`);
    // The control is still there: the window is a policy, not a lock.
    expect(html).toContain('Refund and revoke');
    // And the record really does say so.
    expect(reasonWithWindow('asked late', new Date(Date.now() - (REFUND_DAYS + 6) * DAY))).toContain(`past the ${REFUND_DAYS}-day window`);
    expect(reasonWithWindow('asked in time', new Date(Date.now() - 2 * DAY))).toBe('asked in time');
  }, 60000);
});

describe('a comp and a grant nobody can refund', () => {
  it('a comp carries Revoke alone, with a reason and no Stripe anywhere on it', async () => {
    await student('comp@example.com', { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'comp · teacher · st-marys' });
    const { html, text } = await screen();

    expect(html).toContain('>Revoke<');
    expect(text).not.toContain('The money goes back');
    expect(text).not.toContain('refund unavailable');
  }, 60000);

  // THE NOTE DECIDES, not the state of the payment collection. A teacher whose
  // school later bought a seat still holds a comp, and it still ends alone.
  it('a comp stays a comp on an account that has paid us', async () => {
    const s = await student('comp-and-paid@example.com', { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'comp · pilot · ms-allen · 2 of 5' });
    await payment({ student_id: s._id });
    const { html, text } = await screen();

    expect(html).toContain('>Revoke<');
    expect(text).not.toContain('refund unavailable');
  }, 60000);

  it('a paid grant with no payment reference says so, points at Stripe, and still offers Revoke', async () => {
    await student('unresolved@example.com', { sitting: SITTING, granted_at: new Date(), source: 'stripe', note: 'friend' });
    const { html, text } = await screen();

    expect(text).toContain('refund unavailable — no payment reference');
    expect(text).toContain('Refund it in the Stripe dashboard, then revoke here with the reason.');
    expect(text).not.toContain('The money goes back');
    // Access still has to be endable — but never on its own, which is what
    // read as a grant nobody had paid for.
    expect(html).toContain('>Revoke<');
  }, 60000);

  // THE ROW THIS WAS FOUND ON: granted by hand, note naming nothing, and two
  // payments on the account that no reference reaches. It used to render as a
  // comp — Revoke alone, as though no money had ever changed hands.
  it('a hand-granted row on an account that has paid reads as money we cannot reach', async () => {
    const s = await student('lost-link@example.com', { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'friend' });
    await payment({ student_id: s._id });
    const { html, text } = await screen();

    expect(text).toContain('refund unavailable — no payment reference');
    expect(html).toContain('>Revoke<');
    expect(html).toContain('href="https://dashboard.stripe.com/test/search?query=lost-link%40example.com"');
    expect(text).not.toContain('The money goes back');
  }, 60000);

  // The other half of the same rule: no note, and no money anywhere either.
  it('a hand-granted row on an account that never paid is revoked alone', async () => {
    await student('nothing-owed@example.com', { sitting: SITTING, granted_at: new Date(), source: 'manual', note: 'granted by hand' });
    const { html, text } = await screen();

    expect(html).toContain('>Revoke<');
    expect(text).not.toContain('refund unavailable');
  }, 60000);
});

describe('the queue', () => {
  it('gives a waiting or duplicate row a Refund that touches no grant', async () => {
    const { transition } = await import('@/lib/payment-state');
    await payment({ ...transition('waiting'), session_id: 'cs_w' });
    await payment({ ...transition('duplicate'), session_id: 'cs_d' });
    const { html, text } = await queue();

    expect((html.match(/Refund — money back, no grant touched/g) ?? [])).toHaveLength(2);
    expect(text).toContain('paid 2 days ago');
    expect((html.match(/dashboard\.stripe\.com/g) ?? []).length).toBe(2);
  }, 60000);

  it('gives an approved or failed refund what is known and one control', async () => {
    const { transition } = await import('@/lib/payment-state');
    await payment({ ...transition('refund_approved'), session_id: 'cs_a', refund_attempts: [{ key: 'k-abc', at: new Date(), outcome: 'unknown' }] });
    await payment({ ...transition('refund_failed', { reason: 'charge_already_refunded' }), session_id: 'cs_f', refund_attempts: [{ key: 'k-def', at: new Date(), outcome: 'failed' }] });
    const { html, text } = await queue();

    expect(text).toContain('Approved, and the outcome is not known');
    expect(text).toContain('cannot refund twice');
    expect(text).toContain('Attempt k-abc');
    expect(html).toContain('Finish the refund');
    expect(text).toContain('Stripe refused it');
    expect(text).toContain('charge_already_refunded');
    expect(html).toContain('Retry the refund');
    // One control each, and each demands a reason.
    expect((html.match(/name="reason"/g) ?? []).length).toBe(4); // finish/retry + close, per row
  }, 60000);

  it('is one row and one count per payment, whatever states it carries', async () => {
    const { transition } = await import('@/lib/payment-state');
    const { loadQueue } = await import('@/lib/payment-queue');
    await payment({ ...transition('refund_approved'), session_id: 'cs_one' });
    await payment({ ...transition('waiting'), session_id: 'cs_two' });

    const rows = await loadQueue();
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((r) => r.id)).size).toBe(2);
    const { html } = await queue();
    // The counter is the list, so a payment cannot be counted twice.
    expect(html).toContain('>2</span>');
    expect((html.match(/<li /g) ?? []).length).toBe(2);
  }, 60000);
});

describe('a refunded student', () => {
  it('stays on the paid list, marked revoked, with the reason, the operator and the date', async () => {
    const p = await payment({ ...(await import('@/lib/payment-state')).transition('refunded') });
    await student('gone@example.com', {
      sitting: SITTING,
      granted_at: new Date('2026-09-01'),
      source: 'stripe',
      note: 'stripe evt_1',
      payment_id: p._id,
      revoked_at: new Date('2026-09-09'),
      revoked_by: 'ops@example.com',
      revoked_reason: 'refunded, asked in the window',
    });
    const { text } = await screen();

    // Never silently absent: the paid list still holds them.
    expect(text).toMatch(/Paid access · 1/);
    expect(text).toContain('revoked · may-june-2027');
    expect(text).toContain('revoked 2026-09-09 by ops@example.com · refunded, asked in the window');
    // And no control offering to refund it again.
    expect(text).not.toContain('The money goes back');
  }, 60000);
});

describe('the helpers the rows read', () => {
  it('count days from paid_at and know the window', () => {
    expect(windowOf(null)).toBeNull();
    expect(windowOf(new Date(Date.now() - 3 * DAY))).toEqual({ days: 3, late: false });
    expect(windowOf(new Date(Date.now() - REFUND_DAYS * DAY))).toEqual({ days: REFUND_DAYS, late: false });
    expect(windowOf(new Date(Date.now() - (REFUND_DAYS + 1) * DAY))).toEqual({ days: REFUND_DAYS + 1, late: true });
  });
  it('point at the dashboard in the mode the key belongs to', () => {
    expect(dashboardUrl(null)).toBeNull();
    expect(dashboardUrl('pi_1')).toBe('https://dashboard.stripe.com/test/payments/pi_1');
  });
});
