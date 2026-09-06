import { Fulfilment, Payment, Student } from '@/lib/db';
import { sittingLabel } from '@/lib/sittings';

/** The confirming page asks again every three seconds, for a minute. */
export const POLL_EVERY_MS = 3000;
export const POLL_FOR_MS = 60_000;

export function pollDue(startedAt: number, now: number): boolean {
  return now - startedAt < POLL_FOR_MS;
}

/** Everyone but the signed-in owner sees the address as k···@example.com. */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '···';
  return `${email[0]}···${email.slice(at)}`;
}

/**
 * WHO IS HOLDING THE PHONE after checkout (ROUND_9 Task 1). The webhook wrote
 * a Fulfilment for the checkout session; this reads it and the account on the
 * payment's address. Confirming means keep asking; settled means stop asking
 * and say the receipt is in their email — a refused or failed fulfilment is
 * never shown as an error.
 */
export type WelcomeState =
  | { state: 'confirming'; settled: boolean }
  | { state: 'payer'; email: string; sitting: string | null; studentId: string }
  | { state: 'unregistered'; email: string }
  | { state: 'other'; email: string; sitting: string | null };

export async function resolveWelcome(sessionId: string, viewer: { student_id: string } | null): Promise<WelcomeState> {
  const fulfilment = await Fulfilment.findOne({ session_id: sessionId })
    .select('status payment_id')
    .lean<{ status: string; payment_id?: unknown } | null>();
  if (!fulfilment) return { state: 'confirming', settled: false };
  if (fulfilment.status === 'refused' || fulfilment.status === 'failed' || !fulfilment.payment_id) {
    return { state: 'confirming', settled: true };
  }
  const payment = await Payment.findById(fulfilment.payment_id).select('email').lean<{ email?: string } | null>();
  const email = payment?.email?.toLowerCase();
  if (!email) return { state: 'confirming', settled: true };

  const student = await Student.findOne({ email })
    .select('exam_sitting access')
    .lean<{ _id: unknown; exam_sitting: string; access?: { sitting: string } } | null>();
  if (!student) return viewer ? { state: 'other', email, sitting: null } : { state: 'unregistered', email };
  // The account exists and the grant is in flight: the next poll will see it.
  if (fulfilment.status !== 'granted') return { state: 'confirming', settled: false };

  const sitting = sittingLabel(student.access?.sitting ?? student.exam_sitting);
  if (viewer && viewer.student_id === String(student._id)) {
    return { state: 'payer', email, sitting, studentId: String(student._id) };
  }
  return { state: 'other', email, sitting };
}
