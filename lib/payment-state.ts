/**
 * WHAT HAPPENED TO THIS MONEY, in one field (ROUND_11). A payment is in
 * exactly one state; the queue is the subset with an obligation outstanding,
 * derived and never stored. Nothing reads this yet: Task 1 is additive, and
 * the readers switch after Task 5's migration is verified.
 */
export const PAYMENT_STATES = ['pending', 'waiting', 'duplicate', 'granted', 'closed', 'refused'] as const;

export type PaymentState = (typeof PAYMENT_STATES)[number];

/** The states with an obligation on a person: what Task 4's queue will hold. */
export const QUEUE_STATES: PaymentState[] = ['waiting', 'duplicate'];

/**
 * The fields one transition writes. Written beside the old representation
 * while both exist, so a payment never carries a state that contradicts its
 * Fulfilment (rollout order, ROUND_11).
 */
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
