import { isRefundState, type PaymentState } from '@/lib/payment-state';

/**
 * TWO KINDS OF EVENT, AND THEY ARE NOT THE SAME (ROUND_12 Task 1). A checkout
 * event redelivered can never change refund state; a refund-status event can,
 * and only for a refund an operator already approved. A status event never
 * authorises a refund nobody asked for.
 */
export type RefundOutcome = 'unknown' | 'pending' | 'succeeded' | 'failed' | 'canceled';

export interface RefundAttempt {
  key: string;
  at: Date;
  outcome: RefundOutcome;
  refund_id?: string;
  status?: string;
  error?: string;
}

/** What a refund-status event says, reduced to what is acted on. */
export interface RefundStatusEvent {
  refund_id: string;
  outcome: RefundOutcome;
  /** Our attempt's key, written into the refund's metadata when it was created. */
  key?: string;
}

/** An outcome that has already happened: only later news of the same refund moves it. */
const SETTLED: RefundOutcome[] = ['succeeded', 'failed', 'canceled'];

/**
 * THE ATTEMPT THIS STATUS BELONGS TO — by refund id first, because that is the
 * durable handle, then by the key we wrote into the refund's metadata. A
 * status naming neither belongs to no attempt of ours, and is not adopted:
 * a dashboard-issued refund on the same intent is somebody else's act.
 */
export function attemptFor(attempts: RefundAttempt[], event: RefundStatusEvent): number {
  const byRefund = attempts.findIndex((a) => a.refund_id && a.refund_id === event.refund_id);
  if (byRefund >= 0) return byRefund;
  return event.key ? attempts.findIndex((a) => a.key === event.key) : -1;
}

export interface RefundStatusChange {
  /** Which attempt to update, and what it now says. */
  index: number;
  attempt: RefundAttempt;
  /** The payment's new state, when this attempt is the one it rests on. */
  state?: PaymentState;
}

/**
 * STATUS BINDS TO THE ATTEMPT, NOT TO THE PAYMENT. The attempt it names is
 * updated; the payment moves only if that attempt is the one it currently
 * rests on — the last. So a delayed failure from a superseded attempt leaves a
 * succeeded attempt and its revocation alone, and an older `pending` never
 * undoes a failure already recorded.
 */
export function refundStatusChange(
  payment: { state?: string; refund_attempts?: RefundAttempt[] },
  event: RefundStatusEvent,
): RefundStatusChange | null {
  // Nobody approved a refund on this payment: a status event does not start one.
  if (!isRefundState(payment.state)) return null;
  const attempts = payment.refund_attempts ?? [];
  const index = attemptFor(attempts, event);
  if (index < 0) return null;

  const attempt = attempts[index];
  // Late news, not new news: pending arriving after an outcome changes nothing.
  if (event.outcome === 'pending' && SETTLED.includes(attempt.outcome)) return null;

  const updated: RefundAttempt = {
    ...attempt,
    outcome: event.outcome,
    refund_id: attempt.refund_id ?? event.refund_id,
    status: event.outcome,
  };
  const current = index === attempts.length - 1;
  // Accepted means the money is committed: pending and succeeded both revoke.
  // Rejected, or failed after acceptance, puts it back in front of a person.
  const state: PaymentState | undefined =
    event.outcome === 'succeeded' || event.outcome === 'pending'
      ? 'refunded'
      : event.outcome === 'failed' || event.outcome === 'canceled'
        ? 'refund_failed'
        : undefined;
  return { index, attempt: updated, state: current ? state : undefined };
}
