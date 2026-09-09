import { Payment } from '@/lib/db';
import { QUEUE_STATES, type PaymentState } from '@/lib/payment-state';

/**
 * THE QUEUE IS DERIVED, NEVER STORED (ROUND_11 Task 4): the payments whose
 * state carries an obligation on a person. One query over one collection, so
 * a payment cannot be listed twice, counted twice, or listed here and
 * somewhere else at the same time.
 */
export interface QueueRow {
  id: string;
  session_id: string | null;
  state: Extract<PaymentState, 'waiting' | 'duplicate'>;
  /** The student's address from the session, or null where there was none we could use. */
  email: string | null;
  amount_total: number | null;
  currency: string | null;
  state_reason: string | null;
  received_at: Date;
}

/** What a row's money reads as; the currency is the session's own, never assumed. */
export function amountLine(row: Pick<QueueRow, 'amount_total' | 'currency'>): string {
  if (typeof row.amount_total !== 'number') return 'amount unknown';
  return `${(row.amount_total / 100).toFixed(2)} ${(row.currency ?? '').toUpperCase()}`.trim();
}

/** Oldest first: the queue is work, and the oldest debt is the one waiting longest. */
export async function loadQueue(): Promise<QueueRow[]> {
  const rows = await Payment.find({ state: { $in: QUEUE_STATES } })
    .sort({ received_at: 1 })
    .limit(200)
    .lean<
      {
        _id: unknown;
        session_id?: string;
        state: QueueRow['state'];
        email?: string;
        amount_total?: number;
        currency?: string;
        state_reason?: string;
        received_at: Date;
      }[]
    >();
  return rows.map((r) => ({
    id: String(r._id),
    session_id: r.session_id ?? null,
    state: r.state,
    email: r.email ?? null,
    amount_total: typeof r.amount_total === 'number' ? r.amount_total : null,
    currency: r.currency ?? null,
    state_reason: r.state_reason ?? null,
    received_at: r.received_at,
  }));
}
