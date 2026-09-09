/**
 * THE SWITCH (ROUND_11 rollout order). Tasks 2–4 are built before the
 * migration and activate only at the verified cutover: with this false the
 * screens read Fulfilment and `resolved_at` exactly as they did, and with it
 * true they read `Payment.state` alone. It is flipped in Task 5's second
 * commit, once the migration's counts have been checked against production
 * and the whole gate has passed — never as a convenience while building.
 */
export const PAYMENT_STATE_CUTOVER = false;
