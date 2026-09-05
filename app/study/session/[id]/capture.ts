'use server';

import { z } from 'zod';
import {
  dbConnect,
  Attempt,
  CapturedImage,
  PracticeSession,
  Question,
  SessionDraft,
  Transcription,
  isDuplicateKey,
  readExpiry,
} from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { markableSlots } from '@/lib/grade/mark';
import { MAX_BYTES, MAX_TAKES, transcribeWorking, type TranscriptionResult } from '@/lib/grade/transcribe';
import { constructionRows, alreadyEarnedByMethod } from '@/lib/grade/method-marks';
import { constructionChecks } from '@/lib/grade/construction';
import { checkConstruction } from '@/lib/grade/check-construction';
import { prefillFromRead } from '@/lib/grade/prefill';
import { markWorking, type CaptureResult } from './mark-working';
import { limited, TOO_MANY } from '@/lib/auth/rate-limit';
import type { StoredVisual } from '@/lib/visuals';

const ImageZ = {
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  /** base64, without the data: prefix. */
  data: z.string().max(Math.ceil((MAX_BYTES * 4) / 3) + 64),
};

const ReadZ = z.object({
  sessionId: z.string().regex(/^[a-f0-9]{24}$/),
  questionIndex: z.number().int().min(0).max(99),
  ...ImageZ,
});

const CaptureZ = z.object({
  attemptId: z.string().regex(/^[a-f0-9]{24}$/),
  ...ImageZ,
});

export interface ReadResult {
  transcription: TranscriptionResult;
  /** The stored read, which a line rejection names. */
  transcriptionId: string;
  take: number;
  takesLeft: number;
  /** Single-box slots the read filled, by slot ref. */
  prefill: Record<string, string>;
}

/**
 * THE IMAGE IS SENT AT READ TIME AND NEVER AGAIN (ROUND_4 Task 1): the page
 * is transcribed and, on a construct question, the drawing checked, and both
 * are stored. Nothing here marks; markWorking marks from what is stored.
 * A model output becomes the answer only when the student submits it.
 */
