'use server';

import { z } from 'zod';
import { dbConnect, Attempt, CapturedImage, Question, Transcription } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { markableSlots } from '@/lib/grade/mark';
import {
  MAX_BYTES,
  MAX_TAKES,
  linesForSlot,
  transcribeWorking,
  type TranscriptionResult,
} from '@/lib/grade/transcribe';
import { earnableByMethod, constructionRows, alreadyEarnedByMethod } from '@/lib/grade/method-marks';
import { constructionChecks } from '@/lib/grade/construction';
import { checkConstruction } from '@/lib/grade/check-construction';
import type { RubricItem } from '@/lib/types';
import type { StoredVisual } from '@/lib/visuals';
import { markMethod, type MethodDecision } from '@/lib/grade/mark-method';
import { MARKER_VERSION } from '@/lib/grade/version';
import { splitStoredAnswer } from '@/lib/study/attempt-answers';
import { markableSlots as allSlots } from '@/lib/grade/mark';

/**
 * The photograph is taken AFTER the typed answers are submitted: those are the
 * deterministic record, and a reveal before the photograph would influence what
 * is photographed. This reads and stores; it marks nothing — ROUND_2 §2, §3.
 */


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

  // Earlier takes, for the take number AND for what they already paid for.
  const earlier = await Transcription.find({ attempt_id: attemptId })
    .select('method_marks')
    .lean<{ method_marks?: { code: string; awarded: boolean }[] }[]>();
  const already = earlier.length;
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
    visual?: StoredVisual;
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

  // METHOD MARKING over the rows deterministic marking left unearned, ROUND_2
  // §4. It may only ADD marks — nothing here touches what the grader awarded —
  // and rows an earlier take already earned are settled, so a retake cannot put
  // a mark already given at risk of a second opinion.
  const settled = [...(attempt.rubric_awarded ?? []), ...alreadyEarnedByMethod(earlier)];
  const unearned = earnableByMethod(question, settled);
  let decisions: MethodDecision[] = [];
  let usage: { input_tokens?: number; output_tokens?: number } = {};
  if (unearned.length > 0) {
    // ONE RULE FOR WHICH LINES BELONG TO WHICH PART: linesForSlot, the rule the
    // eval gate was measured with. It carries a label down the page the way a
    // candidate writes — the part number once, the working under it — so lines
    // the reader left unlabelled are not dropped.
    const workingByPart: Record<string, string[]> = {};
    for (const part of question.parts ?? []) {
      const lines = linesForSlot(read.transcription, part.label);
      if (lines.length > 0) workingByPart[part.label] = lines;
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

  // A PHOTOGRAPHED CONSTRUCTION, ROUND_2 §8. The answer is a known set of
  // coordinates from the figure's declared params, so this is comparison and
  // not judgment. EVERY check must pass: a construct slot is one drawing, and a
  // curve through three of four points is not the drawing that was asked for.
  const drawRows = constructionRows(question, settled);
  const checks = constructionChecks(question.visual);
  if (drawRows.length > 0 && checks.length > 0) {
    try {
      const drawn = await checkConstruction({
        image: bytes,
        contentType,
        checks,
        questionStem: `${question.stimulus ?? ''} ${question.stem}`.trim(),
      });
      if (drawn.complete) {
        for (const r of drawRows) {
          decisions.push({
            code: r.code,
            awarded: true,
            reason: `your graph shows all ${checks.length} things this asks for`,
            confidence: 1,
          });
        }
      } else {
        const first = drawn.missing[0];
        for (const r of drawRows) {
          decisions.push({
            code: r.code,
            awarded: false,
            reason: drawn.legible
              ? `we could not see that ${first?.check.describes ?? 'the graph matches'}`
              : 'we could not read the graph in this photograph — mark it yourself against the drawing below',
            confidence: 0,
          });
        }
      }
    } catch {
      // Unreadable falls back to the self-check list the student already has.
    }
  }

  const byCode = new Map([...unearned, ...drawRows].map((r) => [r.code, r]));
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
