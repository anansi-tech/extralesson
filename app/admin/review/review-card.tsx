'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { approveQuestion, rejectQuestion, restoreQuestion, saveQuestionEdit } from './actions';

export interface ReviewQuestion {
  id: string;
  status: string;
  promptVersion?: string;
  /** Reasons to look, from lib/admin/review-flags — never verdicts. */
  flags: { level: 'warn' | 'note'; text: string }[];
  /** The question to return to after acting on this one. */
  backTo?: string;
  /** True when this question was asked for by id rather than handed out by the
   *  queue — so there is somewhere to go back TO. */
  pinned?: boolean;
  /** This question's own objectives, and how much else covers them. */
  objectives: { id: string; text: string; approvedOthers: number; draftOthers: number }[];
  objective_ids: string[];
  module: number;
  kind: 'mcq' | 'structured';
  archetype?: string;
  representation?: string;
  stimulusHtml?: string;
  stimulusTableHtml?: string;
  stemHtml: string;
  visualHtml?: string;
  figureMinWidth?: number;
  figureMaxWidth?: number;
  parts: {
    label: string;
    promptHtml: string;
    /** Cloze prose split on its gaps; the reviewer sees the answers in place. */
    statementHtml?: string[];
    marks: number;
    slots: { label: string; promptHtml?: string; answerHtml: string; acceptHtml?: string }[];
  }[];
  optionsHtml?: string[];
  answer_key?: number;
  profile?: string;
  difficulty: number;
  marks: number;
  rubric?: {
    code: string;
    profile: string;
    criterionHtml: string;
    mark_value: number;
    part_label: string;
  }[];
  finalAnswerHtml?: string;
  solutionHtml: string;
  misconceptions: { triggerHtml: string; nameHtml: string; remediationHtml: string }[];
  recipeJson?: string;
  dedupScore?: number;
  editJson: string;
}

const chipColor: Record<string, string> = {
  CK: 'bg-[#E8F0E9] text-green-pen',
  AK: 'bg-[#EDF1F8] text-[#3A5A8C]',
  R: 'bg-[#FDF1F0] text-red-pen',
};

