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
