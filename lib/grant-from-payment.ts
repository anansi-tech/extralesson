import { Payment, Student } from '@/lib/db';
import type { ExamSitting } from '@/lib/types';
import type { EmailSource } from '@/lib/stripe-webhook';

/**
 * A PAYMENT AND AN ACCOUNT HAVE FOUND EACH OTHER.
 *
 * Two orderings, one act. Stripe fires after the student registered — the
 * webhook has both in hand. Or the student pays first and registers afterwards,
 * which is the ordering the checkout caption actually invites ("sign up with
 * the address you paid with"), and then the payment sat unmatched on
 * /admin/access waiting for someone to notice.
 *
 * Written once so the two paths cannot grant differently. The unmatched surface
 * stays for what it was built for: a typo'd address, a refund, a comp — cases
 * where no account will ever arrive on its own.
 */
export async function grantFromPayment(args: {
  studentId: unknown;
  /** The sitting the student registered for. This is the sitting granted. */
  registeredSitting: ExamSitting;
  payment: {
    _id: unknown;
    event_id: string;
    /** What the payment LINK said, when a mapping exists. Evidence only. */
    sitting?: string | null;
    email_source?: EmailSource | null;
  };
}): Promise<'granted'> {
  const { studentId, registeredSitting, payment } = args;

  // THE REGISTERED SITTING WINS, ALWAYS.
  //
  // A payment link sells access, not a sitting, so it carries no information
  // about which exam anyone sits. The student knows; the payer often is not
  // the student and may not.
  //
  // The failure is also asymmetric, which decides it even if links ever do
  // become per-sitting products. Granting May/June to a January student is
  // generous: they keep access past their paper. Granting January to a May/June
  // student locks them out in February, before the exam they are revising for,
  // and they read that as the product taking their money and closing. Of the
  // two ways to be wrong, only one costs a student their sitting.
  const sitting = registeredSitting;

  // A mapped link that DISAGREES is recorded rather than resolved quietly —
  // the same principle the webhook already held: a wrong sitting must be
  // visible on /admin/access, not chosen silently.
  const notes = [`stripe ${payment.event_id}`];
  if (payment.sitting && payment.sitting !== registeredSitting) {
    notes.push(`link says ${payment.sitting}`);
  }
  if (payment.email_source === 'payer') {
    notes.push('payer address, no student field');
  }

  await Student.updateOne(
    { _id: studentId },
    {
      $set: {
        access: {
          sitting,
          granted_at: new Date(),
          source: 'stripe',
          note: notes.join(' · '),
        },
      },
    },
  );
  // Attaching the student is what takes it off the unmatched list, so it
  // happens here rather than being left to the caller to remember.
  await Payment.updateOne({ _id: payment._id }, { $set: { student_id: studentId } });
  return 'granted';
}

/**
 * The payment waiting for this address, if there is one.
 *
 * Oldest first: if someone paid twice, the first payment is the one they have
 * been waiting on. The second stays unmatched and shows on /admin/access, which
 * is right — a double charge is exactly the case a person should look at.
 */
export async function pendingPaymentFor(email: string) {
  return Payment.findOne({ email: email.toLowerCase(), student_id: null, resolved_at: null })
    .sort({ received_at: 1 })
    .lean<{
      _id: unknown;
      event_id: string;
      sitting?: string | null;
      email_source?: EmailSource | null;
    } | null>();
}