function Chip({ profile, code }: { profile: string; code?: string }) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${chipColor[profile] ?? ''}`}
    >
      {code ?? profile}
    </span>
  );
}

// Keyboard-first review card (ROUND_1 §5): A = approve, R = reject, E = edit.
// Server actions revalidate the page, which auto-advances to the next draft.
export default function ReviewCard({ question }: { question: ReviewQuestion }) {
  const [editing, setEditing] = useState(false);
  const [json, setJson] = useState(question.editJson);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditing(false);
    setJson(question.editJson);
    setError(undefined);
  }, [question.id, question.editJson]);

  // Acting moves the queue on, so the question just judged — a keystroke is the
  // easy way to approve the wrong thing — would otherwise be unreachable, and
  // `from` carries its id to the next page as the way back. It is dropped once
  // rendered because it is true for that one view: a refresh hours later should
  // not still offer it. replaceState, so the link on screen stays put.
  useEffect(() => {
    if (!question.backTo) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has('from')) return;
    url.searchParams.delete('from');
    window.history.replaceState(null, '', url.pathname + url.search);
  }, [question.backTo]);

  const act = (fn: (id: string) => Promise<void>) =>
    startTransition(async () => {
      await fn(question.id);
      router.replace(`/admin/review?from=${question.id}`);
    });

  // R IS DELIBERATE (ROUND_7 Task 3): retiring an approved question is asked
  // once; a draft is rejected without a question, as before.
  const retire = () => {
    if (question.status === 'approved' && !window.confirm('Retire this approved question? Students stop seeing it; this can be undone from the review queue.')) return;
    act(rejectQuestion);
  };

  const cardRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      // Only while the card itself has focus: a keypress anywhere else on the
      // page — the search box, a link — must not retire a live question.
      if (!cardRef.current?.contains(document.activeElement)) return;
      // The keys do exactly what the buttons do and nothing more.
      if ((e.key === 'a' || e.key === 'A') && question.status === 'draft') act(approveQuestion);
      if ((e.key === 'r' || e.key === 'R') && question.status !== 'retired') retire();
      if (e.key === 'e' || e.key === 'E') {
        setEditing(true);
        setTimeout(() => editRef.current?.focus(), 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, question.id, question.status]);

  const saveEdit = () =>
    startTransition(async () => {
      const res = await saveQuestionEdit(question.id, json);
      if (res.error) {
        setError(res.error);
        return;
      }
      // Close the editor so the reviewer reads the rendered result and decides
      // whether to approve it, rather than approving unseen.
      setError(undefined);
      setEditing(false);
    });

  return (
    <article ref={cardRef} tabIndex={0} className="border-[1.5px] border-ink bg-white p-5 shadow-[4px_4px_0_var(--ink)] focus:outline-dashed focus:outline-2 focus:outline-red-pen">
      {(question.backTo || question.pinned) && (
        <div className="mb-3 flex flex-wrap items-baseline gap-4 font-mono text-[11px] uppercase tracking-widest text-dim">
          {question.backTo && (
            <Link href={`/admin/review?id=${question.backTo}`} className="inline-flex min-h-11 items-center underline">
              ← back to {question.backTo.slice(-6)}
            </Link>
          )}
          {/* Looking at a question you asked for by id is a detour. Without
              this the only way back to the queue was the browser's own back
              button, which is not a thing to rely on mid-review. */}
          {question.pinned && (
            <Link href="/admin/review" className="ml-auto underline">
              back to the queue →
            </Link>
          )}
        </div>
      )}

      {question.flags.length > 0 && (
        <ul className="mb-3 space-y-1">
          {question.flags.map((f) => (
            <li
              key={f.text}
              className={`border-l-3 py-1 pl-2 text-[13px] ${
                f.level === 'warn' ? 'border-red-pen bg-[#FDF1F0]' : 'border-paper-deep bg-[#FFFDF6] text-dim'
              }`}
            >
              {f.text}
            </li>
          ))}
        </ul>
      )}

      {/* The objectives this question is evidence for: one that is the ONLY
          approved evidence for it is worth editing rather than rejecting. */}
      <div className="mb-3 space-y-1">
        {question.objectives.map((o) => (
          <div key={o.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px]">
            <span className="shrink-0 font-mono text-xs font-semibold">{o.id}</span>
            <span
              className={`shrink-0 rounded px-1 py-0.5 font-mono text-[10px] ${
                o.approvedOthers === 0
                  ? 'bg-[#FDF1F0] text-red-pen'
                  : o.approvedOthers === 1
                    ? 'bg-[#FDF8EC] text-[#8A6D1F]'
                    : 'bg-[#E8F0E9] text-green-pen'
              }`}
            >
              {o.approvedOthers === 0
                ? 'the only evidence'
                : `${o.approvedOthers} other approved`}
              {o.draftOthers > 0 ? ` · ${o.draftOthers} more in draft` : ''}
            </span>
            <span className="min-w-0 basis-full text-dim sm:flex-1 sm:basis-auto">{o.text}</span>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-xs text-dim">
        <span className="font-semibold text-ink">M{question.module}</span>
        <span
          className={
            question.status === 'approved'
              ? 'uppercase text-green-pen'
              : question.status === 'retired'
                ? 'uppercase text-red-pen'
                : 'uppercase'
          }
        >
          {question.status}
        </span>
        <span>{question.id.slice(-6)}</span>
        {question.promptVersion && <span>· {question.promptVersion}</span>}
        <span>{question.objective_ids.join(', ')}</span>
        <span>· {question.kind}</span>
        <span>· difficulty {question.difficulty}</span>
        <span>· {question.marks} mark{question.marks === 1 ? '' : 's'}</span>
        {question.archetype && <span>· {question.archetype}</span>}
        {question.representation && <span>· {question.representation}</span>}
        {question.kind === 'mcq' && question.profile && <Chip profile={question.profile} />}
      </div>

      {question.recipeJson && (
        // JSON.stringify emits no spaces, so the recipe is one unbroken token
        // and the browser has nowhere to wrap it — it ran out of the dashed box
        // and off the card. break-all lets it wrap anywhere.
        <div className="mb-3 break-all border border-dashed border-paper-deep p-2 font-mono text-[10px] text-dim">
          RECIPE {question.recipeJson}
          {question.dedupScore != null && ` · dedup ${question.dedupScore}`}
        </div>
      )}

      {question.stimulusHtml && (
        <div
          className="question-prose mb-2 border-l-3 border-paper-deep pl-3 text-[15px]"
          dangerouslySetInnerHTML={{ __html: question.stimulusHtml }}
        />
      )}

      {question.stimulusTableHtml && (
        // Same frame as the study card, and with no minimum width so it reflows.
        <div className="figure-frame mt-3">
          <div
            className="figure-inner [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-paper-deep [&_td]:p-1 [&_th]:border [&_th]:border-paper-deep [&_th]:bg-paper-deep [&_th]:p-1"
            dangerouslySetInnerHTML={{ __html: question.stimulusTableHtml }}
          />
        </div>
      )}

      <div
        className="question-prose text-lg"
        dangerouslySetInnerHTML={{ __html: question.stemHtml }}
      />

      {question.visualHtml && (
        // Same frame as the study card: a reviewer judging a figure on a phone
        // needs to read it for the same reason a student does.
        <div className="figure-frame mt-3">
          <div
            className="figure-inner [&_svg]:h-auto [&_svg]:w-full [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-paper-deep [&_td]:p-1 [&_th]:border [&_th]:border-paper-deep [&_th]:bg-paper-deep [&_th]:p-1"
            style={{ minWidth: question.figureMinWidth, maxWidth: question.figureMaxWidth }}
            dangerouslySetInnerHTML={{ __html: question.visualHtml }}
          />
        </div>
      )}

      {question.kind === 'structured' && question.parts.length > 0 && (
        <ol className="mt-3 space-y-2">
          {question.parts.map((p) => (
            <li key={p.label} className="text-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs font-semibold">({p.label})</span>
                <span
                  className="question-prose"
                  dangerouslySetInnerHTML={{ __html: p.promptHtml }}
                />
                <span className="ml-auto shrink-0 font-mono text-[10px] text-dim">
                  [{p.marks}]
                </span>
              </div>
              {/* A cloze part reads as the sentence it is, with each answer
                  shown where the student would write it. */}
              {p.statementHtml && (
                // text-sm, not text-xs: this is the part's own sentence
                // continuing, and KaTeX draws = as two hairlines a pixel apart
                // that merge into a minus below ~14px. "24 = 2^3 x 3" read as
                // "24 - 2^3 x 3".
                <div className="mt-0.5 pl-7 text-sm">
                  {p.statementHtml.map((piece, i) => (
                    <span key={i}>
                      <span className="question-prose" dangerouslySetInnerHTML={{ __html: piece }} />
                      {i < p.slots.length && (
                        <span
                          // inline-block, or the underline is drawn at the
                          // text baseline and cuts through a tall answer — a
                          // column vector gets a line through its bottom row.
                          className="mx-1 inline-block border-b border-ink px-1 align-middle font-mono"
                          dangerouslySetInnerHTML={{ __html: p.slots[i].answerHtml }}
                        />
                      )}
                    </span>
                  ))}
                </div>
              )}
              {!p.statementHtml && p.slots.map((slot) => (
              <div key={slot.label} className="mt-0.5 pl-7 text-xs text-dim">
                {p.slots.length > 1 && <span className="font-mono text-[10px]">({slot.label}) </span>}
                {slot.promptHtml && (
                  <span className="question-prose" dangerouslySetInnerHTML={{ __html: slot.promptHtml }} />
                )}
                <span className="font-mono">→ </span>
                <span dangerouslySetInnerHTML={{ __html: slot.answerHtml }} />
                {slot.acceptHtml && (
                  <>
                    <span className="font-mono"> · accept </span>
                    <span dangerouslySetInnerHTML={{ __html: slot.acceptHtml }} />
                  </>
                )}
              </div>
              ))}
            </li>
          ))}
        </ol>
      )}

      {question.optionsHtml && (
        <ol className="mt-3 space-y-1">
          {question.optionsHtml.map((o, i) => (
            <li
              key={i}
              className={`flex gap-2 border-b border-paper-deep py-1 text-sm ${
                i === question.answer_key ? 'font-bold text-green-pen' : ''
              }`}
            >
              <span className="font-mono text-xs text-dim">{String.fromCharCode(65 + i)}</span>
              <span dangerouslySetInnerHTML={{ __html: o }} />
              {i === question.answer_key && <span className="font-mono text-xs">✓ KEY</span>}
            </li>
          ))}
        </ol>
      )}

      {question.rubric && (
        <div className="mt-3">
          <div className="section-label">Rubric</div>
          <ul className="mt-1 space-y-1">
            {question.rubric.map((r) => (
              <li key={r.code} className="flex items-baseline gap-2 text-sm">
                <Chip profile={r.profile} code={r.code} />
                <span className="font-mono text-[10px] text-dim">({r.part_label})</span>
                <span dangerouslySetInnerHTML={{ __html: r.criterionHtml }} />
                <span className="ml-auto font-mono text-xs text-dim">{r.mark_value}</span>
              </li>
            ))}
          </ul>
          {question.finalAnswerHtml && (
            <div className="mt-2 text-xs">
              <span className="font-mono text-dim">FINAL ANSWER: </span>
              <span dangerouslySetInnerHTML={{ __html: question.finalAnswerHtml }} />
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <div className="section-label">
          Worked solution
        </div>
        <div
          className="question-prose mt-1 text-[15px]"
          dangerouslySetInnerHTML={{ __html: question.solutionHtml }}
        />
      </div>

      {question.misconceptions.length > 0 && (
        <div className="mt-4">
          <div className="section-label">
            Misconceptions
          </div>
          <ul className="mt-1 space-y-1">
            {question.misconceptions.map((m, i) => (
              <li key={i} className="border-l-3 border-red-pen bg-[#FDF1F0] p-2 text-sm">
                <b dangerouslySetInnerHTML={{ __html: m.nameHtml }} />{' '}
                <span className="text-xs text-dim">
                  (<span dangerouslySetInnerHTML={{ __html: m.triggerHtml }} />)
                </span>
                <div className="question-prose" dangerouslySetInnerHTML={{ __html: m.remediationHtml }} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing ? (
        <div className="mt-4">
          <textarea
            ref={editRef}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={16}
            className="w-full border-[1.5px] border-ink p-2 font-mono text-xs"
          />
          {error && <p className="mt-1 text-sm text-red-pen">{error}</p>}
          <div className="mt-2 flex gap-2">
            <button
              onClick={saveEdit}
              disabled={pending}
              className="bg-ink px-4 py-2 font-bold text-white shadow-[3px_3px_0_var(--rule)] disabled:opacity-60"
            >
              {pending ? 'Checking…' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="border-[1.5px] border-ink px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-3">
          {question.status === 'retired' ? (
            <button
              onClick={() => act(restoreQuestion)}
              disabled={pending}
              className="border-[1.5px] border-ink px-4 py-2 font-bold disabled:opacity-60"
            >
              Put back in the queue
            </button>
          ) : (
            <button
              onClick={() => act(approveQuestion)}
              disabled={pending || question.status !== 'draft'}
              className="bg-green-pen px-4 py-2 font-bold text-white shadow-[3px_3px_0_var(--ink)] disabled:opacity-60"
            >
              {question.status === 'approved' ? 'Approved' : 'Approve'}{' '}
              <kbd className="font-mono text-xs opacity-80">A</kbd>
            </button>
          )}
          <button
            onClick={() => {
              setEditing(true);
              setTimeout(() => editRef.current?.focus(), 0);
            }}
            className="border-[1.5px] border-ink px-4 py-2 font-bold"
          >
            Edit <kbd className="font-mono text-xs text-dim">E</kbd>
          </button>
          <button
            onClick={retire}
            disabled={pending || question.status === 'retired'}
            className="bg-red-pen px-4 py-2 font-bold text-white shadow-[3px_3px_0_var(--ink)] disabled:opacity-60"
          >
            {question.status === 'approved' ? 'Retire' : 'Reject'}{' '}
            <kbd className="font-mono text-xs opacity-80">R</kbd>
          </button>
          {pending && <span className="font-mono text-xs text-dim">saving…</span>}
        </div>
      )}
    </article>
  );
}
