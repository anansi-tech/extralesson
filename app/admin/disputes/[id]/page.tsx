import 'katex/dist/katex.min.css';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { dbConnect, Attempt, CapturedImage, DisputeReview, MarkDispute, Question, Student, Transcription } from '@/lib/db';
import { renderAnswerHtml, renderMathHtml } from '@/lib/katex';
import { renderVisual } from '@/lib/visuals';
import { linesForSlot } from '@/lib/grade/transcribe';
import { attemptOutcome, type OutcomeQuestion, type OutcomeRead } from '@/lib/study/outcome';
import { LANDING } from '@/lib/landing-content';
import { reviewDispute } from '../actions';
import type { RubricItem } from '@/lib/types';

export const metadata = { title: 'Dispute — ExtraLesson admin' };
export const dynamic = 'force-dynamic';

/**
 * ONE COMPLETE CASE (ROUND_7 Task 3): everything a person needs to decide,
 * on one page, and the reply as a mailto with the summary already written.
 * The id is a dispute's, or a read's for a review the marker asked for.
 */
export default async function DisputeCasePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ code?: string }> }) {
  const { id } = await params;
  const { code: askedCode } = await searchParams;
  if (!/^[a-f0-9]{24}$/.test(id)) notFound();
  await dbConnect();

  const dispute = await MarkDispute.findById(id).lean<{ _id: unknown; student_id: unknown; attempt_id: unknown; transcription_id: unknown; code: string; ts: Date } | null>();
  const readId = dispute?.transcription_id ?? id;
  const read = await Transcription.findById(readId).lean<{
    _id: unknown; student_id: unknown; attempt_id?: unknown; question_id: unknown; session_id: unknown; question_index: number; take: number; legible: boolean; created_at: Date;
    lines: { part_label?: string | null; slot_label?: string | null; text: string; confidence: number }[];
    method_marks?: { code: string; awarded: boolean; reason: string; mark_value: number; needs_review?: boolean }[];
  } | null>();
  if (!read) notFound();
  const code = dispute?.code ?? askedCode ?? read.method_marks?.find((m) => m.needs_review)?.code ?? '';
  const attemptId = dispute?.attempt_id ?? read.attempt_id;
  const [student, attempt] = await Promise.all([
    Student.findById(dispute?.student_id ?? read.student_id).select('email exam_sitting').lean<{ email: string; exam_sitting: string } | null>(),
    attemptId ? Attempt.findById(attemptId).lean<{ _id: unknown; question_id: unknown; answer: string | number; rubric_awarded: string[]; correct: boolean; rubric?: RubricItem[] } | null>() : null,
  ]);
  const question = await Question.findById(attempt?.question_id ?? read.question_id).lean<{
    _id: unknown; stem: string; stimulus?: string; marks: number; profile?: 'CK' | 'AK' | 'R';
    visual?: { template?: string; params?: unknown };
    parts?: { label: string; prompt: string; marks: number; slots?: { label: string; prompt?: string; answer: string; response_mode?: string }[] }[];
    rubric?: RubricItem[];
  } | null>();
  const reads = attemptId ? await Transcription.find({ attempt_id: attemptId }).select('legible marker_version method_marks').lean<OutcomeRead[]>() : [read];
  const reviews = dispute ? await DisputeReview.find({ dispute_id: dispute._id }).sort({ reviewed_at: -1 }).lean<{ _id: unknown; reviewed_at: Date; note: string }[]>() : [];
  const photo = await CapturedImage.exists({ session_id: read.session_id, question_index: read.question_index, take: read.take });

  const rubric = (attempt?.rubric?.length ? attempt.rubric : question?.rubric) ?? [];
  const row = rubric.find((r) => r.code === code);
  const part = row?.slot_ref.split('.')[0] ?? '';
  const decision = read.method_marks?.find((m) => m.code === code);
  const state = attempt && question ? attemptOutcome(attempt, question as OutcomeQuestion, reads).rows.find((r) => r.code === code)?.state : undefined;
  const lines = read.lines.map((l) => ({ ...l, part_label: l.part_label ?? null, slot_label: l.slot_label ?? null }));
  const working = part ? linesForSlot({ lines, answers: [], legible: read.legible }, part) : [];
  let visualHtml: string | undefined;
  if (question?.visual?.template) {
    try {
      visualHtml = renderVisual(question.visual as never, { stimulus: question.stimulus, stem: question.stem, partPrompts: (question.parts ?? []).flatMap((p) => [p.prompt, ...(p.slots ?? []).map((s) => s.prompt ?? '')]) });
    } catch {
      visualHtml = undefined;
    }
  }

  const summary = [
    `Dispute on ${code}${row ? ` — ${row.criterion}` : ''}`,
    question ? `Question: ${question.stem}` : '',
    attempt ? `Typed: ${String(attempt.answer)}` : '',
    working.length ? `Working for (${part}):\n${working.join('\n')}` : '',
    decision ? `Decision: ${decision.awarded ? 'awarded' : 'withheld'} — ${decision.reason}` : '',
  ].filter(Boolean).join('\n\n');
  const mailto = student
    ? `mailto:${encodeURIComponent(student.email)}?subject=${encodeURIComponent(`Your query on ${code}`)}&body=${encodeURIComponent(`Hi,\n\nThanks for querying this mark. Here is what we looked at:\n\n${summary}\n\n`)}`
    : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-[11px] text-dim">
        <Link href="/admin/disputes" className="underline">← disputes</Link>
        <span>{dispute ? `queried ${dispute.ts.toLocaleString('en-GB')}` : `the marker asked for a look, ${read.created_at.toLocaleString('en-GB')}`}</span>
      </div>

      <h1 className="mt-3 text-xl font-black">
        {code} {state && <span className="ml-2 font-mono text-[11px] font-normal uppercase tracking-widest text-dim">{state}</span>}
      </h1>
      <p className="mt-1 break-all font-mono text-[12px]">{student?.email ?? 'account deleted'}{student ? ` · ${student.exam_sitting}` : ''}</p>

      <section className="mt-4 border-[1.5px] border-ink bg-white p-4 shadow-[3px_3px_0_var(--ink)]">
        <div className="section-label">The question</div>
        {question ? (
          <>
            {question.stimulus && <div className="question-prose mt-1 text-[14px]" dangerouslySetInnerHTML={{ __html: renderMathHtml(question.stimulus) }} />}
            <div className="question-prose mt-1 text-[15px]" dangerouslySetInnerHTML={{ __html: renderMathHtml(question.stem) }} />
            {visualHtml && <div className="mt-2 border border-paper-deep bg-white p-2 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: visualHtml }} />}
            <ol className="mt-2 space-y-1">
              {(question.parts ?? []).map((p) => (
                <li key={p.label} className={`text-[13px] ${p.label === part ? 'border-l-3 border-red-pen pl-2' : 'pl-2'}`}>
                  <span className="font-mono text-[11px] text-dim">({p.label}) [{p.marks}]</span>{' '}
                  <span className="question-prose" dangerouslySetInnerHTML={{ __html: renderMathHtml(p.prompt) }} />
                  {(p.slots ?? []).map((s) => (
                    <span key={s.label} className="ml-2 font-mono text-[11px] text-dim">
                      {s.label}: <span dangerouslySetInnerHTML={{ __html: renderAnswerHtml(s.answer) }} />
                    </span>
                  ))}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="mt-1 text-[13px] text-dim">Question no longer in the bank.</p>
        )}
      </section>

      <section className="mt-4 border-[1.5px] border-ink bg-white p-4 shadow-[3px_3px_0_var(--ink)]">
        <div className="section-label">The working for ({part || '?'}) — take {read.take}</div>
        <ul className="mt-1 border-l-3 border-paper-deep pl-3">
          {(working.length ? working : read.lines.map((l) => l.text)).map((t, i) => (
            <li key={i} className="font-mono text-[13px] leading-snug">{t}</li>
          ))}
        </ul>
        {attempt && <p className="mt-2 font-mono text-[12px]">typed: {String(attempt.answer)}</p>}
        <div className="mt-3 section-label">The photo</div>
        {photo ? (
          <img src={`/admin/disputes/${id}/photo`} alt="The page as photographed" className="mt-1 max-h-96 border-[1.5px] border-ink object-contain" />
        ) : (
          <p className="mt-1 text-[13px] text-dim">photo expired</p>
        )}
      </section>

      <section className="mt-4 border-[1.5px] border-ink bg-white p-4 shadow-[3px_3px_0_var(--ink)]">
        <div className="section-label">The criterion</div>
        <p className="question-prose mt-1 text-[13px]">
          {row ? <><span className="font-mono text-[11px]">{row.code}</span> ({row.profile}, {row.mark_value}) — <span dangerouslySetInnerHTML={{ __html: renderMathHtml(row.criterion) }} /></> : 'row not on this question'}
        </p>
        <div className="mt-3 section-label">The decision</div>
        <p className={`mt-1 border-l-3 px-2 py-1 text-[13px] ${decision?.awarded ? 'border-green-pen bg-[#E8F0E9]' : 'border-red-pen bg-[#FDF1F0]'}`}>
          {decision ? `${decision.awarded ? 'awarded' : 'withheld'}${decision.needs_review ? ', sent for review' : ''} — ${decision.reason}` : 'row not on this read'}
        </p>
      </section>

      <section className="mt-4 border-[1.5px] border-ink bg-white p-4 shadow-[3px_3px_0_var(--ink)]">
        <div className="section-label">What to do</div>
        {mailto && (
          <a href={mailto} className="mt-2 block bg-red-pen p-3 text-center font-black text-white shadow-[3px_3px_0_var(--ink)]">
            Reply by email
          </a>
        )}
        {dispute && (
          <form action={reviewDispute} className="mt-3">
            <input type="hidden" name="disputeId" value={String(dispute._id)} />
            <label className="block font-mono text-[10px] uppercase tracking-widest text-dim" htmlFor="note">Note for the record</label>
            <textarea id="note" name="note" required minLength={3} rows={3} className="mt-1 w-full border-[1.5px] border-ink bg-paper p-2 text-sm" placeholder="What you found, and what you told them." />
            <button className="mt-2 min-h-11 w-full border-[1.5px] border-ink bg-white font-mono text-[11px] uppercase tracking-widest">Mark as reviewed</button>
          </form>
        )}
        {reviews.length > 0 && (
          <ul className="mt-3 space-y-1">
            {reviews.map((r) => (
              <li key={String(r._id)} className="border-t border-dashed border-paper-deep pt-1 text-[12px]">
                <span className="font-mono text-[10px] text-dim">{new Date(r.reviewed_at).toLocaleString('en-GB')}</span> {r.note}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-dim">
          Nothing here changes a mark. Replies go from {LANDING.contactEmail}.
          {dispute && (
            <>
              {' '}Golden case: <a href={`/admin/disputes/${id}/export`} className="underline">export</a> ·{' '}
              <a href={`/admin/disputes/${id}/export?image=1`} className="underline">with image</a>
            </>
          )}
        </p>
      </section>
    </div>
  );
}
