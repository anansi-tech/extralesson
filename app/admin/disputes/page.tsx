import 'katex/dist/katex.min.css';
import { dbConnect, Attempt, MarkDispute, Question, Student, Transcription } from '@/lib/db';
import { renderMathHtml } from '@/lib/katex';
import { linesForSlot } from '@/lib/grade/transcribe';
import type { RubricItem } from '@/lib/types';

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
      .select('question_id answer')
      .lean<{ _id: unknown; question_id: unknown; answer: string | number }[]>(),
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
  const questions = await Question.find({ _id: { $in: [...new Set(attempts.map((a) => String(a.question_id)))] } })
    .select('stem stimulus rubric')
    .lean<{ _id: unknown; stem: string; stimulus?: string; rubric?: RubricItem[] }[]>();

  const by = <T extends { _id: unknown }>(rows: T[]) => new Map(rows.map((r) => [String(r._id), r]));
  const studentBy = by(students);
  const attemptBy = by(attempts);
  const readBy = by(reads);
  const questionBy = by(questions);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-[12px] leading-snug text-dim">
        {disputes.length === 0
          ? 'No disputes yet.'
          : `${disputes.length}${disputes.length === LIMIT ? '+' : ''} — newest first. Nothing here changes a mark: reply by email, and correct the marker if it was wrong.`}
      </p>

      {disputes.map((d) => {
        const attempt = attemptBy.get(String(d.attempt_id));
        const read = readBy.get(String(d.transcription_id));
        const question = attempt ? questionBy.get(String(attempt.question_id)) : undefined;
        const row = read?.method_marks?.find((m) => m.code === d.code);
        const rubric = question?.rubric?.find((r) => r.code === d.code);
        const part = rubric?.slot_ref.split('.')[0] ?? '';
        const lines = (read?.lines ?? []).map((l) => ({ ...l, part_label: l.part_label ?? null, slot_label: l.slot_label ?? null }));
        const working = read && part ? linesForSlot({ lines, answers: [], legible: read.legible }, part) : [];
        return (
          <section key={String(d._id)} className="mt-4 border-[1.5px] border-ink bg-white p-4 shadow-[3px_3px_0_var(--ink)]">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 font-mono text-[11px] text-dim">
              <span>{d.ts.toLocaleString('en-GB')}</span>
              <span className="truncate">{studentBy.get(String(d.student_id))?.email ?? 'account deleted'}</span>
              {/* A download, not a write: the bundle is built in memory and
                  enters the golden set only through pnpm golden:import. */}
              <a href={`/admin/disputes/${String(d._id)}/export`} className="min-h-11 inline-flex items-center uppercase tracking-widest text-red-pen underline">
                Export as golden case
              </a>
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
            <p className="mt-1 text-[13px]">
              <span className="font-mono text-[11px]">{d.code}</span>
              {rubric && ` (${rubric.profile}, ${rubric.mark_value}) — ${rubric.criterion}`}
            </p>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-dim">The reason it was withheld</div>
            <p className="mt-1 border-l-3 border-red-pen bg-[#FDF1F0] px-2 py-1 text-[13px]">{row?.reason ?? 'row not on this read'}</p>

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
