import { Payment, RefundRequest, Student } from '@/lib/db';
import { QUEUE_STATES, type PaymentState } from '@/lib/payment-state';
import { REFUND_DAYS } from '@/lib/access';

/**
 * THE QUEUE IS DERIVED, NEVER STORED (ROUND_11 Task 4): the payments whose
 * state carries an obligation on a person. One query over one collection, so
 * a payment cannot be listed twice, counted twice, or listed here and
 * somewhere else at the same time.
 */
export interface QueueRow {
  id: string;
  session_id: string | null;
  /**
   * A payment carrying an open request is on the queue whatever its state, so
   * `granted` appears here too — one row for the payment, never one for the
   * state and another for the asking.
   */
  state: PaymentState;
  /** What a refund is issued against, and what the dashboard link points at. */
  payment_intent_id: string | null;
  /** When Stripe confirmed payment; the window is measured from this. */
  paid_at: Date | null;
  /** Stripe's own word for the refund, where there is one. */
  refund_status: string | null;
  /** The key of the attempt the payment rests on, so a person can find it at Stripe. */
  attempt_key: string | null;
  /** A student asking for this money back, while it is still open (ROUND_12 Task 5). */
  request: { asked_at: Date; student_email: string | null; days: number | null; late: boolean } | null;
  /** The student's address from the session, or null where there was none we could use. */
  email: string | null;
  amount_total: number | null;
  currency: string | null;
  state_reason: string | null;
  received_at: Date;
}

/**
 * Days since the money arrived, against the window the landing page promises.
 * Past it the refund still works: the window is a stated policy, and what it
 * governs is what we agree to, never what the software permits.
 */
export function windowOf(paid_at: Date | null, now: Date = new Date()): { days: number; late: boolean } | null {
  if (!paid_at) return null;
  const days = Math.floor((now.getTime() - paid_at.getTime()) / 86_400_000);
  return { days, late: days > REFUND_DAYS };
}

/** The payment in Stripe's own dashboard, in the mode the key belongs to. */
export function dashboardUrl(paymentIntentId: string | null): string | null {
  if (!paymentIntentId) return null;
  const test = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test') ?? false;
  return `https://dashboard.stripe.com/${test ? 'test/' : ''}payments/${paymentIntentId}`;
}

/** What a row's money reads as; the currency is the session's own, never assumed. */
export function amountLine(row: Pick<QueueRow, 'amount_total' | 'currency'>): string {
  if (typeof row.amount_total !== 'number') return 'amount unknown';
  return `${(row.amount_total / 100).toFixed(2)} ${(row.currency ?? '').toUpperCase()}`.trim();
}

/** Oldest first: the queue is work, and the oldest debt is the one waiting longest. */
export async function loadQueue(): Promise<QueueRow[]> {
  // ONE ROW PER PAYMENT. A payment with an open request and a refund state is
  // one row and one count, so the request widens the query rather than adding
  // a list of its own.
  const open = await RefundRequest.find({ state: 'open' })
    .select('payment_id student_id asked_at')
    .lean<{ payment_id: unknown; student_id: unknown; asked_at: Date }[]>();
  const requestBy = new Map(open.map((r) => [String(r.payment_id), r]));
  const askers = await Student.find({ _id: { $in: open.map((r) => r.student_id) } })
    .select('email')
    .lean<{ _id: unknown; email: string }[]>();
  const emailBy = new Map(askers.map((s) => [String(s._id), s.email]));

  const rows = await Payment.find({ $or: [{ state: { $in: QUEUE_STATES } }, { _id: { $in: open.map((r) => r.payment_id) } }] })
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
        payment_intent_id?: string;
        paid_at?: Date;
        refund_status?: string;
        refund_attempts?: { key: string }[];
      }[]
    >();
  return rows.map((r) => ({
    id: String(r._id),
    session_id: r.session_id ?? null,
    state: r.state,
    payment_intent_id: r.payment_intent_id ?? null,
    paid_at: r.paid_at ?? null,
    refund_status: r.refund_status ?? null,
    attempt_key: r.refund_attempts?.[r.refund_attempts.length - 1]?.key ?? null,
    // MEASURED FROM WHEN THEY ASKED, never from when an operator got to it.
    request: (() => {
      const asked = requestBy.get(String(r._id));
      if (!asked) return null;
      const age = r.paid_at ? windowOf(r.paid_at, asked.asked_at) : null;
      return {
        asked_at: asked.asked_at,
        student_email: emailBy.get(String(asked.student_id)) ?? null,
        days: age?.days ?? null,
        late: age?.late ?? false,
      };
    })(),
    email: r.email ?? null,
    amount_total: typeof r.amount_total === 'number' ? r.amount_total : null,
    currency: r.currency ?? null,
    state_reason: r.state_reason ?? null,
    received_at: r.received_at,
  }));
}
