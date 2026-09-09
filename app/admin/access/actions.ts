'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { dbConnect, Fulfilment, Payment, Student } from '@/lib/db';
import { grantFromPayment } from '@/lib/grant-from-payment';
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
  await requireAdmin();
  const id = IdZ.parse(String(formData.get('id')));
  // A reason is the record: a payment resolved with none is a payment nobody can explain later.
  const reason = String(formData.get('reason') ?? '').trim().slice(0, 200);
  if (reason.length < 3) return;
  await dbConnect();
  await Payment.updateOne({ _id: id }, { $set: { resolved_at: new Date(), note: `resolved: ${reason}` } });
  // The record it opened closes with it: the attention list reads the
  // fulfilment, so a payment resolved without this stayed on the list forever.
  await Fulfilment.updateOne({ payment_id: id }, { $set: { status: 'resolved', reason, ts: new Date() } });
  revalidatePath('/admin/access');
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
  const payment = await Payment.findById(id).select('event_id email_source').lean<{ _id: unknown; event_id: string; email_source?: 'custom_field' | 'payer' | null } | null>();
  if (!payment) redirect('/admin/access');
  const outcome = await grantFromPayment({
    studentId: student._id,
    registeredSitting: student.exam_sitting,
    payment: { _id: payment._id, event_id: payment.event_id, email_source: payment.email_source },
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
