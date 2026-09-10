import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { Payment, Student } from '@/lib/db';
import { REFUNDABLE_FROM, isRefundable, transition, type PaymentState } from '@/lib/payment-state';
import type { RefundAttempt } from '@/lib/refund-state';
import { StripeError, stripeListAll, stripePost, type StripeRefund } from '@/lib/stripe-api';
import { refundEmail, sendEmail } from '@/lib/email';
import { externalBaseUrl } from '@/lib/base-url';
import { REFUND_DAYS } from '@/lib/access';

/**
 * `refund_rejected` is STRIPE REJECTING THE REFUND — a known outcome, and the
 * payment carries refund_failed with their reason. `not-refundable` is a
 * payment that was never in a paid state, which is a different thing. Neither
 * is the payment state `refused`, which means a session that was not ours and
 * is the only thing that word means.
 */
export type RefundOutcomeResult = 'done' | 'already-refunded' | 'unknown-outcome' | 'refund_rejected' | 'not-refundable';

export interface Operator {
  email: string;
}

interface PaymentRow {
  _id: unknown;
  state: PaymentState;
  paid_at?: Date;
  amount_total?: number;
  payment_intent_id?: string;
  refund_id?: string;
  student_id?: unknown;
  refund_attempts?: RefundAttempt[];
}

/**
 * A retry after a CONFIRMED failure is a new approval under a new key: the old
 * key is spent, and Stripe caches the failure against it.
 */
const APPROVABLE_FROM: PaymentState[] = [...REFUNDABLE_FROM, 'refund_failed'];

/**
 * REFUND AND REVOKE, IN THE SAFE ORDER (ROUND_12 Task 2). The order is the
 * opposite of `claim`, because the external act is the irreversible one: it
 * may never be recorded as done before it has happened, and never happen
 * without a record that it was attempted.
 *
 *   1. approve conditionally   — a crash here leaves an approved payment on
 *                                the queue and no money moved
 *   2. recover before creating — an attempt whose outcome is unknown may
 *                                already have moved money
 *   3. call Stripe             — under this attempt's key, with the key in the
 *                                refund's metadata
 *   4. complete conditionally  — the state and the revocation in one
 *                                transaction, or neither
 */
export async function refundAndRevoke(paymentId: string, operator: Operator, reason: string): Promise<RefundOutcomeResult> {
  const before = await read(paymentId);
  if (!before) return 'not-refundable';

  // Settled already: revoke if that never happened, and say so. No second email.
  if (before.state === 'refunded') {
    await revokeGrantOf(before, operator, reasonWithWindow(reason, before.paid_at));
    return 'already-refunded';
  }
  if (!isRefundable(before.state) && before.state !== 'refund_approved' && before.state !== 'refund_failed') {
    return 'not-refundable';
  }
  if (!before.payment_intent_id) return 'not-refundable';

  const recorded = reasonWithWindow(reason, before.paid_at);
  const { attempt, joined } = await approve(before, operator, recorded);
  if (!attempt) return 'not-refundable';

  // A joined approval may already have moved money; a fresh one cannot have.
  if (joined) {
    const found = await recover(before.payment_intent_id, attempt, before.amount_total);
    if (found) {
      // The money moved already: finish the record and the revocation.
      await complete(paymentId, attempt, found, operator, recorded);
      return 'already-refunded';
    }
  }

  let refund: StripeRefund;
  try {
    refund = await stripePost<StripeRefund>(
      '/refunds',
      { payment_intent: before.payment_intent_id, 'metadata[attempt_key]': attempt.key },
      attempt.key,
    );
  } catch (e) {
    // A TIMEOUT IS NOT A FAILURE. The request may have been received; the
    // payment stays approved on the queue and the next attempt recovers it.
    if (isTimeout(e)) return 'unknown-outcome';
    // A refusal is a known outcome, and the payment carries it: refund_failed,
    // with the reason, back on the queue for a person to approve a retry.
    const message = e instanceof StripeError ? `${e.code ?? e.status}: ${e.message}` : String(e);
    await fail(paymentId, attempt.key, message);
    return 'refund_rejected';
  }

  await complete(paymentId, attempt, refund, operator, recorded);
  return 'done';
}

/** Comps have no payment: revoking one is a record, and no call to anybody. */
export async function revokeComp(studentId: string, operator: Operator, reason: string): Promise<'done' | 'not-revocable'> {
  const res = await Student.updateOne(
    { _id: studentId, 'access.sitting': { $exists: true }, 'access.revoked_at': { $exists: false } },
    { $set: { 'access.revoked_at': new Date(), 'access.revoked_by': operator.email, 'access.revoked_reason': reason } },
  );
  return res.modifiedCount === 1 ? 'done' : 'not-revocable';
}

const read = (id: string) =>
  Payment.findById(id)
    .select('state paid_at amount_total payment_intent_id refund_id student_id refund_attempts')
    .lean<PaymentRow | null>();

/**
 * THE WINDOW NEVER BLOCKS THE ACT; it is a stated policy, and what it governs
 * is what we agree to. A refund granted past it is still a refund, and the
 * record says it was late so nobody later reads it as one made inside.
 */
export function reasonWithWindow(reason: string, paidAt: Date | undefined, now: Date = new Date()): string {
  if (!paidAt) return reason;
  const days = Math.floor((now.getTime() - paidAt.getTime()) / 86_400_000);
  return days > REFUND_DAYS ? `${reason} · late: ${days} days after payment, past the ${REFUND_DAYS}-day window` : reason;
}

const isTimeout = (e: unknown) => e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError');

/**
 * ONE CONDITIONAL WRITE. Only the winner of a race writes the approval; a
 * loser reads the approval that exists and joins it, so two clicks are one
 * approval, one key and one refund.
 */
