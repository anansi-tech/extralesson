'use server';

import { z } from 'zod';
import { dbConnect, Attempt, MarkDispute, Transcription } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';

const DisputeZ = z.object({
  attemptId: z.string().regex(/^[a-f0-9]{24}$/),
  transcriptionId: z.string().regex(/^[a-f0-9]{24}$/),
  code: z.string().min(1).max(20),
});

/**
 * Records that the student thinks a withheld row earned its mark. Writes ONE
 * row and touches nothing else; the second tap on the same row is the same
 * report and returns ok.
 */
export async function disputeMark(input: {
  attemptId: string;
  transcriptionId: string;
  code: string;
}): Promise<{ ok: true } | { error: string }> {
  const auth = await requireSession();
  const parsed = DisputeZ.safeParse(input);
  if (!parsed.success) return { error: 'That could not be sent.' };
  const { attemptId, transcriptionId, code } = parsed.data;

  await dbConnect();
  // The attempt has to be this student's, and the read has to be that
  // attempt's, or a dispute is a way to write against someone else's marking.
  const attempt = await Attempt.exists({ _id: attemptId, student_id: auth.student_id });
  if (!attempt) return { error: 'That answer could not be found.' };
  const read = await Transcription.findOne({ _id: transcriptionId, attempt_id: attemptId })
    .select('method_marks')
    .lean<{ method_marks?: { code: string; awarded: boolean }[] } | null>();
  const row = read?.method_marks?.find((m) => m.code === code);
  if (!row) return { error: 'That row could not be found.' };
  if (row.awarded) return { error: 'That row was awarded.' };

  try {
    await MarkDispute.create({ student_id: auth.student_id, attempt_id: attemptId, transcription_id: transcriptionId, code });
  } catch (e) {
    if (!(e instanceof Error && /duplicate/i.test(e.message))) throw e;
  }
  return { ok: true };
}
