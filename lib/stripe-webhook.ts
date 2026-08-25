import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * STRIPE WEBHOOK VERIFICATION, WITHOUT THE STRIPE PACKAGE.
 *
 * The kill list bans Stripe as a DEPENDENCY and exempts a handler that verifies
 * signatures with node:crypto alone (CLAUDE.md; ROUND_2_EXAMINER §8c). That is
 * all a webhook needs: the signed payload carries everything we act on, so
 * there is no call back to Stripe and nothing to install.
 *
 * The header is `t=<unix>,v1=<hex>[,v1=<hex>...]`. The signed payload is
 * `${t}.${rawBody}`, HMAC-SHA256 with the endpoint's whsec_ secret. Several v1
 * signatures can be present while a secret is being rotated, and any one
 * matching is a pass.
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
  // No secret configured is a REJECT, never a pass. An endpoint that accepts
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

  // A captured request must not be replayable tomorrow. Checked BEFORE the
  // comparison so an old-but-validly-signed body is refused on its age.
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
 * The email the student typed into the payment link's custom field, falling
 * back to the one Stripe collected for the receipt. The fallback is not
 * sloppiness: an unmatched payment costs someone a manual grant while a student
 * waits, and the receipt email is the same person more often than not.
 */
export function emailFromSession(session: Record<string, unknown>): string | null {
  const fields = (session.custom_fields as { text?: { value?: string } }[] | undefined) ?? [];
  for (const f of fields) {
    const v = f?.text?.value?.trim();
    if (v && v.includes('@')) return v.toLowerCase();
  }
  const details = session.customer_details as { email?: string } | undefined;
  const fallback = details?.email?.trim();
  return fallback ? fallback.toLowerCase() : null;
}

/**
 * Which sitting was bought. Line items would need an API call we do not make,
 * so this maps the PAYMENT LINK the student used — one link per sitting —
 * configured as `plink_abc=may-june-2027,plink_xyz=jan-2027`.
 *
 * Unmapped returns null, and the caller falls back to the sitting the student
 * registered with, recording that it did so: a wrong sitting should be visible
 * on the admin screen rather than silently chosen.
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
