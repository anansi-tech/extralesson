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

// Retiring reaches APPROVED questions too, not only drafts. Twice in one day a
// defect class was found in questions that had already been approved, and the
// only way to retire them was a script — the reviewer could see the problem on
// the page and could not act on it. Retiring is a status change and is
// reversible; nothing is deleted.
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

// Save an edit, WITHOUT approving. The reviewer then reads the rendered result
// and approves it in the ordinary way if they agree — editing and approving are
// two judgements and were one button.
//
// The gates run HERE, on save, because this is where the content changes.
// approveQuestion is deliberately ungated: it approves a draft that has already
// passed the generation gates. If an edit could be saved without re-verifying,
// the pair of actions would let edited content reach a student unchecked, which
// is exactly what the old combined action existed to prevent.
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
