import { Fulfilment, Payment, Student } from '@/lib/db';
import type { ExamSitting } from '@/lib/types';
import type { EmailSource } from '@/lib/stripe-webhook';

/**
 * A PAYMENT AND AN ACCOUNT HAVE FOUND EACH OTHER, in either ordering. Written
 * once so the two paths cannot grant differently; /admin/access stays for the
 * cases no account will ever arrive for — a typo'd address, a refund, a comp.
 */
export async function grantFromPayment(args: {
  studentId: unknown;
  /** The sitting the student registered for. This is the sitting granted. */
  registeredSitting: ExamSitting;
  payment: {
    _id: unknown;
    event_id: string;
    email_source?: EmailSource | null;
  };
}): Promise<'granted'> {
  const { studentId, registeredSitting, payment } = args;

  // THE REGISTERED SITTING WINS, ALWAYS. A payment link sells access, not a
  // sitting, and the payer is often not the student. The failure is asymmetric:
  // granting May/June to a January student is generous, granting January to a
  // May/June student locks them out before the exam they are revising for.
  const sitting = registeredSitting;

  const notes = [`stripe ${payment.event_id}`];
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
  // The fulfilment, if the webhook opened one, is now what it says it is.
  await Fulfilment.updateOne({ payment_id: payment._id }, { $set: { status: 'granted', ts: new Date() }, $unset: { reason: '' } });
  return 'granted';
}

/**
 * The payment waiting for this address, if there is one. Oldest first: if
 * someone paid twice, the first is the one they have been waiting on, and the
 * second stays unmatched on /admin/access for a person to look at.
 */
export async function pendingPaymentFor(email: string) {
  return Payment.findOne({ email: email.toLowerCase(), student_id: null, resolved_at: null })
    .sort({ received_at: 1 })
    .lean<{
      _id: unknown;
      event_id: string;
      email_source?: EmailSource | null;
    } | null>();
}
