import { Payment, RefundRequest, Student } from './index';
import { StripeError, stripeGet } from '@/lib/stripe-api';

/**
 * DELETING THE TEST PAYMENTS (one-off). Everything in this collection today is
 * test-mode: the pilot has not taken real money. Once it does, this script
 * must never run again, so it refuses on any sign of a live payment rather
 * than trusting whoever runs it to remember.
 */
export type Mode = 'test' | 'live' | 'unknown';

export interface Classified {
  id: string;
  session_id: string;
  payment_intent_id: string | null;
  state: string;
  mode: Mode;
  why: string;
}

/** Stripe's own prefixes, which are the only part of an id that says the mode. */
export const isTestSession = (sessionId: string) => sessionId.startsWith('cs_test_');
export const isLiveSession = (sessionId: string) => sessionId.startsWith('cs_live_');

/**
 * A payment's mode. The session id says it outright where there is one; a row
 * keyed by its event predates session tracking, so the test key is asked
 * instead — a test key cannot read a live object, so an answer IS the proof.
 * No answer proves nothing, and an unproven row is left alone.
 */
export async function classify(row: { _id: unknown; session_id: string; payment_intent_id?: string; state: string }): Promise<Classified> {
  const base = { id: String(row._id), session_id: row.session_id, payment_intent_id: row.payment_intent_id ?? null, state: row.state };
  if (isLiveSession(row.session_id)) return { ...base, mode: 'live', why: 'the session id says live' };
  if (isTestSession(row.session_id)) return { ...base, mode: 'test', why: 'the session id says test' };
  if (!row.payment_intent_id) return { ...base, mode: 'unknown', why: 'no session prefix and no payment intent to ask about' };
  try {
    await stripeGet(`/payment_intents/${row.payment_intent_id}`);
    return { ...base, mode: 'test', why: 'the test key can read its payment intent' };
  } catch (e) {
    const why = e instanceof StripeError ? `the test key cannot read its payment intent (${e.code ?? e.status})` : String(e);
    return { ...base, mode: 'unknown', why };
  }
}

export interface PurgePlan {
  payments: Classified[];
  test: Classified[];
  live: Classified[];
  unknown: Classified[];
  /** Requests that go with the payments they point at. */
  requests: { id: string; payment_id: string }[];
  /** Grants still naming a payment this would delete: a reference left dangling. */
  danglingGrants: { studentId: string; email: string; payment_id: string }[];
  /** Requests pointing at a payment that stays: nothing happens to them. */
  requestsLeft: { id: string; payment_id: string }[];
}

/** Reads only. */
export async function planPurge(): Promise<PurgePlan> {
  const rows = await Payment.find({}).select('session_id payment_intent_id state').lean<{ _id: unknown; session_id: string; payment_intent_id?: string; state: string }[]>();
  const payments: Classified[] = [];
  for (const row of rows) payments.push(await classify(row));

  const test = payments.filter((p) => p.mode === 'test');
  const goingIds = new Set(test.map((p) => p.id));

  const allRequests = await RefundRequest.find({}).select('payment_id').lean<{ _id: unknown; payment_id: unknown }[]>();
  const requests = allRequests.filter((r) => goingIds.has(String(r.payment_id))).map((r) => ({ id: String(r._id), payment_id: String(r.payment_id) }));
  const requestsLeft = allRequests.filter((r) => !goingIds.has(String(r.payment_id))).map((r) => ({ id: String(r._id), payment_id: String(r.payment_id) }));

  const grants = await Student.find({ 'access.payment_id': { $exists: true } }).select('email access.payment_id').lean<{ _id: unknown; email: string; access?: { payment_id?: unknown } }[]>();
  const danglingGrants = grants
    .filter((g) => g.access?.payment_id && goingIds.has(String(g.access.payment_id)))
    .map((g) => ({ studentId: String(g._id), email: g.email, payment_id: String(g.access!.payment_id) }));

  return {
    payments,
    test,
    live: payments.filter((p) => p.mode === 'live'),
    unknown: payments.filter((p) => p.mode === 'unknown'),
    requests,
    requestsLeft,
    danglingGrants,
  };
}

export interface PurgeRefusal {
  ok: false;
  reason: string;
}

/**
 * Writes. Refuses on a live key or a live payment, because this deletes
 * financial records and the collection is only ever safe to empty while
 * nothing real is in it.
 */
export async function applyPurge(plan: PurgePlan): Promise<{ ok: true; payments: number; requests: number } | PurgeRefusal> {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test')) {
    return { ok: false, reason: 'the key is not a test key' };
  }
  if (plan.live.length > 0) {
    return { ok: false, reason: `${plan.live.length} live payment${plan.live.length === 1 ? '' : 's'} in the collection` };
  }
  const ids = plan.test.map((p) => p.id);
  const requests = await RefundRequest.deleteMany({ payment_id: { $in: ids } });
  const payments = await Payment.deleteMany({ _id: { $in: ids } });
  return { ok: true, payments: payments.deletedCount ?? 0, requests: requests.deletedCount ?? 0 };
}
