'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbConnect, Question } from '@/lib/db';
import { snapshotLongMath } from '@/lib/admin/long-math-fixture';
import { requireAdmin } from '@/lib/auth/session';
import { QuestionDraftZ } from '@/lib/validation/question';
import { approvalGate } from '@/lib/generation/approve-gate';
import { hintsOrProblems } from '@/lib/generation/hints';
import { earnableByMethod } from '@/lib/grade/method-marks';

const IdZ = z.string().regex(/^[a-f0-9]{24}$/);

/**
 * A WRITE THAT MATCHED NOTHING IS NOT A SUCCESS. Every action here filters on
 * a status as well as an id, so a card left open while the row moved writes
 * nothing — and used to return as though it had, which read as saved.
 */
function refused({ matchedCount }: { matchedCount: number }, state: string): string | undefined {
  return matchedCount === 0 ? `Nothing was written: this question is ${state}. Reload the card.` : undefined;
}

export type ApproveResult = { ok: true; hints: Record<string, string> } | { ok: false; error: string; problems: { code: string; hint?: string; problem: string }[] };

/**
 * APPROVAL WRITES THE HINTS (ROUND_7 follow-up): every method row gets its
 * second-person hint from the same generator and checks as a batch, and a
 * question with a row that fails a check is not approved until the row is
 * fixed. `pnpm hints:next` stays the repair for a count that ever slips.
 */
export async function approveQuestion(id: string): Promise<ApproveResult> {
  await requireAdmin();
  await dbConnect();
  const q = await Question.findOne({ _id: IdZ.parse(id), status: 'draft' })
    .select('stem worked_solution parts rubric')
    .lean<{ stem: string; worked_solution: string; parts?: never[]; rubric?: { code: string; criterion: string; hint?: string }[] } | null>();
  if (!q) return { ok: false, error: 'Not a draft.', problems: [] };
  const wanted = earnableByMethod(q as never, []).filter((r) => !r.hint);
  const hints: Record<string, string> = {};
  if (wanted.length) {
    const result = await hintsOrProblems(q, wanted);
    if (result.problems.length) {
      return { ok: false, error: `${result.problems.length} hint${result.problems.length === 1 ? '' : 's'} failed a check; fix the row and approve again.`, problems: result.problems };
    }
    for (const [code, hint] of result.hints) hints[code] = hint;
  }
  const set: Record<string, unknown> = { status: 'approved' };
  (q.rubric ?? []).forEach((r, i) => {
    if (hints[r.code]) set[`rubric.${i}.hint`] = hints[r.code];
  });
  const written = await Question.updateOne({ _id: id, status: 'draft' }, { $set: set });
  const gone = refused(written, 'no longer a draft');
  if (gone) return { ok: false, error: gone, problems: [] };
  // The bank grew, so the width fixture is taken again; an approval never fails on it.
  await snapshotLongMath().catch((e) => console.error('[long-math] snapshot failed:', e));
  revalidatePath('/admin/review');
  return { ok: true, hints };
}

// Retiring reaches APPROVED questions too, not only drafts: a defect class
// found after approval would otherwise be a script-only fix, visible to the
// reviewer and not actionable. It is a status change, reversible, and deletes
// nothing.
export async function rejectQuestion(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  await dbConnect();
  const written = await Question.updateOne(
    { _id: IdZ.parse(id), status: { $in: ['draft', 'approved'] } },
    { $set: { status: 'retired' } },
  );
  const gone = refused(written, 'already retired, or no longer in the bank');
  if (gone) return { error: gone };
  revalidatePath('/admin/review');
  return {};
}

/** Put a retired question back in the queue — the undo for the above. */
export async function restoreQuestion(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  await dbConnect();
  const written = await Question.updateOne({ _id: IdZ.parse(id), status: 'retired' }, { $set: { status: 'draft' } });
  const gone = refused(written, 'not retired');
  if (gone) return { error: gone };
  revalidatePath('/admin/review');
  return {};
}

// Save an edit, WITHOUT approving: editing and approving are two judgements.
// The gates run HERE, on save, because this is where the content changes;
// approveQuestion is deliberately ungated because it approves a draft that has
// already passed them. Saving without re-verifying would let edited content
// reach a student unchecked.
//
// AN APPROVED QUESTION MAY BE EDITED, and doing so returns it to draft: the
// edit changed what a student would see, so it faces review again, which is
// what approve-gate.ts is for. The write used to filter on status: 'draft',
// which made the demotion beside it unreachable and every approved question
// silently uneditable.
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
  // THE ROW FIRST, THE GATE SECOND. The gate's independent solve is a model
  // call; a save that cannot land must not pay for one.
  const _id = IdZ.parse(id);
  await dbConnect();
  if ((await Question.countDocuments({ _id })) === 0) {
    return { error: 'Nothing was written: this question is no longer in the bank. Reload the queue.' };
  }
  const gate = await approvalGate(validated.data);
  if (!gate.ok) {
    return { error: gate.reason };
  }
  const written = await Question.updateOne({ _id }, { $set: { ...validated.data, status: 'draft' } });
  const gone = refused(written, 'no longer in the bank');
  if (gone) return { error: gone };
  revalidatePath('/admin/review');
  return {};
}
