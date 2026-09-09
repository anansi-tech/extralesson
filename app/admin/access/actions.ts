'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { dbConnect, Fulfilment, Payment, Student } from '@/lib/db';
import { grantFromPayment } from '@/lib/grant-from-payment';
import { QUEUE_STATES, transition } from '@/lib/payment-state';
import { claim } from '@/lib/claim';
import { requireAdmin } from '@/lib/auth/session';
import { deleteStudent, type DeletionCounts } from '@/lib/delete-student';
import { SITTING_IDS } from '@/lib/sittings';
import type { ExamSitting } from '@/lib/types';
import { noteWithPrior } from '@/lib/grant-note';
import type { Access } from '@/lib/access';

export type DeleteAccountState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'done'; message: string; counts: DeletionCounts; at: string };

const IdZ = z.string().regex(/^[a-f0-9]{24}$/);
const SittingZ = z.enum(SITTING_IDS);

/**
 * Granting by hand, for the cases no automatic path can settle. A wrong grant
 * is undone in one click and an unmatched payment surfaces here instead of
 * vanishing; the note carries the evidence. See ROUND_2 §8c.
 */
/** By the row's account, or by the address typed into the standalone form. */
export async function grantAccess(formData: FormData): Promise<void> {
  await requireAdmin();
  const rowId = String(formData.get('id') ?? '');
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const sitting = SittingZ.parse(String(formData.get('sitting')));
  const note = String(formData.get('note') ?? '').slice(0, 200);
  await dbConnect();
  const student = rowId
    ? await Student.findById(IdZ.parse(rowId)).select('email access').lean<{ _id: unknown; email: string; access?: Access | null } | null>()
    : await Student.findOne({ email }).select('email access').lean<{ _id: unknown; email: string; access?: Access | null } | null>();
  // An address with no account is worth naming: the payer registered with another one.
  if (!student) redirect(`/admin/access?ungranted=${encodeURIComponent(email)}`);
  const id = String(student._id);
  await Student.updateOne(
    { _id: id },
    { $set: { access: { sitting, granted_at: new Date(), source: 'manual', note: noteWithPrior(note, student.access) } } },
  );
  revalidatePath('/admin/access');
  // Success names the account and the sitting, so a slip is seen at once (ROUND_7 Task 3).
  redirect(`/admin/access?granted=${encodeURIComponent(student.email)}&sitting=${sitting}`);
}

/** Refunds, chargebacks, and grants made against the wrong account. */
export async function revokeAccess(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = IdZ.parse(String(formData.get('id')));
  await dbConnect();
  await Student.updateOne({ _id: id }, { $unset: { access: '' } });
  revalidatePath('/admin/access');
}

/**
 * Resolving is deliberately separate from granting: a refund or a duplicate
 * charge is resolved without anyone gaining access, and conflating the two
 * would hide that.
 */
export async function resolvePayment(formData: FormData): Promise<void> {
  const operator = await requireAdmin();
  const id = IdZ.parse(String(formData.get('id')));
  // A reason is the record: a payment resolved with none is a payment nobody can explain later.
  const reason = String(formData.get('reason') ?? '').trim().slice(0, 200);
  if (reason.length < 3) return;
  await dbConnect();
  await Payment.updateOne(
    { _id: id },
    { $set: { resolved_at: new Date(), note: `resolved: ${reason}`, ...transition('closed', { reason, by: operator.email }) } },
  );
  // The record it opened closes with it: the attention list reads the
  // fulfilment, so a payment resolved without this stayed on the list forever.
  await Fulfilment.updateOne({ payment_id: id }, { $set: { status: 'resolved', reason, ts: new Date() } });
  revalidatePath('/admin/access');
}

/**
 * CLOSING A PAYMENT (ROUND_11 Task 4): settled by a person, without granting.
 * Conditional on the states that carry an obligation, so a form left open
 * while the payment was granted elsewhere closes nothing and says so. The
 * reason, the operator and the time are the record of who decided.
 */
