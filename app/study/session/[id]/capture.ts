'use server';

import { z } from 'zod';
import { dbConnect, Attempt, CapturedImage, Question, Transcription } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { markableSlots } from '@/lib/grade/mark';
import { MAX_TAKES, transcribeWorking, type TranscriptionResult } from '@/lib/grade/transcribe';

/**
 * A PHOTOGRAPH OF THE WORKING, READ BACK.
 *
 * R2 §2 and §3. The photograph is taken AFTER the typed answers are submitted —
 * the typed answers are the deterministic record, and showing the reveal before
 * the photograph would let it influence what is photographed. So this is keyed
 * on an attempt that already exists.
 *
 * It reads and stores; it marks nothing. Method marking is a separate pass over
 * what this produced (R2 §4), and until its eval gate passes it does not run at
 * all — a student who photographs their working today sees it typed up beside
 * the mark scheme, which is worth having on its own.
 */

/** ~1.5MB after the device has scaled it down; a phone photo is far larger. */
const MAX_BYTES = 1_500_000;

const CaptureZ = z.object({
  attemptId: z.string().regex(/^[a-f0-9]{24}$/),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  /** base64, without the data: prefix. */
  data: z.string().max(Math.ceil((MAX_BYTES * 4) / 3) + 64),
});

export interface CaptureResult {
  transcription: TranscriptionResult;
  take: number;
  takesLeft: number;
}

export async function captureWorking(input: {
  attemptId: string;
  contentType: string;
  data: string;
}): Promise<CaptureResult | { error: string }> {
  const auth = await requireSession();
  const parsed = CaptureZ.safeParse(input);
  if (!parsed.success) return { error: 'That photo could not be read. Try again.' };
  const { attemptId, contentType, data } = parsed.data;

  await dbConnect();
  // The attempt has to be this student's, or a photo is a way to write against
  // someone else's record.
  const attempt = await Attempt.findOne({ _id: attemptId, student_id: auth.student_id }).lean<{
    _id: unknown;
    question_id: unknown;
  } | null>();
  if (!attempt) return { error: 'That answer could not be found.' };

  const already = await Transcription.countDocuments({ attempt_id: attemptId });
  if (already >= MAX_TAKES) {
    return { error: 'Two photographs is the limit for one question.' };
  }
  const take = already + 1;

  const bytes = Buffer.from(data, 'base64');
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    return { error: 'That photo is too large. Try again in better light.' };
  }

  const question = await Question.findById(attempt.question_id)
    .select('parts')
    .lean<{ parts?: { label: string; slots: { label: string; response_mode?: string }[] }[] } | null>();
  const slotRefs = question?.parts ? markableSlots(question.parts) : [];

  let read;
  try {
    read = await transcribeWorking({ image: bytes, contentType, slotRefs });
  } catch {
    // A reader that fails costs the student nothing: their typed answers are
    // already marked and stand exactly as they were.
    return { error: 'We could not read that photo. Your marks are unchanged.' };
  }

  await Transcription.create({
    student_id: auth.student_id,
    attempt_id: attemptId,
    question_id: attempt.question_id,
    lines: read.transcription.lines,
    legible: read.transcription.legible,
    notes: read.transcription.notes,
    take,
    usage: read.usage,
    reader_model: read.model,
  });

  // Held only long enough for a retake or a dispute, then deleted by the
  // database's own clock (lib/db/transcription.ts).
  await CapturedImage.create({
    student_id: auth.student_id,
    attempt_id: attemptId,
    take,
    data: bytes,
    content_type: contentType,
  });

  return { transcription: read.transcription, take, takesLeft: MAX_TAKES - take };
}
