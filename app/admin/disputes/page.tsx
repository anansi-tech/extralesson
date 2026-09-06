import 'katex/dist/katex.min.css';
import { attemptOutcome, type OutcomeQuestion, type OutcomeRead } from '@/lib/study/outcome';
import Link from 'next/link';
import { dbConnect, Attempt, DisputeReview, MarkDispute, Question, Student, Transcription } from '@/lib/db';
import { renderMathHtml } from '@/lib/katex';
import { linesForSlot } from '@/lib/grade/transcribe';
import type { RubricItem } from '@/lib/types';
import { Refusal } from '../../refusal';
import { QUIET } from '../ui';

export const metadata = { title: 'Mark disputes — ExtraLesson admin' };
export const dynamic = 'force-dynamic';

const LIMIT = 100;

/**
 * READ-ONLY (ROUND_4 Task 3). Resolution is a human and an email in v1; a
 * correction event that changes a mark is on the R5 list, so nothing here
 * writes. Newest first, each with enough to judge it without opening anything.
 */
export default async function DisputesPage() {
  await dbConnect();
  const disputes = await MarkDispute.find({})
    .sort({ ts: -1 })
    .limit(LIMIT)
    .lean<{ _id: unknown; student_id: unknown; attempt_id: unknown; transcription_id: unknown; code: string; ts: Date }[]>();

  const ids = (k: 'student_id' | 'attempt_id' | 'transcription_id') => [...new Set(disputes.map((d) => String(d[k])))];
  const [students, attempts, reads] = await Promise.all([
    Student.find({ _id: { $in: ids('student_id') } }).select('email').lean<{ _id: unknown; email: string }[]>(),
    Attempt.find({ _id: { $in: ids('attempt_id') } })
      .select('question_id answer rubric_awarded correct')
      .lean<{ _id: unknown; question_id: unknown; answer: string | number; rubric_awarded: string[]; correct: boolean }[]>(),
    Transcription.find({ _id: { $in: ids('transcription_id') } })
      .select('lines legible method_marks take')
      .lean<
        {
          _id: unknown;
          take: number;
          legible: boolean;
          lines: { part_label?: string | null; slot_label?: string | null; text: string; confidence: number }[];
          method_marks?: { code: string; awarded: boolean; reason: string; mark_value: number }[];
        }[]
      >(),
  ]);
  // Rows the marker could not decide, asked for a person instead of a guess.
  const asked = await Transcription.find({ 'method_marks.needs_review': true })
    .sort({ created_at: -1 })
    .limit(LIMIT)
    .select('question_id attempt_id created_at lines method_marks')
    .lean<{ _id: unknown; question_id: unknown; attempt_id: unknown; created_at: Date; lines: { text: string }[]; method_marks: { code: string; reason: string; needs_review?: boolean }[] }[]>();
  const askedQuestions = await Question.find({ _id: { $in: [...new Set(asked.map((t) => String(t.question_id)))] } })
    .select('stem')
    .lean<{ _id: unknown; stem: string }[]>();
  const askedStemBy = new Map(askedQuestions.map((q) => [String(q._id), q.stem]));
  // The latest look per dispute, so the list says what has been dealt with.
  const latestReview = new Map<string, Date>();
  for (const r of await DisputeReview.find({ dispute_id: { $in: disputes.map((d) => d._id) } }).sort({ reviewed_at: -1 }).lean<{ dispute_id: unknown; reviewed_at: Date }[]>()) {
    const k = String(r.dispute_id);
    if (!latestReview.has(k)) latestReview.set(k, r.reviewed_at);
  }

  const questions = await Question.find({ _id: { $in: [...new Set(attempts.map((a) => String(a.question_id)))] } })
    .select('stem stimulus marks profile parts rubric')
    .lean<(Omit<OutcomeQuestion, 'rubric'> & { _id: unknown; stem: string; stimulus?: string; rubric?: RubricItem[] })[]>();
  const allReads = await Transcription.find({ attempt_id: { $in: ids('attempt_id') } })
    .select('attempt_id legible marker_version method_marks')
    .lean<(OutcomeRead & { attempt_id: unknown })[]>();

  const by = <T extends { _id: unknown }>(rows: T[]) => new Map(rows.map((r) => [String(r._id), r]));
  const studentBy = by(students);
  const attemptBy = by(attempts);
  const readBy = by(reads);
  const questionBy = by(questions);

  return (
    <div>
      {asked.length > 0 && (
        <section className="mb-6">
          <div className="section-label">The marker asked for a look</div>
          {asked.map((t) =>
            t.method_marks
              .filter((m) => m.needs_review)
              .map((m) => (
                <div key={`${String(t._id)}-${m.code}`} className="mt-3 border-l-3 border-amber bg-amber-tint p-3">
                  <div className="font-mono text-[11px] text-dim">
                    {t.created_at.toLocaleString('en-GB')} · {m.code} ·{' '}
                    <Link href={`/admin/disputes/${String(t._id)}?code=${m.code}`} className="text-red-pen underline">open the case</Link>
                  </div>
                  <div
                    className="question-prose mt-1 text-[13px]"
                    dangerouslySetInnerHTML={{ __html: renderMathHtml(askedStemBy.get(String(t.question_id)) ?? '') }}
                  />
                  <p className="mt-1 text-[13px]">{m.reason}</p>
                  <ul className="mt-1 border-l-3 border-paper-deep pl-3">
                    {t.lines.map((l, i) => (
                      <li key={i} className="font-mono text-[12px] leading-snug">{l.text}</li>
                    ))}
                  </ul>
                </div>
              )),
          )}
        </section>
      )}
      {disputes.length === 0 ? (
        <Refusal id="no-disputes" label="No disputes yet" sentence="Nothing here changes a mark: reply by email, and correct the marker if it was wrong." />
      ) : (
        <p className="text-[12px] leading-snug text-dim">
          {`${disputes.length}${disputes.length === LIMIT ? '+' : ''} — newest first. Nothing here changes a mark: reply by email, and correct the marker if it was wrong.`}
        </p>
      )}

      {disputes.map((d) => {
        const attempt = attemptBy.get(String(d.attempt_id));
        const read = readBy.get(String(d.transcription_id));
        const question = attempt ? questionBy.get(String(attempt.question_id)) : undefined;
        const row = read?.method_marks?.find((m) => m.code === d.code);
        const state =
          attempt && question
            ? attemptOutcome(attempt, question, allReads.filter((r) => String(r.attempt_id) === String(attempt._id))).rows.find((r) => r.code === d.code)?.state
            : undefined;
        const rubric = question?.rubric?.find((r) => r.code === d.code);
        const part = rubric?.slot_ref.split('.')[0] ?? '';
        const lines = (read?.lines ?? []).map((l) => ({ ...l, part_label: l.part_label ?? null, slot_label: l.slot_label ?? null }));
        const working = read && part ? linesForSlot({ lines, answers: [], legible: read.legible }, part) : [];
        return (
          <section key={String(d._id)} className="mt-4 border-[1.5px] border-ink bg-white p-5 shadow-[var(--shadow-panel)]">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 font-mono text-[11px] text-dim">
              <span>{d.ts.toLocaleString('en-GB')}</span>
              <span className="truncate">{studentBy.get(String(d.student_id))?.email ?? 'account deleted'}</span>
              <span className="inline-flex items-baseline gap-3">
                {latestReview.has(String(d._id)) ? (
                  <span className="uppercase tracking-widest text-green-pen">reviewed {latestReview.get(String(d._id))!.toLocaleDateString('en-GB')}</span>
                ) : (
                  <span className="uppercase tracking-widest text-red-pen">not yet reviewed</span>
                )}
                <Link href={`/admin/disputes/${String(d._id)}`} className={`${QUIET} text-red-pen`}>
                  Open the case
                </Link>
              </span>
            </div>

            <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-dim">The question</div>
            {question ? (
              <div
                className="question-prose mt-1 text-[14px]"
                dangerouslySetInnerHTML={{ __html: renderMathHtml(`${question.stimulus ?? ''} ${question.stem}`.trim()) }}
              />
            ) : (
              <p className="mt-1 text-[13px] text-dim">Question no longer in the bank.</p>
            )}
            {attempt && <p className="mt-1 font-mono text-[12px]">typed: {String(attempt.answer)}</p>}

            <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-dim">The row</div>
            <p className="question-prose mt-1 text-[13px]">
              <span className="font-mono text-[11px]">{d.code}</span>
              {state && <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-dim">{state}</span>}
              {rubric && (
                <>
                  {` (${rubric.profile}, ${rubric.mark_value}) — `}
                  <span dangerouslySetInnerHTML={{ __html: renderMathHtml(rubric.criterion) }} />
                </>
              )}
            </p>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-dim">The reason it was withheld</div>
            <p className="mt-1 border-l-3 border-red-pen bg-red-tint px-2 py-1 text-[13px]">{row?.reason ?? 'row not on this read'}</p>

            <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-dim">
              The read{read ? ` — take ${read.take}${part ? `, part (${part})` : ''}` : ''}
            </div>
            {read ? (
              <ul className="mt-1 border-l-3 border-paper-deep pl-3">
                {(working.length ? working : read.lines.map((l) => l.text)).map((text, i) => (
                  <li key={i} className="font-mono text-[13px] leading-snug">{text}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[13px] text-dim">Read not found.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
