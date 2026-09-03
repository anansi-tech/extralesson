'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbConnect, Question } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/session';
import { QuestionDraftZ } from '@/lib/validation/question';
import { approvalGate } from '@/lib/generation/approve-gate';

const IdZ = z.string().regex(/^[a-f0-9]{24}$/);

export async function approveQuestion(id: string): Promise<void> {
  await requireAdmin();
  await dbConnect();
  await Question.updateOne({ _id: IdZ.parse(id), status: 'draft' }, { $set: { status: 'approved' } });
  revalidatePath('/admin/review');
}

// Retiring reaches APPROVED questions too, not only drafts: a defect class
// found after approval would otherwise be a script-only fix, visible to the
// reviewer and not actionable. It is a status change, reversible, and deletes
// nothing.
export async function rejectQuestion(id: string): Promise<void> {
  await requireAdmin();
  await dbConnect();
  await Question.updateOne(
    { _id: IdZ.parse(id), status: { $in: ['draft', 'approved'] } },
    { $set: { status: 'retired' } },
  );
  revalidatePath('/admin/review');
}

/** Put a retired question back in the queue — the undo for the above. */
export async function restoreQuestion(id: string): Promise<void> {
  await requireAdmin();
  await dbConnect();
  await Question.updateOne({ _id: IdZ.parse(id), status: 'retired' }, { $set: { status: 'draft' } });
  revalidatePath('/admin/review');
}

// Save an edit, WITHOUT approving: editing and approving are two judgements.
// The gates run HERE, on save, because this is where the content changes;
// approveQuestion is deliberately ungated because it approves a draft that has
// already passed them. Saving without re-verifying would let edited content
// reach a student unchecked.
export async function saveQuestionEdit(
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
  const gate = await approvalGate(validated.data);
  if (!gate.ok) {
    return { error: gate.reason };
  }
  await dbConnect();
  await Question.updateOne(
    { _id: IdZ.parse(id), status: 'draft' },
    { $set: { ...validated.data, status: 'draft' } },
  );
  revalidatePath('/admin/review');
  return {};
}