export async function readWorking(input: {
  sessionId: string;
  questionIndex: number;
  contentType: string;
  data: string;
}): Promise<ReadResult | { error: string }> {
  const auth = await requireSession();
  const parsed = ReadZ.safeParse(input);
  if (!parsed.success) return { error: 'That photo could not be read. Try again.' };
  const { sessionId, questionIndex, contentType, data } = parsed.data;
  // A read is a paid model call: the bucket is what stops a loop from spending it.
  if (await limited('read', auth.student_id)) return { error: TOO_MANY };

  await dbConnect();
  // The session has to be this student's, or a photo writes into someone else's draft.
  const session = await PracticeSession.findOne({ _id: sessionId, student_id: auth.student_id })
    .select('question_ids')
    .lean<{ question_ids: unknown[] } | null>();
  const questionId = session?.question_ids[questionIndex];
  if (!questionId) return { error: 'That question could not be found.' };

  const earlier = await Transcription.find({ session_id: sessionId, question_index: questionIndex })
    .select('method_marks')
    .lean<{ method_marks?: { code: string; awarded: boolean }[] }[]>();
  if (earlier.length >= MAX_TAKES) {
    return { error: 'Two photographs is the limit for one question.' };
  }
  const take = earlier.length + 1;

  const bytes = Buffer.from(data, 'base64');
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    return { error: 'That photo is too large. Try again in better light.' };
  }

  const question = await Question.findById(questionId).lean<{
    parts?: { label: string; marks: number; slots: { label: string; answer?: string; response_mode?: string }[] }[];
    stem: string;
    stimulus?: string;
    visual?: StoredVisual;
  } | null>();
  if (!question) return { error: 'That question could not be found.' };
  const parts = question.parts ?? [];

  // RESERVE BEFORE SPEND (ROUND_6 Task 4): the take is taken on the unique
  // index before the model sees the image, so a second read of the same take
  // fails here and costs nothing.
  const key = { student_id: auth.student_id, session_id: sessionId, question_index: questionIndex, take };
  let shell;
  try {
    shell = await Transcription.create({ ...key, question_id: questionId, lines: [], legible: false, pending: true, expires_at: readExpiry() });
  } catch (e) {
    if (!isDuplicateKey(e)) throw e;
    return { error: 'That page is already being read. Give it a moment.' };
  }

  let read;
  try {
    read = await transcribeWorking({ image: bytes, contentType, slotRefs: markableSlots(parts) });
  } catch {
    // The reservation goes with the failure, so the take is not spent.
    await Transcription.deleteOne({ _id: shell._id });
    return { error: 'We could not read that photo. Nothing has changed.' };
  }

  // The drawing check runs now and is stored, so submit needs no second look.
  // Rows an earlier take already earned are settled and not re-read.
  let construction: { complete: boolean; legible: boolean; missing: { describes: string; note: string }[] } | undefined;
  let drawing: { usage: { input_tokens?: number; output_tokens?: number }; model: string } | undefined;
  const checks = constructionChecks(question.visual);
  if (checks.length > 0 && constructionRows(question, alreadyEarnedByMethod(earlier)).length > 0) {
    try {
      const drawn = await checkConstruction({
        image: bytes,
        contentType,
        checks,
        questionStem: `${question.stimulus ?? ''} ${question.stem}`.trim(),
      });
      construction = {
        complete: drawn.complete,
        legible: drawn.legible,
        missing: drawn.missing.map((m) => ({ describes: m.check.describes, note: m.note })),
      };
      drawing = { usage: drawn.usage, model: drawn.model };
    } catch {
      // Unreadable falls back to the self-check list the student already has.
    }
  }

  await Transcription.updateOne(
    { _id: shell._id },
    {
      $set: {
        lines: read.transcription.lines,
        answers: read.transcription.answers,
        construction,
        legible: read.transcription.legible,
        notes: read.transcription.notes,
        usage: { ...read.usage, drawing_input: drawing?.usage.input_tokens, drawing_output: drawing?.usage.output_tokens },
        reader_model: read.model,
        ...(drawing ? { drawing_model: drawing.model } : {}),
      },
      $unset: { pending: '' },
    },
  );
  const stored = shell;
  // Held only long enough for a retake or a dispute (lib/db/transcription.ts).
  await CapturedImage.create({ ...key, data: bytes, content_type: contentType });

  // Prefill goes into the DRAFT, never an attempt: the student confirms it by
  // submitting. A question already handed in has no draft to fill.
  const prefill = prefillFromRead(parts, read.transcription.answers);
  const submitted = await Attempt.exists({ session_id: sessionId, question_id: questionId });
  if (Object.keys(prefill).length > 0 && !submitted) {
    const draft = await SessionDraft.findOne({ session_id: sessionId, question_index: questionIndex })
      .select('answers')
      .lean<{ answers?: Record<string, string> } | null>();
    await SessionDraft.updateOne(
      { session_id: sessionId, question_index: questionIndex },
      { $set: { answers: { ...(draft?.answers ?? {}), ...prefill }, updated_at: new Date() } },
      { upsert: true },
    );
  }

  return { transcription: read.transcription, transcriptionId: String(stored._id), take, takesLeft: MAX_TAKES - take, prefill };
}

const RetryZ = z.object({ attemptId: z.string().regex(/^[a-f0-9]{24}$/) });

/**
 * Marks the stored text again after a marking failed (ROUND_6 Task 1). No new
 * photo and no new read: the read that failed still has no marker_version, so
 * markWorking picks it up as the take that stands.
 */
export async function retryMarking(input: { attemptId: string }): Promise<CaptureResult | { error: string }> {
  const auth = await requireSession();
  const parsed = RetryZ.safeParse(input);
  if (!parsed.success) return { error: 'That answer could not be found.' };
  await dbConnect();
  const owned = await Attempt.exists({ _id: parsed.data.attemptId, student_id: auth.student_id });
  if (!owned) return { error: 'That answer could not be found.' };
  const marked = await markWorking(parsed.data.attemptId);
  return marked ?? { error: 'There is nothing left to mark.' };
}

/**
 * The post-submit path, for a student who typed instead: read, then mark, the
 * same two steps the photo-first path takes either side of submit.
 */
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
  const attempt = await Attempt.findOne({ _id: attemptId, student_id: auth.student_id }).lean<{
    question_id: unknown;
    session_id: unknown;
  } | null>();
  if (!attempt) return { error: 'That answer could not be found.' };
  const session = await PracticeSession.findById(attempt.session_id)
    .select('question_ids')
    .lean<{ question_ids: unknown[] } | null>();
  const questionIndex =
    session?.question_ids.findIndex((q) => String(q) === String(attempt.question_id)) ?? -1;
  if (questionIndex < 0) return { error: 'That answer could not be found.' };

  const read = await readWorking({ sessionId: String(attempt.session_id), questionIndex, contentType, data });
  if ('error' in read) return read;
  const marked = await markWorking(attemptId);
  return marked ?? { error: 'We could not mark that photo. Your marks are unchanged.' };
}