export async function closePayment(formData: FormData): Promise<void> {
  const operator = await requireAdmin();
  const id = IdZ.parse(String(formData.get('id')));
  const reason = String(formData.get('reason') ?? '').trim().slice(0, 200);
  if (reason.length < 3) redirect('/admin/access?noreason=1');
  await dbConnect();
  const closed = await Payment.updateOne(
    { _id: id, state: { $in: QUEUE_STATES } },
    { $set: { ...transition('closed', { reason, by: operator.email }), resolved_at: new Date(), note: `resolved: ${reason}` } },
  );
  if (closed.matchedCount === 0) {
    revalidatePath('/admin/access');
    redirect('/admin/access?stale=1');
  }
  // Both representations, while both exist (ROUND_11 rollout order).
  await Fulfilment.updateOne({ payment_id: id }, { $set: { status: 'resolved', reason, ts: new Date() } });
  revalidatePath('/admin/access');
  redirect('/admin/access?closed=1');
}

/**
 * GRANTING A QUEUED PAYMENT TO AN ACCOUNT (ROUND_11 Task 4). The claim is the
 * one operation that assigns access, so a sitting already covered moves the
 * row to duplicate rather than overwriting the grant, and a payment that is
 * no longer waiting grants nothing.
 */
export async function grantQueued(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = IdZ.parse(String(formData.get('id')));
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  await dbConnect();
  const student = await Student.findOne({ email }).select('_id').lean<{ _id: unknown } | null>();
  if (!student) redirect(`/admin/access?ungranted=${encodeURIComponent(email)}`);
  const payment = await Payment.findById(id).select('session_id').lean<{ session_id?: string } | null>();
  if (!payment?.session_id) redirect('/admin/access?nosession=1');
  const outcome = await claim(payment.session_id, { id: student._id });
  revalidatePath('/admin/access');
  if (outcome === 'granted') redirect(`/admin/access?granted=${encodeURIComponent(email)}`);
  if (outcome === 'duplicate') redirect(`/admin/access?duplicate=${encodeURIComponent(email)}`);
  redirect('/admin/access?stale=1');
}

/**
 * An unmatched payment, given the account it belongs to. The grant runs
 * through the same path the webhook uses, so the sitting is the account's
 * registered one, a sitting already covered is flagged rather than
 * overwritten, and the payment and its fulfilment close either way.
 */
export async function matchPayment(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = IdZ.parse(String(formData.get('id')));
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  await dbConnect();
  const student = await Student.findOne({ email }).select('exam_sitting').lean<{ _id: unknown; exam_sitting: ExamSitting } | null>();
  if (!student) redirect(`/admin/access?ungranted=${encodeURIComponent(email)}`);
  const payment = await Payment.findById(id).select('event_id').lean<{ _id: unknown; event_id: string } | null>();
  if (!payment) redirect('/admin/access');
  const outcome = await grantFromPayment({
    studentId: student._id,
    registeredSitting: student.exam_sitting,
    payment: { _id: payment._id, event_id: payment.event_id },
  });
  revalidatePath('/admin/access');
  if (outcome === 'duplicate') redirect(`/admin/access?ungranted=${encodeURIComponent(email)}&duplicate=1`);
  redirect(`/admin/access?granted=${encodeURIComponent(email)}&sitting=${student.exam_sitting}`);
}

/**
 * The address must be TYPED: revoking is a click, deleting is a sentence you
 * have to mean. Counts return to the caller and never to a log — an audit row
 * naming the deleted address would leave the person after they asked to leave.
 */
export async function deleteStudentAccount(
  _previous: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  await requireAdmin();
  const typed = String(formData.get('email') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  if (typed.trim().toLowerCase() !== confirm.trim().toLowerCase()) {
    return { status: 'error', message: 'The two addresses do not match.' };
  }
  await dbConnect();
  const result = await deleteStudent(typed);
  if (!result.ok) return { status: 'error', message: result.reason };
  revalidatePath('/admin/access');
  return { status: 'done', message: 'Account deleted.', counts: result.counts, at: new Date().toISOString() };
}
