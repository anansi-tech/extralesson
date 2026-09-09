import { Payment, Student } from '@/lib/db';
import { sittingLabel } from '@/lib/sittings';

/** The confirming page asks again every three seconds, for a minute. */
export const POLL_EVERY_MS = 3000;
export const POLL_FOR_MS = 60_000;

export function pollDue(startedAt: number, now: number): boolean {
  return now - startedAt < POLL_FOR_MS;
}

/**
 * WHO IS HOLDING THE PHONE after checkout (ROUND_9 Task 1; ROUND_11 Task 4).
 * Read from the Payment for the checkout session, which is the one record of
 * what happened to the money. Once it is granted the account is the one the
 * payment reached — by its `student_id`, never by the address paid with, so a
 * typo corrected by an operator produces the right page. Confirming means
 * keep asking; settled means stop asking and say the receipt is in their
 * email. Nothing here is ever shown as an error.
 */
export type WelcomeState =
  | { state: 'confirming'; settled: boolean }
  | { state: 'payer'; email: string; sitting: string | null; studentId: string }
  | { state: 'unregistered'; email: string }
  | { state: 'other'; email: string; sitting: string | null };

export async function resolveWelcome(sessionId: string, viewer: { student_id: string } | null): Promise<WelcomeState> {
  const payment = await Payment.findOne({ session_id: sessionId })
    .select('state email student_id')
    .lean<{ state?: string; email?: string; student_id?: unknown } | null>();
  // Nothing recorded yet: the delivery is still on its way.
  if (!payment) return { state: 'confirming', settled: false };
  // Settled without an account to name: not ours, or a person closed it.
  if (payment.state === 'refused' || payment.state === 'closed') return { state: 'confirming', settled: true };

  // The account this payment REACHED, whatever address paid for it: an
  // operator who corrected a typo granted somebody the payer never named.
  if ((payment.state === 'granted' || payment.state === 'duplicate') && payment.student_id) {
    const holder = await Student.findById(payment.student_id).select('email access').lean<{ _id: unknown; email: string; access?: { sitting: string } } | null>();
    if (holder) {
      const sitting = holder.access ? sittingLabel(holder.access.sitting) : null;
      return viewer && viewer.student_id === String(holder._id)
        ? { state: 'payer', email: holder.email, sitting, studentId: String(holder._id) }
        : { state: 'other', email: holder.email, sitting };
    }
  }

  const email = payment.email?.toLowerCase();
  // Paid, with no address we could use: there is nobody to name yet.
  if (!email) return { state: 'confirming', settled: true };

  const student = await Student.findOne({ email }).select('access').lean<{ _id: unknown; access?: { sitting: string } } | null>();
  if (!student) return viewer ? { state: 'other', email, sitting: null } : { state: 'unregistered', email };
  // The account exists and the claim is in flight: the next poll will see it.
  return { state: 'confirming', settled: false };
}
