/**
 * WHAT HAPPENED TO THIS MONEY, in one field (ROUND_11). A payment is in
 * exactly one state; the queue is the subset with an obligation outstanding,
 * derived and never stored.
 */
export const PAYMENT_STATES = [
  'pending',
  'waiting',
  'duplicate',
  'granted',
  'closed',
  'refused',
  // ROUND_12. Approved is an operator's decision with no outcome yet; refunded
  // is Stripe's acceptance; failed is its rejection, or a failure after it.
  'refund_approved',
  'refunded',
  'refund_failed',
] as const;

export type PaymentState = (typeof PAYMENT_STATES)[number];

/**
 * A KEY FOR A ROW THAT PREDATES SESSION TRACKING (ROUND_11 Task 5). Six
 * payments were taken before any session was recorded, so they are keyed by
 * the event that carried them. Such a row is NOT a checkout session and must
 * never be looked up as one.
 */
export const LEGACY_PREFIX = 'legacy:';

/** The states with an obligation on a person: what the queue holds. */
export const QUEUE_STATES: PaymentState[] = ['waiting', 'duplicate', 'refund_approved', 'refund_failed'];

/**
 * EVERY PAID STATE, and only those (ROUND_12 Task 1). `waiting` and
 * `duplicate` are money we hold with no grant to revoke — refunding them
 * returns it and touches nobody's access. Nothing else was ever paid:
 * `pending` never arrived, `refused` was not ours, `closed` was settled by a
 * person, and a refund state is one this operation already reached.
 */
export const REFUNDABLE_FROM: PaymentState[] = ['granted', 'waiting', 'duplicate'];

export const isRefundable = (state: PaymentState | undefined): boolean =>
  !!state && REFUNDABLE_FROM.includes(state);

/** The three states this operation writes; a checkout event never reaches them. */
export const REFUND_STATES: PaymentState[] = ['refund_approved', 'refunded', 'refund_failed'];

export const isRefundState = (state: string | undefined): boolean =>
  !!state && (REFUND_STATES as string[]).includes(state);

/** The fields one transition writes. */
export function transition(
  state: PaymentState,
  extra: { reason?: string; by?: string; at?: Date } = {},
): { state: PaymentState; state_at: Date; state_reason?: string; closed_by?: string } {
  return {
    state,
    state_at: extra.at ?? new Date(),
    ...(extra.reason ? { state_reason: extra.reason } : {}),
    ...(extra.by ? { closed_by: extra.by } : {}),
  };
}