async function approve(payment: PaymentRow, operator: Operator, reason: string): Promise<{ attempt: RefundAttempt | null; joined: boolean }> {
  if (payment.state === 'refund_approved') {
    const attempts = payment.refund_attempts ?? [];
    return { attempt: attempts[attempts.length - 1] ?? null, joined: true };
  }
  const attempt: RefundAttempt = { key: randomUUID(), at: new Date(), outcome: 'unknown' };
  const res = await Payment.updateOne(
    { _id: payment._id, state: { $in: APPROVABLE_FROM } },
    {
      $set: { ...transition('refund_approved', { reason, by: operator.email }) },
      $push: { refund_attempts: attempt },
    },
  );
  if (res.modifiedCount === 1) return { attempt, joined: false };

  // Somebody else moved it between the read and the write.
  const now = await read(String(payment._id));
  if (now?.state === 'refund_approved') {
    const attempts = now.refund_attempts ?? [];
    return { attempt: attempts[attempts.length - 1] ?? null, joined: true };
  }
  return { attempt: null, joined: false };
}

/**
 * RECOVER BEFORE YOU CREATE. Only a PENDING or SUCCEEDED FULL refund that is
 * ours — by id, or by the key we wrote into its metadata — proves this attempt
 * moved money. A failed or canceled one must not block the retry it was
 * approved for; a partial, or one issued in the dashboard, was never ours.
 * An empty result proves nothing: the attempt and its key are kept.
 */
async function recover(paymentIntentId: string, attempt: RefundAttempt, amountTotal: number | undefined): Promise<StripeRefund | null> {
  if (attempt.outcome !== 'unknown') return null;
  const refunds = await stripeListAll<StripeRefund>('/refunds', { payment_intent: paymentIntentId });
  return (
    refunds.find(
      (r) =>
        (r.id === attempt.refund_id || r.metadata?.attempt_key === attempt.key) &&
        (r.status === 'pending' || r.status === 'succeeded') &&
        (amountTotal === undefined || r.amount === amountTotal),
    ) ?? null
  );
}

/**
 * ONE TRANSACTION, MATCHED TO THIS APPROVAL AND THIS REFUND. The payment's
 * state and the grant's ending commit together or not at all, and the grant
 * ended is only the one whose `payment_id` is this payment — checked inside
 * the transaction, so refunding an August payment cannot revoke a September
 * purchase, and a grant with no payment is never touched.
 *
 * Returns whether anything actually changed: a completion that finds the work
 * already done preserves the revocation that exists and sends no second email.
 */
async function complete(paymentId: string, attempt: RefundAttempt, refund: StripeRefund, operator: Operator, reason: string): Promise<boolean> {
  const session = await mongoose.startSession();
  let moved = false;
  let revoked = false;
  let notify: string | null = null;
  try {
    await session.withTransaction(
      async () => {
        moved = false;
        revoked = false;
        notify = null;

        const res = await Payment.updateOne(
          { _id: paymentId, state: 'refund_approved', 'refund_attempts.key': attempt.key },
          {
            $set: {
              ...transition('refunded', { reason, by: operator.email }),
              refund_id: refund.id,
              refund_status: refund.status,
              'refund_attempts.$.outcome': refund.status === 'succeeded' ? 'succeeded' : 'pending',
              'refund_attempts.$.refund_id': refund.id,
              'refund_attempts.$.status': refund.status,
            },
          },
          { session },
        );
        moved = res.modifiedCount === 1;
        if (!moved) return;

        const ended = await Student.updateOne(
          { 'access.payment_id': paymentId, 'access.revoked_at': { $exists: false } },
          { $set: { 'access.revoked_at': new Date(), 'access.revoked_by': operator.email, 'access.revoked_reason': reason } },
          { session },
        );
        revoked = ended.modifiedCount === 1;

        // Whoever holds the grant that ended; failing that, the account the
        // payment is matched to — a waiting refund has no grant and may have
        // no account at all, and then there is nobody to write to.
        const holder = await Student.findOne({ 'access.payment_id': paymentId }).select('email').session(session).lean<{ email: string } | null>();
        if (holder) {
          notify = holder.email;
          return;
        }
        const row = await Payment.findById(paymentId).select('student_id').session(session).lean<{ student_id?: unknown } | null>();
        if (!row?.student_id) return;
        const matched = await Student.findById(row.student_id).select('email').session(session).lean<{ email: string } | null>();
        notify = matched?.email ?? null;
      },
      { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, readPreference: 'primary' },
    );
  } finally {
    await session.endSession();
  }

  // AFTER A REAL TRANSITION ONLY, and once. A refund of money we held without
  // granting anything never says access ended, because none did.
  if (moved && notify) {
    try {
      await sendEmail({ to: notify, ...refundEmail({ revoked, baseUrl: externalBaseUrl() }) });
    } catch (err) {
      console.error('[refund-email] send failed:', err);
    }
  }
  return moved;
}

/** Stripe rejected it: the payment goes back in front of a person, with the reason. */
async function fail(paymentId: string, key: string, message: string): Promise<void> {
  await Payment.updateOne(
    { _id: paymentId, state: 'refund_approved', 'refund_attempts.key': key },
    {
      $set: {
        ...transition('refund_failed', { reason: message }),
        'refund_attempts.$.outcome': 'failed',
        'refund_attempts.$.error': message,
      },
    },
  );
}

/** A payment already refunded may still have a grant nobody ended. */
async function revokeGrantOf(payment: PaymentRow, operator: Operator, reason: string): Promise<void> {
  await Student.updateOne(
    { 'access.payment_id': String(payment._id), 'access.revoked_at': { $exists: false } },
    { $set: { 'access.revoked_at': new Date(), 'access.revoked_by': operator.email, 'access.revoked_reason': reason } },
  );
}
