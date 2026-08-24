'use server';

import { z } from 'zod';
import { dbConnect, Attempt, CapturedImage, Question, Transcription } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { markableSlots } from '@/lib/grade/mark';
import { MAX_TAKES, transcribeWorking, type TranscriptionResult } from '@/lib/grade/transcribe';
import { earnableByMethod } from '@/lib/grade/method-marks';
import type { RubricItem } from '@/lib/types';
import { markMethod, type MethodDecision } from '@/lib/grade/mark-method';
import { MARKER_VERSION } from '@/lib/grade/version';
import { splitStoredAnswer } from '@/lib/study/attempt-answers';
import { markableSlots as allSlots } from '@/lib/grade/mark';

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
  /** Rows the working earned, and rows it did not, each with its reason. */
  method: { code: string; awarded: boolean; reason: string; mark_value: number }[];
  marksAdded: number;
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
    rubric_awarded: string[];
    answer: string | number;
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

  const question = await Question.findById(attempt.question_id).lean<{
    parts?: { label: string; marks: number; slots: { label: string; response_mode?: string }[] }[];
    rubric?: RubricItem[];
    stem: string;
    stimulus?: string;
    worked_solution?: string;
  } | null>();
  if (!question) return { error: 'That question could not be found.' };
  const slotRefs = question?.parts ? markableSlots(question.parts) : [];

  let read;
  try {
    read = await transcribeWorking({ image: bytes, contentType, slotRefs });
  } catch {
    // A reader that fails costs the student nothing: their typed answers are
    // already marked and stand exactly as they were.
    return { error: 'We could not read that photo. Your marks are unchanged.' };
  }

  // METHOD MARKING (R2 §4), over the rows deterministic marking left unearned.
  //
  // This is where grader v6's restriction lifts. v6 awarded method marks only
  // where a question had exactly one marked slot — 3 of 427 — because the typed
  // working box belongs to the whole question and could not be attributed to a
  // slot. Photographed working can: each line carries the part it was written
  // under. The restriction on the TYPED box stays, because nothing about it has
  // changed; what has changed is that there is now evidence that can be
  // attributed, and this is it.
  //
  // It may only ADD marks. Nothing here can touch what the grader awarded.
  const unearned = earnableByMethod(question, attempt.rubric_awarded ?? []);
  let decisions: MethodDecision[] = [];
  let usage: { input_tokens?: number; output_tokens?: number } = {};
  if (unearned.length > 0) {
    const workingByPart: Record<string, string[]> = {};
    for (const line of read.transcription.lines) {
      const part = line.part_label ?? '';
      if (part) (workingByPart[part] ??= []).push(line.text);
    }
    const typed = splitStoredAnswer(String(attempt.answer), allSlots(question.parts ?? []));
    try {
      const marked = await markMethod({
        rows: unearned,
        workingByPart,
        typedAnswers: typed,
        workedSolution: question.worked_solution ?? '',
        questionStem: `${question.stimulus ?? ''} ${question.stem}`.trim(),
      });
      decisions = marked.decisions;
      usage = marked.usage;
    } catch {
      // The reading still stands and is still shown; nothing is lost but the
      // extra marks, and the student keeps everything determinism gave them.
      decisions = [];
    }
  }

  const byCode = new Map(unearned.map((r) => [r.code, r]));
  const methodMarks = decisions
    .filter((d) => byCode.has(d.code))
    .map((d) => ({
      code: d.code,
      awarded: d.awarded,
      reason: d.reason,
      confidence: d.confidence,
      mark_value: byCode.get(d.code)!.mark_value,
      profile: byCode.get(d.code)!.profile,
    }));

  await Transcription.create({
    student_id: auth.student_id,
    attempt_id: attemptId,
    question_id: attempt.question_id,
    lines: read.transcription.lines,
    legible: read.transcription.legible,
    notes: read.transcription.notes,
    take,
    usage: { ...read.usage, marking_input: usage.input_tokens, marking_output: usage.output_tokens },
    reader_model: read.model,
    method_marks: methodMarks,
    marker_version: MARKER_VERSION,
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

  return {
    transcription: read.transcription,
    take,
    takesLeft: MAX_TAKES - take,
    method: methodMarks.map(({ code, awarded, reason, mark_value }) => ({ code, awarded, reason, mark_value })),
    marksAdded: methodMarks.filter((m) => m.awarded).reduce((n, m) => n + m.mark_value, 0),
  };
}
