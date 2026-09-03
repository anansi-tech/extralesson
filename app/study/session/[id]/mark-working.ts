import { Attempt, CapturedImage, PracticeSession, Question, Transcription } from '@/lib/db';
import { markableSlots } from '@/lib/grade/mark';
import { MAX_TAKES, linesForSlot, type TranscriptionResult } from '@/lib/grade/transcribe';
import { earnableByMethod, constructionRows, alreadyEarnedByMethod } from '@/lib/grade/method-marks';
import { markMethod, type MethodDecision } from '@/lib/grade/mark-method';
import { MARKER_VERSION } from '@/lib/grade/version';
import { splitStoredAnswer } from '@/lib/study/attempt-answers';
import type { RubricItem } from '@/lib/types';

export interface CaptureResult {
  transcription: TranscriptionResult;
  take: number;
  takesLeft: number;
  method: { code: string; awarded: boolean; reason: string; mark_value: number }[];
  marksAdded: number;
}

interface StoredRead {
  _id: unknown;
  take: number;
  lines: TranscriptionResult['lines'];
  answers?: TranscriptionResult['answers'];
  legible: boolean;
  notes?: string;
  construction?: { complete: boolean; legible: boolean; missing: { describes?: string }[] };
  method_marks?: { code: string; awarded: boolean }[];
  marker_version?: string;
}

/**
 * MARKS FROM WHAT WAS STORED AT READ TIME — the image is never sent again
 * (ROUND_4 Task 1). Links every unlinked read of this question to the attempt
 * once, then marks the take that stands. Method marks only ADD (ROUND_2 §4);
 * rows an earlier take earned are settled. Construct rows are decided from
 * the stored drawing check, not from a second look.
 */
export async function markWorking(attemptId: string): Promise<CaptureResult | null> {
  const attempt = await Attempt.findById(attemptId).lean<{
    _id: unknown;
    question_id: unknown;
    session_id: unknown;
    rubric_awarded: string[];
    answer: string | number;
  } | null>();
  if (!attempt) return null;
  const session = await PracticeSession.findById(attempt.session_id)
    .select('question_ids')
    .lean<{ question_ids: unknown[] } | null>();
  const questionIndex =
    session?.question_ids.findIndex((q) => String(q) === String(attempt.question_id)) ?? -1;
  if (questionIndex < 0) return null;

  const key = { session_id: attempt.session_id, question_index: questionIndex };
  await Transcription.updateMany(
    { ...key, attempt_id: { $exists: false } },
    { $set: { attempt_id: attempt._id }, $unset: { expires_at: '' } },
  );
  await CapturedImage.updateMany({ ...key, attempt_id: { $exists: false } }, { $set: { attempt_id: attempt._id } });

  const reads = await Transcription.find({ attempt_id: attempt._id }).sort({ take: 1 }).lean<StoredRead[]>();
  const marked = reads.filter((r) => r.marker_version);
  const read = reads.filter((r) => !r.marker_version).at(-1);
  if (!read) return null;

  const question = await Question.findById(attempt.question_id).lean<{
    parts?: { label: string; marks: number; slots: { label: string; response_mode?: string }[] }[];
    rubric?: RubricItem[];
    stem: string;
    stimulus?: string;
    worked_solution?: string;
  } | null>();
  if (!question) return null;

  const settled = [...(attempt.rubric_awarded ?? []), ...alreadyEarnedByMethod(marked)];
  const unearned = earnableByMethod(question, settled);
  const transcription: TranscriptionResult = {
    lines: read.lines,
    answers: read.answers ?? [],
    legible: read.legible,
    notes: read.notes,
  };
  let decisions: MethodDecision[] = [];
  let usage: { input_tokens?: number; output_tokens?: number } = {};
  if (unearned.length > 0) {
    const workingByPart: Record<string, string[]> = {};
    for (const part of question.parts ?? []) {
      const lines = linesForSlot(transcription, part.label);
      if (lines.length > 0) workingByPart[part.label] = lines;
    }
    try {
      const result = await markMethod({
        rows: unearned,
        workingByPart,
        typedAnswers: splitStoredAnswer(String(attempt.answer), markableSlots(question.parts ?? [])),
        workedSolution: question.worked_solution ?? '',
        questionStem: `${question.stimulus ?? ''} ${question.stem}`.trim(),
      });
      decisions = result.decisions;
      usage = result.usage;
    } catch {
      // The reading stands; the student keeps everything determinism gave them.
    }
  }

  const drawRows = constructionRows(question, settled);
  const drawn = read.construction;
  if (drawRows.length > 0 && drawn) {
    const first = drawn.missing[0]?.describes;
    for (const r of drawRows) {
      decisions.push(
        drawn.complete
          ? { code: r.code, awarded: true, reason: 'your graph shows everything this asks for', confidence: 1 }
          : {
              code: r.code,
              awarded: false,
              reason: drawn.legible
                ? `we could not see that ${first ?? 'the graph matches'}`
                : 'we could not read the graph in this photograph — mark it yourself against the drawing below',
              confidence: 0,
            },
      );
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

  await Transcription.updateOne(
    { _id: read._id },
    {
      $set: {
        method_marks: methodMarks,
        marker_version: MARKER_VERSION,
        'usage.marking_input': usage.input_tokens,
        'usage.marking_output': usage.output_tokens,
      },
    },
  );

  return {
    transcription,
    take: read.take,
    takesLeft: MAX_TAKES - reads.length,
    method: methodMarks.map(({ code, awarded, reason, mark_value }) => ({ code, awarded, reason, mark_value })),
    marksAdded: methodMarks.filter((m) => m.awarded).reduce((n, m) => n + m.mark_value, 0),
  };
}
