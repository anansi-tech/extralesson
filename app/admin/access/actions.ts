'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { dbConnect, Payment, Student } from '@/lib/db';
import { QUEUE_STATES, transition } from '@/lib/payment-state';
import { claim } from '@/lib/claim';
import { refundAndRevoke, revokeComp } from '@/lib/refund';
import { RefundRequest } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/session';
import { deleteStudent, type DeletionCounts } from '@/lib/delete-student';
import { SITTING_IDS } from '@/lib/sittings';
import type { ExamSitting } from '@/lib/types';
import { GRANT_CLASSES, grantNote, noteWithPrior } from '@/lib/grant-note';
import type { Access } from '@/lib/access';

export type DeleteAccountState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'done'; message: string; counts: DeletionCounts; at: string };

const IdZ = z.string().regex(/^[a-f0-9]{24}$/);
const SittingZ = z.enum(SITTING_IDS);
const GrantClassZ = z.enum(GRANT_CLASSES);

/**
 * Granting by hand, for the cases no automatic path can settle. A wrong grant
 * is undone in one click and an unmatched payment surfaces here instead of
 * vanishing; the note carries the evidence. See ROUND_2 §8c.
 */
/**
 * The sitting an account is registered for, so the form can preselect it. Null
 * for an address with no account: there is nothing to preselect and the form
 * says so rather than guessing.
 */
export async function sittingFor(email: string): Promise<string | null> {
  await requireAdmin();
  await dbConnect();
  const s = await Student.findOne({ email: String(email).trim().toLowerCase() })
    .select('exam_sitting')
    .lean<{ exam_sitting: string } | null>();
  return s?.exam_sitting ?? null;
}

/** By the row's account, or by the address typed into the standalone form. */
export async function grantAccess(formData: FormData): Promise<void> {
  await requireAdmin();
  const rowId = String(formData.get('id') ?? '');
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const chosen = SittingZ.safeParse(String(formData.get('sitting')));
  if (!chosen.success) redirect('/admin/access?nositting=1');
  const sitting = chosen.data;
  // The class is one of two and the date is ours; the operator says only why.
  const kind = GrantClassZ.parse(String(formData.get('class') ?? ''));
  const reason = String(formData.get('reason') ?? '').trim();
  if (reason.length < 3) redirect('/admin/access?noreason=1');
  const note = grantNote(kind, reason);
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
 * REFUND AND REVOKE, from the one operation that does it (ROUND_12 Task 4).
 * The reason is required for the same purpose a close's is: a refund nobody
 * can explain later is a refund nobody can defend.
 */
export async function refundPayment(formData: FormData): Promise<void> {
  const operator = await requireAdmin();
  const id = IdZ.parse(String(formData.get('id')));
  const reason = String(formData.get('reason') ?? '').trim().slice(0, 200);
  if (reason.length < 3) redirect('/admin/access?noreason=1');
  await dbConnect();
  const outcome = await refundAndRevoke(id, { email: operator.email }, reason);
  revalidatePath('/admin/access');
  redirect(`/admin/access?refund=${outcome}`);
}

/**
 * DISMISSING A REQUEST (ROUND_12 Task 5) closes it directly, with the reason:
 * nothing is refunded and nothing is revoked. The row and its resolution are
 * kept, because a request nobody can explain later is the same problem as a
 * payment nobody can explain later.
 */
export async function dismissRequest(formData: FormData): Promise<void> {
  const operator = await requireAdmin();
  const id = IdZ.parse(String(formData.get('id')));
  const reason = String(formData.get('reason') ?? '').trim().slice(0, 200);
  if (reason.length < 3) redirect('/admin/access?noreason=1');
  await dbConnect();
  await RefundRequest.updateOne(
    { payment_id: id, state: 'open' },
    { $set: { state: 'resolved', resolved_at: new Date(), resolved_by: operator.email, resolution_reason: `dismissed: ${reason}` } },
  );
  revalidatePath('/admin/access');
  redirect('/admin/access?dismissed=1');
}

/**
 * A COMP HAS NO PAYMENT, so revoking one calls nobody: it is a record, with
 * the reason, the operator and the time. The grant is ended, never erased.
 */
export async function revokeGrant(formData: FormData): Promise<void> {
  const operator = await requireAdmin();
  const id = IdZ.parse(String(formData.get('id')));
  const reason = String(formData.get('reason') ?? '').trim().slice(0, 200);
  if (reason.length < 3) redirect('/admin/access?noreason=1');
  await dbConnect();
  const outcome = await revokeComp(id, { email: operator.email }, reason);
  revalidatePath('/admin/access');
  redirect(`/admin/access?revoked=${outcome}`);
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
    { $set: { ...transition('closed', { reason, by: operator.email }) } },
  );
  if (closed.matchedCount === 0) {
    revalidatePath('/admin/access');
    redirect('/admin/access?stale=1');
  }
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
