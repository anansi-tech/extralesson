import { Attempt, PracticeSession, Question, Transcription } from '@/lib/db';
import { markSplit } from '@/lib/grade/assessable';
import { methodMarksEarned } from '@/lib/grade/method-marks';
import { renderMathHtml } from '@/lib/katex';

/**
 * Every attempt, newest first, each with the look back that shows it. Folded
 * exactly as lib/study/state.ts folds marks, so a number here is the number
 * on the look back. Read-only: nothing here is re-marked.
 */
export interface HistoryRow {
  sessionId: string;
  index: number;
  ts: Date;
  stemHtml: string;
  earned: number;
  marks: number;
}

export async function loadHistory(studentId: string): Promise<HistoryRow[]> {
  const attempts = await Attempt.find({ student_id: studentId })
    .sort({ ts: -1 })
    .select('question_id session_id profile_marks ts')
    .lean<{ _id: unknown; question_id: unknown; session_id: unknown; profile_marks: { CK: number; AK: number; R: number }; ts: Date }[]>();
  if (attempts.length === 0) return [];

  const sessions = await PracticeSession.find({ _id: { $in: [...new Set(attempts.map((a) => String(a.session_id)))] } })
    .select('question_ids')
    .lean<{ _id: unknown; question_ids: unknown[] }[]>();
  const indexOf = new Map<string, number>();
  for (const s of sessions) s.question_ids.forEach((q, i) => indexOf.set(`${String(s._id)}:${String(q)}`, i));

  const questions = await Question.find({ _id: { $in: [...new Set(attempts.map((a) => String(a.question_id)))] } })
    .select('stem marks parts rubric')
    .lean<{ _id: unknown; stem: string; marks: number; parts?: unknown[]; rubric?: unknown[] }[]>();
  const questionBy = new Map(questions.map((q) => [String(q._id), q]));

  const reads = await Transcription.find({ attempt_id: { $in: attempts.map((a) => a._id) } })
    .select('attempt_id method_marks')
    .lean<{ attempt_id: unknown; method_marks?: { code: string; awarded: boolean; mark_value: number }[] }[]>();
  const takes = new Map<string, typeof reads>();
  for (const r of reads) takes.set(String(r.attempt_id), [...(takes.get(String(r.attempt_id)) ?? []), r]);

  const out: HistoryRow[] = [];
  for (const a of attempts) {
    const q = questionBy.get(String(a.question_id));
    const index = indexOf.get(`${String(a.session_id)}:${String(a.question_id)}`);
    if (!q || index === undefined) continue;
    const mine = takes.get(String(a._id)) ?? [];
    out.push({
      sessionId: String(a.session_id),
      index,
      ts: a.ts,
      stemHtml: renderMathHtml(q.stem),
      earned: a.profile_marks.CK + a.profile_marks.AK + a.profile_marks.R + methodMarksEarned(mine),
      marks: (mine.length ? q.marks : markSplit(q as never).auto) || q.marks || 1,
    });
  }
  return out;
}
