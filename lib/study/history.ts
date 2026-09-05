import { Attempt, PracticeSession, Question, Transcription } from '@/lib/db';
import { attemptOutcome, type OutcomeQuestion, type OutcomeRead, type OutcomeRow } from './outcome';
import { renderMathHtml } from '@/lib/katex';

/**
 * Every attempt, newest first, each with the look back that shows it. The
 * numbers are the one fold's (lib/study/outcome.ts), so a number here is the
 * number on the look back. Read-only: nothing here is re-marked.
 */
export interface HistoryRow {
  sessionId: string;
  index: number;
  ts: Date;
  stemHtml: string;
  earned: number;
  /** Marks assessed: the denominator. */
  marks: number;
  /** Marks no one could assess yet, shown as such and never as lost. */
  unassessed: number;
}

export async function loadHistory(studentId: string): Promise<HistoryRow[]> {
  const attempts = await Attempt.find({ student_id: studentId })
    .sort({ ts: -1 })
    .select('question_id session_id rubric_awarded rubric correct ts')
    .lean<{ _id: unknown; question_id: unknown; session_id: unknown; rubric_awarded: string[]; rubric?: OutcomeRow[]; correct: boolean; ts: Date }[]>();
  if (attempts.length === 0) return [];

  const sessions = await PracticeSession.find({ _id: { $in: [...new Set(attempts.map((a) => String(a.session_id)))] } })
    .select('question_ids')
    .lean<{ _id: unknown; question_ids: unknown[] }[]>();
  const indexOf = new Map<string, number>();
  for (const s of sessions) s.question_ids.forEach((q, i) => indexOf.set(`${String(s._id)}:${String(q)}`, i));

  const questions = await Question.find({ _id: { $in: [...new Set(attempts.map((a) => String(a.question_id)))] } })
    .select('stem marks profile parts rubric')
    .lean<(OutcomeQuestion & { _id: unknown; stem: string })[]>();
  const questionBy = new Map(questions.map((q) => [String(q._id), q]));

  const reads = await Transcription.find({ attempt_id: { $in: attempts.map((a) => a._id) } })
    .select('attempt_id legible marker_version method_marks')
    .lean<(OutcomeRead & { attempt_id: unknown })[]>();
  const takes = new Map<string, OutcomeRead[]>();
  for (const r of reads) takes.set(String(r.attempt_id), [...(takes.get(String(r.attempt_id)) ?? []), r]);

  const out: HistoryRow[] = [];
  for (const a of attempts) {
    const q = questionBy.get(String(a.question_id));
    const index = indexOf.get(`${String(a.session_id)}:${String(a.question_id)}`);
    if (!q || index === undefined) continue;
    const outcome = attemptOutcome(a, q, takes.get(String(a._id)) ?? []);
    out.push({
      sessionId: String(a.session_id),
      index,
      ts: a.ts,
      stemHtml: renderMathHtml(q.stem),
      earned: outcome.earned,
      marks: outcome.assessed,
      unassessed: outcome.unassessedMarks,
    });
  }
  return out;
}
