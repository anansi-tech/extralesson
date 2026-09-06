'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { dbConnect, Payment, Student } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/session';
import { deleteStudent, type DeletionCounts } from '@/lib/delete-student';
import { SITTING_IDS } from '@/lib/sittings';

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
export async function grantAccess(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = IdZ.parse(String(formData.get('id')));
  const sitting = SittingZ.parse(String(formData.get('sitting')));
  const note = String(formData.get('note') ?? '').slice(0, 200);
  await dbConnect();
  const student = await Student.findById(id).select('email').lean<{ email: string } | null>();
  await Student.updateOne(
    { _id: id },
    { $set: { access: { sitting, granted_at: new Date(), source: 'manual', note } } },
  );
  revalidatePath('/admin/access');
  // Success names the account and the sitting, so a slip is seen at once (ROUND_7 Task 3).
  redirect(`/admin/access?granted=${encodeURIComponent(student?.email ?? id)}&sitting=${sitting}`);
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
  revalidatePath('/admin/access');
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
