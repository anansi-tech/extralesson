import { Fulfilment, Payment, Student } from '@/lib/db';
import { hasAccess, type Access } from '@/lib/access';
import { noteWithPrior } from '@/lib/grant-note';
import { transition } from '@/lib/payment-state';
import type { ExamSitting } from '@/lib/types';
import { accessEmail, sendEmail } from '@/lib/email';
import { externalBaseUrl } from '@/lib/base-url';
import { sittingLabel } from '@/lib/sittings';

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
  };
}): Promise<'granted' | 'duplicate'> {
  const { studentId, registeredSitting, payment } = args;

  // THE REGISTERED SITTING WINS, ALWAYS. A payment link sells access, not a
  // sitting, and the payer is often not the student. The failure is asymmetric:
  // granting May/June to a January student is generous, granting January to a
  // May/June student locks them out before the exam they are revising for.
  const sitting = registeredSitting;

  const notes = [`stripe ${payment.event_id}`];

  const before = await Student.findById(studentId).select('email access').lean<{ email: string; access?: Access | null } | null>();
  const prior = before?.access ?? null;

  // A SECOND PAYMENT FOR A SITTING ALREADY COVERED buys nothing, so it grants
  // nothing: overwriting would move granted_at and lose the note that says how
  // the access was given. The money is real, so it is flagged for a refund
  // rather than swallowed. A grant for another sitting, or an expired one, is
  // replaced as before — that payment did buy something.
  if (prior && prior.sitting === sitting && hasAccess(prior)) {
    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: {
          student_id: studentId,
          note: noteWithPrior(`duplicate · already had access for ${sitting}`, prior),
          ...transition('duplicate', { reason: `already had access for ${sitting}` }),
        },
      },
    );
    await Fulfilment.updateOne(
      { payment_id: payment._id },
      { $set: { status: 'duplicate', reason: `already had access for ${sitting}`, ts: new Date() } },
    );
    return 'duplicate';
  }

  await Student.updateOne(
    { _id: studentId },
    {
      $set: {
        access: {
          sitting,
          granted_at: new Date(),
          source: 'stripe',
          note: noteWithPrior(notes.join(' · '), prior),
        },
      },
    },
  );
  // Attaching the student is what takes it off the unmatched list, so it
  // happens here rather than being left to the caller to remember.
  await Payment.updateOne({ _id: payment._id }, { $set: { student_id: studentId, ...transition('granted') } });
  // The fulfilment, if the webhook opened one, is now what it says it is.
  await Fulfilment.updateOne({ payment_id: payment._id }, { $set: { status: 'granted', ts: new Date() }, $unset: { reason: '' } });
  // The student is told (ROUND_9 Task 7). A mail that does not go out must not
  // undo a grant that did: the failure is logged and the grant stands.
  const student = before;
  if (student) {
    try {
      await sendEmail({ to: student.email, ...accessEmail({ sitting: sittingLabel(sitting) ?? sitting, baseUrl: externalBaseUrl() }) });
    } catch (err) {
      console.error('[access-email] send failed:', err);
    }
  }
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
    } | null>();
}
