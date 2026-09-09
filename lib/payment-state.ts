/**
 * WHAT HAPPENED TO THIS MONEY, in one field (ROUND_11). A payment is in
 * exactly one state; the queue is the subset with an obligation outstanding,
 * derived and never stored.
 */
export const PAYMENT_STATES = ['pending', 'waiting', 'duplicate', 'granted', 'closed', 'refused'] as const;

export type PaymentState = (typeof PAYMENT_STATES)[number];

/**
 * A KEY FOR A ROW THAT PREDATES SESSION TRACKING (ROUND_11 Task 5). Six
 * payments were taken before any session was recorded, so they are keyed by
 * the event that carried them. Such a row is NOT a checkout session and must
 * never be looked up as one.
 */
export const LEGACY_PREFIX = 'legacy:';

/** The states with an obligation on a person: what the queue holds. */
export const QUEUE_STATES: PaymentState[] = ['waiting', 'duplicate'];

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
