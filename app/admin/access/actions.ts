'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbConnect, Payment, Student } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/session';
import { deleteStudent, type DeletionCounts } from '@/lib/delete-student';

export type DeleteAccountState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'done'; message: string; counts: DeletionCounts; at: string };

const IdZ = z.string().regex(/^[a-f0-9]{24}$/);
const SittingZ = z.enum(['jan-2027', 'may-june-2027']);

/**
 * Access is granted BY HAND, against a payment matched on the email the student
 * used. There is no webhook and no auto-provisioning: at a hundred customers,
 * matching by hand is the right amount of machinery, and a wrong grant is
 * undone here in one click rather than debugged in a delivery log.
 *
 * The note is where the evidence goes — a Stripe payment id, "comp", "refunded
 * 3 Sep". It is why a grant can be explained six months later.
 */
export async function grantAccess(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = IdZ.parse(String(formData.get('id')));
  const sitting = SittingZ.parse(String(formData.get('sitting')));
  const note = String(formData.get('note') ?? '').slice(0, 200);
  await dbConnect();
  await Student.updateOne(
    { _id: id },
    { $set: { access: { sitting, granted_at: new Date(), source: 'manual', note } } },
  );
  revalidatePath('/admin/access');
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
 * An unmatched payment, dealt with. Marking it resolved is deliberately
 * separate from granting: they are usually the same act, but a refund or a
 * duplicate charge is resolved without anyone gaining access, and conflating
 * them would hide that.
 */
export async function resolvePayment(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = IdZ.parse(String(formData.get('id')));
  await dbConnect();
  await Payment.updateOne({ _id: id }, { $set: { resolved_at: new Date() } });
  revalidatePath('/admin/access');
}

/**
 * DELETE AN ACCOUNT AND EVERYTHING ATTACHED.
 *
 * Deliberately not a button beside Revoke. A destructive action sitting next
 * to a routine one is how the wrong row goes, so this asks for the address to
 * be TYPED: revoking is a click, deleting is a sentence you have to mean.
 *
 * The counts come back to the caller rather than going to a log. An audit row
 * naming the deleted address would leave the person in the database after they
 * asked to leave it, which is the thing the deletion was for.
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
