'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbConnect, Student } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/session';

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
