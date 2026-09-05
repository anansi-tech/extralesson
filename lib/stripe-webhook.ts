import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * No Stripe package: the kill list bans it as a DEPENDENCY and exempts a
 * handler verifying signatures with node:crypto alone — ROUND_2 §8c. Several
 * v1 signatures can be live during a rotation, and any one matching is a pass.
 */
export const REPLAY_TOLERANCE_S = 5 * 60;

export type VerifyResult =
  | { ok: true; event: StripeEvent }
  | { ok: false; reason: 'no-secret' | 'malformed-header' | 'bad-signature' | 'too-old' | 'bad-json' };

export interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

export function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string | undefined,
  now: number = Math.floor(Date.now() / 1000),
): VerifyResult {
  // No secret configured is a REJECT, never a pass: an endpoint accepting
  // unsigned posts because a variable is missing is worse than one that is off.
  if (!secret) return { ok: false, reason: 'no-secret' };
  if (!header) return { ok: false, reason: 'malformed-header' };

  let timestamp = '';
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const [k, v] = part.trim().split('=');
    if (k === 't') timestamp = v ?? '';
    else if (k === 'v1' && v) signatures.push(v);
  }
  if (!timestamp || signatures.length === 0) return { ok: false, reason: 'malformed-header' };

  // Checked BEFORE the comparison, so an old but validly signed body is
  // refused on its age and a captured request is not replayable tomorrow.
  const t = Number(timestamp);
  if (!Number.isFinite(t) || Math.abs(now - t) > REPLAY_TOLERANCE_S) {
    return { ok: false, reason: 'too-old' };
  }

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const matched = signatures.some((sig) => {
    const given = Buffer.from(sig, 'utf8');
    return given.length === expectedBuf.length && timingSafeEqual(given, expectedBuf);
  });
  if (!matched) return { ok: false, reason: 'bad-signature' };

  try {
    const event = JSON.parse(rawBody) as StripeEvent;
    if (!event?.id || !event?.type) return { ok: false, reason: 'bad-json' };
    return { ok: true, event };
  } catch {
    return { ok: false, reason: 'bad-json' };
  }
}

/**
 * THE RECEIPT-ADDRESS FALLBACK IS TOLERATED, NOT DESIRED, so it reports its
 * source: with the custom field Required it fires only on a misconfiguration,
 * the ROUND_2 §8e defect arriving silently. The caller notes it on the grant.
 */
export type EmailSource = 'custom_field' | 'payer';

export function emailFromSession(
  session: Record<string, unknown>,
): { email: string; source: EmailSource } | null {
  const fields = (session.custom_fields as { text?: { value?: string } }[] | undefined) ?? [];
  for (const f of fields) {
    const v = f?.text?.value?.trim();
    if (v && v.includes('@')) return { email: v.toLowerCase(), source: 'custom_field' };
  }
  const details = session.customer_details as { email?: string } | undefined;
  const fallback = details?.email?.trim();
  return fallback ? { email: fallback.toLowerCase(), source: 'payer' } : null;
}

/**
 * What the payment link SAYS the sitting is — evidence, never authority. The
 * sitting granted is the one the student registered for, and a disagreement is
 * recorded on the grant. Null today: STRIPE_LINK_SITTINGS is deliberately unset.
 */
export function sittingFromLink(
  session: Record<string, unknown>,
  mapping: string | undefined,
): 'jan-2027' | 'may-june-2027' | null {
  const link = typeof session.payment_link === 'string' ? session.payment_link : null;
  if (!link || !mapping) return null;
  for (const pair of mapping.split(',')) {
    const [id, sitting] = pair.split('=').map((x) => x.trim());
    if (id === link && (sitting === 'jan-2027' || sitting === 'may-june-2027')) return sitting;
  }
  return null;
}

/**
 * THE STRIPE ACCOUNT IS SHARED ACROSS ANANSI PRODUCTS (ROUND_6 Task 2): a
 * signed, genuine checkout can be for something else entirely. Only a session
 * from one of OUR Payment Links, in payment mode, and actually paid, is ours to
 * grant. Everything else is acknowledged and logged, never granted.
 */
export const GRANTING_EVENTS = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded']);

export type ScopeRefusal = 'no-link' | 'link-not-ours' | 'not-payment-mode' | 'not-paid';

export function paymentLinkAllowlist(value: string | undefined): Set<string> {
  return new Set((value ?? '').split(',').map((s) => s.trim()).filter(Boolean));
}

export function scopeOfSession(
  session: Record<string, unknown>,
  allowlist: Set<string>,
): { ok: true } | { ok: false; reason: ScopeRefusal } {
  const link = typeof session.payment_link === 'string' ? session.payment_link : null;
  if (!link) return { ok: false, reason: 'no-link' };
  if (!allowlist.has(link)) return { ok: false, reason: 'link-not-ours' };
  if (session.mode !== 'payment') return { ok: false, reason: 'not-payment-mode' };
  // A delayed payment method completes the session before the money arrives;
  // Stripe sends async_payment_succeeded once it has, and that is when we grant.
  if (session.payment_status !== 'paid') return { ok: false, reason: 'not-paid' };
  return { ok: true };
}
