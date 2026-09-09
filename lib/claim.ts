import mongoose from 'mongoose';
import { Fulfilment, Payment, Student } from '@/lib/db';
import { hasAccess, type Access } from '@/lib/access';
import { noteWithPrior } from '@/lib/grant-note';
import { transition } from '@/lib/payment-state';
import { accessEmail, sendEmail } from '@/lib/email';
import { externalBaseUrl } from '@/lib/base-url';
import { sittingLabel } from '@/lib/sittings';
import type { EmailSource } from '@/lib/stripe-webhook';
import type { ExamSitting } from '@/lib/types';

export type ClaimOutcome = 'granted' | 'duplicate' | 'not-claimable';

interface PaymentRow {
  _id: unknown;
  event_id: string;
  state?: string;
  email_source?: EmailSource | null;
}
interface StudentRow {
  _id: unknown;
  email: string;
  exam_sitting: ExamSitting;
  access?: Access | null;
}

/**
 * ONE OPERATION FOR ASSIGNING ACCESS FROM A PAYMENT (ROUND_11 Task 2).
 *
 * The payment's state and the student's entitlement are read, and the Payment
 * transition and Student.access are committed TOGETHER. A failure commits
 * neither: there is no ordering in which a crash leaves access without its
 * record, or a record without its access.
 *
 * A conditional update on the Payment alone protects one payment; it does not
 * protect two payments racing for one account. Both racers read no access and
 * both write the same Student document, so one commits and the other is
 * aborted by the server, retried on a fresh read, and answers `duplicate`.
 *
 * The notification is not in the transaction — nothing atomically commits a
 * database write and an external send. One per successful claim, after commit:
 * a crash between the two loses the notification, not the access.
 */
export async function claim(sessionId: string, student: { id: unknown }): Promise<ClaimOutcome> {
  const session = await mongoose.startSession();
  let outcome: ClaimOutcome = 'not-claimable';
  let granted: { to: string; sitting: ExamSitting } | null = null;
  try {
    await session.withTransaction(
      async () => {
        // Every attempt starts from fresh reads: the server may abort and
        // re-run this whole body when two claims meet on one document.
        outcome = 'not-claimable';
        granted = null;

        const payment = await Payment.findOne({ session_id: sessionId }).session(session).lean<PaymentRow | null>();
        // Only `waiting` is claimable. granted, closed and refused are terminal.
        if (!payment || payment.state !== 'waiting') return;

        const fresh = await Student.findById(student.id).select('email exam_sitting access').session(session).lean<StudentRow | null>();
        if (!fresh) return;

        const sitting = fresh.exam_sitting;
        const prior = fresh.access ?? null;

        if (prior && prior.sitting === sitting && hasAccess(prior)) {
          const reason = `already had access for ${sitting}`;
          await Payment.updateOne(
            { _id: payment._id, state: 'waiting' },
            { $set: { student_id: fresh._id, note: noteWithPrior(`duplicate · ${reason}`, prior), ...transition('duplicate', { reason }) } },
            { session },
          );
          // Both representations, while both exist (ROUND_11 rollout order).
          await Fulfilment.updateOne({ payment_id: payment._id }, { $set: { status: 'duplicate', reason, ts: new Date() } }, { session });
          outcome = 'duplicate';
          return;
        }

        const notes = [`stripe ${payment.event_id}`];
        if (payment.email_source === 'payer') notes.push('payer address, no student field');
        await Payment.updateOne(
          { _id: payment._id, state: 'waiting' },
          { $set: { student_id: fresh._id, ...transition('granted') } },
          { session },
        );
        await Fulfilment.updateOne({ payment_id: payment._id }, { $set: { status: 'granted', ts: new Date() }, $unset: { reason: '' } }, { session });
        await Student.updateOne(
          { _id: fresh._id },
          { $set: { access: { sitting, granted_at: new Date(), source: 'stripe', note: noteWithPrior(notes.join(' · '), prior) } } },
          { session },
        );
        outcome = 'granted';
        granted = { to: fresh.email, sitting };
      },
      { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, readPreference: 'primary' },
    );
  } finally {
    await session.endSession();
  }

  if (granted) {
    const { to, sitting } = granted as { to: string; sitting: ExamSitting };
    try {
      await sendEmail({ to, ...accessEmail({ sitting: sittingLabel(sitting) ?? sitting, baseUrl: externalBaseUrl() }) });
    } catch (err) {
      console.error('[access-email] send failed:', err);
    }
  }
  return outcome;
}

/**
 * Registration's side: every waiting payment for the address, oldest first —
 * the first grants, any others are duplicates of it. The account is persisted
 * before this runs, and the webhook persists the payment before it looks for
 * an account, so the two orderings cannot miss each other.
 */
export async function claimWaitingFor(email: string, student: { id: unknown }): Promise<ClaimOutcome[]> {
  const waiting = await Payment.find({ email: email.toLowerCase(), state: 'waiting', session_id: { $type: 'string' } })
    .sort({ received_at: 1 })
    .select('session_id')
    .lean<{ session_id: string }[]>();
  const outcomes: ClaimOutcome[] = [];
  for (const p of waiting) outcomes.push(await claim(p.session_id, student));
  return outcomes;
}
