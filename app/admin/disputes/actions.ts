'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbConnect, DisputeReview, MarkDispute } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/session';

const ReviewZ = z.object({
  disputeId: z.string().regex(/^[a-f0-9]{24}$/),
  note: z.string().trim().min(3).max(2000),
});

/** One look, recorded; nothing about the mark changes (ROUND_7 Task 3). */
export async function reviewDispute(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = ReviewZ.safeParse({ disputeId: formData.get('disputeId'), note: formData.get('note') });
  if (!parsed.success) return;
  await dbConnect();
  if (!(await MarkDispute.exists({ _id: parsed.data.disputeId }))) return;
  await DisputeReview.create({ dispute_id: parsed.data.disputeId, note: parsed.data.note });
  revalidatePath('/admin/disputes');
  revalidatePath(`/admin/disputes/${parsed.data.disputeId}`);
}
