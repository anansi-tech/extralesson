/**
 * READING AND WRITING AT STRIPE, over HTTPS, with no package and no SDK
 * (ROUND_12; the kill-list exemption widened for this path alone). A refund is
 * issued by Stripe and by nobody else, so the alternative to this file is an
 * operator refunding in the dashboard while our record says access was granted.
 */
const API = 'https://api.stripe.com/v1';

export class StripeError extends Error {
  constructor(readonly status: number, readonly code: string | undefined, message: string) {
    super(message);
  }
}

function key(): string {
  const k = process.env.STRIPE_SECRET_KEY?.trim();
  if (!k) throw new Error('STRIPE_SECRET_KEY is not set');
  return k;
}

/** One request. The caller says what it wants back; nothing here knows the shapes. */
export async function stripeGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API}${path}${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${key()}` },
  });
  const body = (await res.json()) as { error?: { code?: string; message?: string } };
  if (!res.ok) {
    throw new StripeError(res.status, body.error?.code, body.error?.message ?? `HTTP ${res.status}`);
  }
  return body as T;
}

/** A refund as this path reads one. Stripe's own words, unmapped. */
export interface StripeRefund {
  id: string;
  amount: number;
  status: string;
  payment_intent?: string;
  metadata?: Record<string, string>;
}

/**
 * A WRITE, under an idempotency key. The key makes one attempt safe to repeat;
 * it does not make two attempts one, which is why the caller keeps the key it
 * used and Stripe's answer beside it.
 */
export async function stripePost<T>(path: string, form: Record<string, string>, idempotencyKey: string, timeoutMs = 20_000): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': idempotencyKey,
    },
    body: new URLSearchParams(form).toString(),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const body = (await res.json()) as { error?: { code?: string; message?: string } };
  if (!res.ok) throw new StripeError(res.status, body.error?.code, body.error?.message ?? `HTTP ${res.status}`);
  return body as T;
}

/**
 * EVERY PAGE. A refund we are looking for may be behind the first ten, and a
 * short read that missed it would look exactly like no refund at all — which
 * is the one conclusion this must never draw.
 */
export async function stripeListAll<T extends { id: string }>(path: string, params: Record<string, string>): Promise<T[]> {
  const all: T[] = [];
  let startingAfter: string | undefined;
  for (;;) {
    const page = await stripeGet<{ data: T[]; has_more: boolean }>(path, {
      ...params,
      limit: '100',
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    all.push(...page.data);
    if (!page.has_more || page.data.length === 0) return all;
    startingAfter = page.data[page.data.length - 1].id;
  }
}

export interface CheckoutSession {
  id: string;
  payment_status: string;
  payment_intent?: string | { id?: string; latest_charge?: string | { id?: string; created?: number } } | null;
}

export interface StripeEventObject {
  id: string;
  type: string;
  created: number;
  data: { object: Record<string, unknown> };
}
