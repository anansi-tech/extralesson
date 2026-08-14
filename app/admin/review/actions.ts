'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbConnect, Question } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/session';
import { QuestionDraftZ } from '@/lib/validation/question';

const IdZ = z.string().regex(/^[a-f0-9]{24}$/);

export async function approveQuestion(id: string): Promise<void> {
  await requireAdmin();
  await dbConnect();
  await Question.updateOne({ _id: IdZ.parse(id), status: 'draft' }, { $set: { status: 'approved' } });
  revalidatePath('/admin/review');
}

export async function rejectQuestion(id: string): Promise<void> {
  await requireAdmin();
  await dbConnect();
  await Question.updateOne({ _id: IdZ.parse(id), status: 'draft' }, { $set: { status: 'retired' } });
  revalidatePath('/admin/review');
}

// Edit -> Approve: the reviewer edits the question JSON; it must pass the same
// Zod boundary as generated drafts before it can be approved.
export async function editAndApproveQuestion(
  id: string,
  editedJson: string,
): Promise<{ error?: string }> {
  await requireAdmin();
  let parsed: unknown;
  try {
    parsed = JSON.parse(editedJson);
  } catch {
    return { error: 'Not valid JSON.' };
  }
  const validated = QuestionDraftZ.safeParse(parsed);
  if (!validated.success) {
    const issue = validated.error.issues[0];
    return { error: `${issue?.path.join('.') || 'question'}: ${issue?.message}` };
  }
  await dbConnect();
  await Question.updateOne(
    { _id: IdZ.parse(id), status: 'draft' },
    { $set: { ...validated.data, status: 'approved' } },
  );
  revalidatePath('/admin/review');
  return {};
}
