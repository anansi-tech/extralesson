import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  REPLAY_TOLERANCE_S,
  emailFromSession,
  metadataOf,
  scopeOfSession,
  verifyStripeSignature,
} from '@/lib/stripe-webhook';

const SECRET = 'whsec_test_do_not_use_anywhere_real';
const body = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed', data: { object: {} } });
const sign = (raw: string, t: number, secret = SECRET) =>
  `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex')}`;

// Verification is ours, so it is tested the way security code has to be: not
// "does the happy path work" but "does every way of getting in fail".
describe('verifyStripeSignature', () => {
  const now = 1_800_000_000;

  it('accepts a correctly signed body', () => {
    const r = verifyStripeSignature(body, sign(body, now), SECRET, now);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.event.id).toBe('evt_1');
  });

  it('REJECTS when no secret is configured, rather than letting it through', () => {
    // An endpoint that accepts unsigned posts because an env var is missing is
    // worse than one that is switched off.
    expect(verifyStripeSignature(body, sign(body, now), undefined, now)).toEqual({
      ok: false,
      reason: 'no-secret',
    });
  });

  it('rejects a body altered after signing', () => {
    const header = sign(body, now);
    const tampered = body.replace('evt_1', 'evt_2');
    expect(verifyStripeSignature(tampered, header, SECRET, now).ok).toBe(false);
  });

  it('rejects a signature made with a different secret', () => {
    const header = sign(body, now, 'whsec_someone_elses_secret');
    expect(verifyStripeSignature(body, header, SECRET, now)).toEqual({
      ok: false,
      reason: 'bad-signature',
    });
  });

  it('rejects a captured request replayed later, even though it is validly signed', () => {
    const header = sign(body, now);
    const later = now + REPLAY_TOLERANCE_S + 1;
    expect(verifyStripeSignature(body, header, SECRET, later)).toEqual({ ok: false, reason: 'too-old' });
  });

  it('rejects a timestamp from the future beyond tolerance', () => {
    const header = sign(body, now + REPLAY_TOLERANCE_S + 60);
    expect(verifyStripeSignature(body, header, SECRET, now)).toEqual({ ok: false, reason: 'too-old' });
  });

  it('rejects a missing, empty or malformed header', () => {
    for (const h of [null, '', 't=', 'v1=abc', 'garbage', `t=${now}`]) {
      expect(verifyStripeSignature(body, h, SECRET, now).ok, String(h)).toBe(false);
    }
  });

  it('rejects a timestamp that is not a number', () => {
    expect(verifyStripeSignature(body, `t=soon,v1=abc`, SECRET, now).ok).toBe(false);
  });

  it('accepts when one of several v1 signatures matches, for secret rotation', () => {
    const t = now;
    const good = createHmac('sha256', SECRET).update(`${t}.${body}`).digest('hex');
    expect(verifyStripeSignature(body, `t=${t},v1=deadbeef,v1=${good}`, SECRET, t).ok).toBe(true);
  });

  it('rejects a signed body that is not an event', () => {
    const raw = JSON.stringify({ nope: true });
    expect(verifyStripeSignature(raw, sign(raw, now), SECRET, now)).toEqual({
      ok: false,
      reason: 'bad-json',
    });
  });
});

describe('emailFromSession', () => {
  it('prefers the payment link custom field, and says that is where it came from', () => {
    expect(
      emailFromSession({
        custom_fields: [{ text: { value: 'Student@Example.com ' } }],
        customer_details: { email: 'payer@example.com' },
      }),
    ).toEqual({ email: 'student@example.com', source: 'custom_field' });
  });

  it('falls back to the receipt email, and REPORTS the fallback', () => {
    // Tolerated, not desired. With the Stripe field Required this can only fire
    // on a misconfiguration, which is the §8e defect arriving quietly — so the
    // source is carried into the grant note.
    expect(emailFromSession({ customer_details: { email: 'Payer@Example.com' } })).toEqual({
      email: 'payer@example.com',
      source: 'payer',
    });
  });

  it('ignores a custom field that is not an email', () => {
    expect(
      emailFromSession({ custom_fields: [{ text: { value: 'Form 5B' } }], customer_details: {} }),
    ).toBeNull();
  });

  it('returns null when there is nothing to match on', () => {
    expect(emailFromSession({})).toBeNull();
  });
});

describe('scopeOfSession — ours, paid, and a payment', () => {
  const paid = { metadata: { product: 'extralesson' }, mode: 'payment', payment_status: 'paid' };

  it('accepts a paid payment-mode session whose metadata names this product', () => {
    expect(scopeOfSession(paid)).toEqual({ ok: true });
  });

  it('refuses another product’s metadata, and a session with none', () => {
    expect(scopeOfSession({ ...paid, metadata: { product: 'cognicare' } })).toEqual({ ok: false, reason: 'not-ours' });
    expect(scopeOfSession({ mode: 'payment', payment_status: 'paid' })).toEqual({ ok: false, reason: 'not-ours' });
    expect(scopeOfSession({ ...paid, metadata: {} })).toEqual({ ok: false, reason: 'not-ours' });
  });

  it('refuses a subscription, and a session not yet paid', () => {
    expect(scopeOfSession({ ...paid, mode: 'subscription' })).toEqual({ ok: false, reason: 'not-payment-mode' });
    expect(scopeOfSession({ ...paid, payment_status: 'unpaid' })).toEqual({ ok: false, reason: 'not-paid' });
  });

  it('records the metadata it saw', () => {
    expect(metadataOf({ metadata: { product: 'cognicare', plan: 3 } })).toEqual({ product: 'cognicare', plan: '3' });
    expect(metadataOf({})).toEqual({});
  });
});
