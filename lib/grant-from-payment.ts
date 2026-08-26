import { Payment, Student } from '@/lib/db';
import type { ExamSitting } from '@/lib/types';

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
  /** The sitting the student registered for; used when the link is unmapped. */
  registeredSitting: ExamSitting;
  payment: { _id: unknown; event_id: string; sitting?: string | null };
}): Promise<'granted'> {
  const { studentId, registeredSitting, payment } = args;
  const sitting = (payment.sitting as ExamSitting | undefined) ?? registeredSitting;
  const fromRegistration = !payment.sitting;

  await Student.updateOne(
    { _id: studentId },
    {
      $set: {
        access: {
          sitting,
          granted_at: new Date(),
          source: 'stripe',
          note: fromRegistration
            ? `stripe ${payment.event_id} · sitting from registration`
            : `stripe ${payment.event_id}`,
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
    .lean<{ _id: unknown; event_id: string; sitting?: string | null } | null>();
}
