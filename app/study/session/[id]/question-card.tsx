'use client';

import { Fragment, useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveDraft, submitAnswer, type Feedback } from './actions';
import { TypedInput } from './typed-input';
import { HintLines, SymbolStrip } from './affordance';
import { isPositionalLabel } from '@/lib/notation';
import { PROFILE_GLOSS } from '@/lib/study/profiles';

export interface CardQuestion {
  sessionId: string;
  index: number;
  total: number;
  kind: 'mcq' | 'structured';
  stimulusHtml?: string;
  stemHtml: string;
  visualHtml?: string;
  parts: {
    label: string;
    promptHtml: string;
    marks: number;
    /** Cloze prose, already split on its gaps: n gaps give n+1 pieces. */
    statementHtml?: string[];
    slots: {
      ref: string;
      label: string;
      promptHtml?: string;
      /** The same prompt as plain text, for the input's accessible name. */
      promptText?: string;
      mode: string;
      /** What is legal to type here, and the symbols the keyboard hides. */
      hints?: string[];
      symbols?: string[];
      /**
       * Set when the answer is entered as several values. The shape only —
       * never the answer, and `boxes` only where the count is part of the
       * question rather than part of the answer.
       */
      input?: { shape: string; boxes?: number; cols?: number };
    }[];
  }[];
  optionsHtml?: string[];
  marks: number;
  /** Marks we award automatically — the denominator a score is out of. */
  auto: number;
  /** Marks the student marks themselves, which are out of that denominator. */
  self: number;
  /** The session's own budget, in the unit it is actually spent in. */
  marksTotal: number;
  marksAnswered: number;
  /**
   * Set when the student is looking back at a question they have answered.
   * Everything is read-only: the card shows what they typed and what it
   * earned, and no attempt is written for a second look.
   */
  /**
   * What was typed and not yet handed in. Restores the question so twenty
   * minutes of work survives a phone call.
   */
  draft?: {
    answers: Record<string, string>;
    values: Record<string, string[]>;
    selected?: number;
    working: string;
  };
  prior?: {
    answers: Record<string, string>;
    selected?: number;
    feedback: Feedback;
  };
  rubricCodes: { code: string; profile: string; mark_value: number; part_label: string }[];
}

type CardSlot = CardQuestion['parts'][number]['slots'][number];
type CardPart = CardQuestion['parts'][number];

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];

/**
 * What to call a box whose slot carries no prompt.
 *
 * lib/notation.ts states the contract: the label is a KEY and the wording the
 * student reads lives in the slot prompt. Where an older question left the
 * prompt empty there is no wording to show, and counting position is the only
 * honest thing left to say — so we say it in words rather than making the
 * student infer it from the order of the boxes.
 */
function ordinalAnswer(slots: CardSlot[], ref: string): string {
  const marked = slots.filter((s) => s.mode === 'answer');
  const i = marked.findIndex((s) => s.ref === ref);
  return `${ORDINALS[i] ?? `${i + 1}th`} answer`;
}

/**
 * What to show beside a box whose slot carries no prompt. A descriptive label
 * IS the wording — "modal_class" is the paper's own name for the thing — so it
 * is shown as words. A positional one names nothing, and counting position out
 * loud is the only honest thing left to say.
 */
function describeSlot(slots: CardSlot[], slot: CardSlot): string {
  return isPositionalLabel(slot.label)
    ? ordinalAnswer(slots, slot.ref)
    : slot.label.replace(/[_-]+/g, ' ');
}

function slotAriaLabel(part: CardPart, slot: CardSlot): string {
  if (part.slots.length === 1) return `Answer to part (${part.label})`;
  const named = slot.promptText?.trim() || describeSlot(part.slots, slot);
  return `Part (${part.label}) (${slot.label}): ${named}`;
}

const chipColor: Record<string, string> = {
  CK: 'bg-[#E8F0E9] text-green-pen',
  AK: 'bg-[#EDF1F8] text-[#3A5A8C]',
  R: 'bg-[#FDF1F0] text-red-pen',
};

export default function QuestionCard({ question }: { question: CardQuestion }) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(
    question.prior?.selected ?? question.draft?.selected ?? null,
  );
  const [partAnswers, setPartAnswers] = useState<Record<string, string>>(
    question.prior?.answers ?? question.draft?.answers ?? {},
  );
  // Typed slots keep their values as a list; partAnswers keeps the single-box
  // ones. A slot is in exactly one of the two.
  const [boxValues, setBoxValues] = useState<Record<string, string[]>>(() =>
    question.prior
      ? splitPriorValues(question.prior.answers, question.parts ?? [])
      : (question.draft?.values ?? {}),
  );
  const [working, setWorking] = useState(question.prior ? '' : (question.draft?.working ?? ''));
  const [feedback, setFeedback] = useState<Feedback | null>(question.prior?.feedback ?? null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const startedAt = useRef(Date.now());

  // Moving to another question resets the card to whatever that question is:
  // blank if it is the one to answer, and their own answers if they are looking
  // back at one they have done.
  useEffect(() => {
    setSelected(question.prior?.selected ?? null);
    setPartAnswers(question.prior?.answers ?? {});
    setWorking('');
    setFeedback(question.prior?.feedback ?? null);
    setError(undefined);
    startedAt.current = Date.now();
  }, [question.sessionId, question.index, question.prior]);

  const reviewing = !!question.prior;
  const href = (i: number) => `/study/session/${question.sessionId}?q=${i}`;

  // R1.8: the student answers SLOTS. "Show that" and "explain" slots are worked
  // on paper and self-marked, so they are not typed in and never gate submit —
  // and a part may hold both kinds at once.
  const markedSlots = question.parts.flatMap((p) => p.slots.filter((s) => s.mode === 'answer'));
  // Which box the caret was last in, so an inserted symbol lands there rather
  // than at the end. box === -1 is a slot with a single box.
  const [focus, setFocus] = useState<{ ref: string; box: number } | null>(null);
  const boxId = (ref: string, box: number) => (box < 0 ? `slot-${ref}` : `slot-${ref}-${box}`);

  const insertSymbol = (ref: string, hasBoxes: boolean, ch: string) => {
    const box = focus?.ref === ref ? focus.box : hasBoxes ? 0 : -1;
    const id = boxId(ref, box);
    const el = document.getElementById(id) as HTMLInputElement | null;
    const caret = el?.selectionStart ?? null;
    const splice = (current: string) => {
      const at = caret ?? current.length;
      return current.slice(0, at) + ch + current.slice(at);
    };
    if (box < 0) {
      setPartAnswers((prev) => ({ ...prev, [ref]: splice(prev[ref] ?? '') }));
    } else {
      setBoxValues((prev) => {
        const values = [...(prev[ref] ?? [])];
        while (values.length <= box) values.push('');
        values[box] = splice(values[box] ?? '');
        return { ...prev, [ref]: values };
      });
    }
    // The value changes on re-render, so the caret is restored after it.
    requestAnimationFrame(() => {
      const after = document.getElementById(id) as HTMLInputElement | null;
      if (!after) return;
      const at = (caret ?? after.value.length - ch.length) + ch.length;
      after.focus();
      after.setSelectionRange(at, at);
    });
  };

  /** A slot has an answer when its box — or any of its boxes — holds one. */
  const filled = (s: { ref: string; input?: unknown }) =>
    s.input
      ? (boxValues[s.ref] ?? []).some((v) => v.trim() !== '')
      : (partAnswers[s.ref] ?? '').trim() !== '';
  // R1.8 §2 — ONE filled slot is enough to hand the question in, because a
  // paper-shaped question can now be the whole session. Requiring every slot
  // was harmless when a session was eight fragments and being stuck cost you
  // one of them; with a 12-mark question it means a student who can do (a),
  // (b) and (c) but not (d) submits nothing, is marked on nothing, and leaves
  // no attempt behind to move their mastery. A candidate leaves a blank and
  // hands the paper in, and the examiner marks the blank wrong — which is
  // exactly what an empty answer already scores here.
  const canSubmit =
    question.kind === 'mcq'
      ? selected !== null
      : markedSlots.some((s) => filled(s));
  const blanks = markedSlots.filter((s) => !filled(s)).length;

  // AUTOSAVE, debounced. Writes a draft and never an attempt: attempts stay
  // append-only and are written once, on submit, by the action below.
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (feedback || question.prior) return; // already answered; nothing to keep
    const typed =
      Object.values(partAnswers).some((v) => v.trim() !== '') ||
      Object.values(boxValues).some((vals) => vals.some((v) => v.trim() !== '')) ||
      working.trim() !== '' ||
      selected !== null;
    if (!typed) return;
    draftTimer.current = setTimeout(() => {
      void saveDraft({
        sessionId: question.sessionId,
        questionIndex: question.index,
        answers: partAnswers,
        values: boxValues,
        selected: selected ?? undefined,
        working,
      });
    }, 800);
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [
    partAnswers,
    boxValues,
    working,
    selected,
    feedback,
    question.prior,
    question.sessionId,
    question.index,
  ]);

  const submit = () => {
    if (!canSubmit) return;
    const answers =
      question.kind === 'mcq'
        ? [{ label: 'a', answer: String(selected) }]
        : markedSlots.map((s) =>
            s.input
              ? {
                  label: s.ref,
                  answer: '',
                  values: (boxValues[s.ref] ?? []).map((v) => v.trim()).filter(Boolean),
                }
              : { label: s.ref, answer: (partAnswers[s.ref] ?? '').trim() },
          );
    startTransition(async () => {
      const res = await submitAnswer({
        sessionId: question.sessionId,
        questionIndex: question.index,
        answers,
        working,
        durationMs: Date.now() - startedAt.current,
      });
      if ('error' in res) setError(res.error);
      else setFeedback(res);
    });
  };

  const earned = feedback
    ? feedback.profile_marks.CK + feedback.profile_marks.AK + feedback.profile_marks.R
    : 0;

  return (
    <article className="mt-4 border-[1.5px] border-ink bg-white p-5 shadow-[4px_4px_0_var(--ink)]">
      {question.stimulusHtml && (
        <div
          className="question-prose mb-3 border-l-3 border-paper-deep pl-3 text-[15px]"
          dangerouslySetInnerHTML={{ __html: question.stimulusHtml }}
        />
      )}

      <div className="flex items-baseline justify-between">
        <div
          className="question-prose text-lg"
          dangerouslySetInnerHTML={{ __html: question.stemHtml }}
        />
        <span className="ml-3 shrink-0 font-mono text-xs text-dim">
          [{question.marks} mark{question.marks === 1 ? '' : 's'}]
        </span>
      </div>

      {question.visualHtml && (
        <div
          className="mt-3 border border-paper-deep bg-white p-2 [&_svg]:h-auto [&_svg]:w-full [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-paper-deep [&_td]:p-1 [&_th]:border [&_th]:border-paper-deep [&_th]:bg-paper-deep [&_th]:p-1"
          dangerouslySetInnerHTML={{ __html: question.visualHtml }}
        />
      )}

      {question.kind === 'mcq' && question.optionsHtml && (
        <div className="mt-4 space-y-2">
          {question.optionsHtml.map((o, i) => (
            <button
              key={i}
              disabled={!!feedback}
              onClick={() => setSelected(i)}
              className={`flex w-full items-baseline gap-2 border-[1.5px] p-3 text-left text-sm ${
                selected === i ? 'border-red-pen bg-[#FDF1F0]' : 'border-paper-deep bg-white'
              } disabled:opacity-70`}
            >
              <span className="font-mono text-xs text-dim">{String.fromCharCode(65 + i)}</span>
              <span dangerouslySetInnerHTML={{ __html: o }} />
            </button>
          ))}
        </div>
      )}

      {question.kind === 'structured' && (
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
              Your working (optional — it can earn method marks)
            </span>
            <textarea
              value={working}
              onChange={(e) => setWorking(e.target.value)}
              disabled={!!feedback}
              rows={4}
              className="mt-1 w-full border border-dashed border-[#B9C4D6] bg-[#FFFDF6] p-2 font-hand text-lg"
              placeholder="Show your steps…"
            />
          </label>
          {question.parts.map((p) => {
            return (
              <div key={p.label}>
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="font-mono text-xs font-semibold">({p.label})</span>
                  <span
                    className="question-prose"
                    dangerouslySetInnerHTML={{ __html: p.promptHtml }}
                  />
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-dim">
                    [{p.marks}]
                  </span>
                </div>
                {/* A statement completed in place: the prose runs on and the
                    answers sit inside it, which is how the papers print it and
                    is why it is one item rather than two questions. */}
                {p.statementHtml && (
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-1 gap-y-2 pl-4 text-sm">
                    {p.statementHtml.map((piece, i) => (
                      <Fragment key={i}>
                        <span
                          className="question-prose"
                          dangerouslySetInnerHTML={{ __html: piece }}
                        />
                        {i < p.slots.length && (
                          <input
                            value={partAnswers[p.slots[i].ref] ?? ''}
                            onChange={(e) =>
                              setPartAnswers((prev) => ({ ...prev, [p.slots[i].ref]: e.target.value }))
                            }
                            disabled={!!feedback}
                            id={`slot-${p.slots[i].ref}`}
                            onFocus={() => setFocus({ ref: p.slots[i].ref, box: -1 })}
                            aria-label={`Answer ${i + 1} in the statement for part (${p.label})`}
                            className="w-24 border-0 border-b-[1.5px] border-ink bg-transparent px-1 py-0.5 text-center font-mono text-sm"
                          />
                        )}
                      </Fragment>
                    ))}
                  </div>
                )}
                {/* A cloze part's gaps are answer slots too. One strip serves
                    the row, inserting into whichever gap the caret is in. */}
                {p.statementHtml && (
                  <div className="pl-4">
                    <SymbolStrip
                      symbols={[...new Set(p.slots.flatMap((sl) => sl.symbols ?? []))]}
                      disabled={!!feedback}
                      onInsert={(ch) =>
                        insertSymbol(
                          focus && p.slots.some((sl) => sl.ref === focus.ref)
                            ? focus.ref
                            : p.slots[0].ref,
                          false,
                          ch,
                        )
                      }
                    />
                    <HintLines hints={[...new Set(p.slots.flatMap((sl) => sl.hints ?? []))].slice(0, 2)} />
                  </div>
                )}

                {/* One row per slot: the paper's (i), (ii), a table cell, or a
                    single unlabelled answer when the part asks for one thing. */}
                {!p.statementHtml && p.slots.map((slot) => {
                  const partFeedback = feedback?.partResults.find((r) => r.label === slot.ref);
                  return (
                    <div key={slot.ref} className={p.slots.length > 1 ? 'mt-2 pl-4' : ''}>
                      {slot.mode === 'answer' ? (
                        <>
                          {/* The label belongs TO THE BOX, on its line, the way
                              a printed paper puts (i) beside the answer line it
                              belongs to. Stacked above, two boxes under one
                              instruction are told apart only by counting, and a
                              student who counts wrong has a correct answer
                              marked wrong — the worst thing this can do. */}
                        {/* Stacked on a phone, side by side once there is room.
                            The label held 42% of a 360px row, which left the
                            box too narrow to see a long answer while typing
                            it. */}
                        <div className="mt-1 flex flex-col items-stretch gap-1 sm:flex-row sm:items-start sm:gap-2">
                          {p.slots.length > 1 && (
                            <label
                              htmlFor={`slot-${slot.ref}`}
                              className="flex min-w-0 items-baseline gap-1.5 text-sm sm:shrink-0 sm:basis-[38%] sm:pt-2"
                            >
                              <span className="font-mono text-[11px] text-dim">({slot.label})</span>
                              {slot.promptHtml ? (
                                <span
                                  className="question-prose"
                                  dangerouslySetInnerHTML={{ __html: slot.promptHtml }}
                                />
                              ) : (
                                <span className="text-dim">{describeSlot(p.slots, slot)}</span>
                              )}
                            </label>
                          )}
                          {slot.input ? (
                            <TypedInput
                              shape={slot.input.shape}
                              boxes={slot.input.boxes}
                              cols={slot.input.cols}
                              values={boxValues[slot.ref] ?? []}
                              onChange={(vals) =>
                                setBoxValues((prev) => ({ ...prev, [slot.ref]: vals }))
                              }
                              disabled={!!feedback}
                              slotRef={slot.ref}
                              describe={slotAriaLabel(p, slot)}
                              onFocusBox={(box) => setFocus({ ref: slot.ref, box })}
                            />
                          ) : (
                            <input
                              id={`slot-${slot.ref}`}
                              value={partAnswers[slot.ref] ?? ''}
                              onChange={(e) =>
                                setPartAnswers((prev) => ({ ...prev, [slot.ref]: e.target.value }))
                              }
                              disabled={!!feedback}
                              onFocus={() => setFocus({ ref: slot.ref, box: -1 })}
                              aria-label={slotAriaLabel(p, slot)}
                              className="w-full border-[1.5px] border-ink p-2 font-mono text-sm"
                              placeholder={
                                p.slots.length > 1
                                  ? `Answer to (${p.label})(${slot.label})`
                                  : `Answer to (${p.label})`
                              }
                            />
                          )}
                          {partFeedback && (
                            <span
                              className={`font-hand text-xl ${partFeedback.correct ? 'text-green-pen' : 'text-red-pen'}`}
                            >
                              {partFeedback.correct ? '✓' : '✗'}
                            </span>
                          )}
                          </div>
                          <div className={p.slots.length > 1 ? 'sm:ml-auto sm:basis-[62%]' : ''}>
                            <SymbolStrip
                              symbols={slot.symbols ?? []}
                              disabled={!!feedback}
                              onInsert={(ch) => insertSymbol(slot.ref, !!slot.input, ch)}
                            />
                            <HintLines hints={slot.hints ?? []} />
                          </div>
                        </>
                      ) : (
                        <>
                          {p.slots.length > 1 && (
                            <div className="flex items-baseline gap-2 text-sm">
                              <span className="font-mono text-[11px] text-dim">({slot.label})</span>
                              {slot.promptHtml && (
                                <span
                                  className="question-prose"
                                  dangerouslySetInnerHTML={{ __html: slot.promptHtml }}
                                />
                              )}
                            </div>
                          )}
                          {slot.mode === 'construct' ? (
                        <p className="mt-1 border-l-3 border-margin bg-[#FFFDF6] py-1 pl-3 text-[13px] text-dim">
                          Do this on graph paper.{' '}
                          {feedback
                            ? 'Check your drawing against the one below'
                            : 'The finished graph is shown once you submit your answers'}{' '}
                          — these marks are left out of your estimate.
                        </p>
                      ) : (
                        <p className="mt-1 border-l-3 border-paper-deep bg-[#FFFDF6] py-1 pl-3 text-[13px] text-dim">
                          Work this one on paper. {feedback ? 'Mark it yourself against the solution below' : 'It is not marked here'} — these marks are left out of your estimate.
                        </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-pen">{error}</p>}

      {reviewing && (
        <p className="mt-4 border-l-3 border-paper-deep bg-[#FFFDF6] p-2 text-[13px] text-dim">
          You have already answered this one — this is what you wrote. It cannot be answered again,
          and looking back does not change your marks.
        </p>
      )}

      {!feedback ? (
        reviewing ? null : (
        <button
          onClick={submit}
          disabled={pending || !canSubmit}
          className="mt-5 w-full bg-red-pen p-3 font-black text-white shadow-[3px_3px_0_var(--ink)] disabled:opacity-50"
        >
          {pending
            ? 'Marking…'
            : blanks > 0 && question.kind === 'structured'
              ? `Submit answer (${blanks} left blank)`
              : 'Submit answer'}
        </button>
        )
      ) : (
        <div className="mt-5">
          <div
            className={`flex items-baseline justify-between border-l-3 p-3 ${
              feedback.correct ? 'border-green-pen bg-[#E8F0E9]' : 'border-red-pen bg-[#FDF1F0]'
            }`}
          >
            <b className={feedback.correct ? 'text-green-pen' : 'text-red-pen'}>
              {feedback.correct ? (
                'Correct ✓'
              ) : feedback.isMisconception ? (
                <span dangerouslySetInnerHTML={{ __html: feedback.feedbackTitleHtml }} />
              ) : (
                'Not quite ✗'
              )}
            </b>
            <span className="text-right font-mono text-xs">
              {earned}/{question.auto}
              {question.self > 0 && (
                <span className="block text-[10px] text-dim">
                  {question.auto} marked here · {question.self} you mark yourself
                </span>
              )}
            </span>
          </div>

          {feedback.formatFeedback && (
            <p className="mt-2 border-l-3 border-[#D9A62E] bg-[#FDF8EC] p-2 text-sm">
              {feedback.formatFeedback}
            </p>
          )}

          {question.rubricCodes.length > 0 && (
            <>
              <p className="mt-2 text-[11px] leading-snug text-dim">{PROFILE_GLOSS}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {question.rubricCodes.map((r) => {
                const got = feedback.rubric_awarded.includes(r.code);
                return (
                  <span
                    key={r.code}
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                      got ? chipColor[r.profile] : 'bg-paper-deep text-dim line-through'
                    }`}
                  >
                    ({r.part_label}) {r.code} {got ? '✓' : '✗'}
                  </span>
                );
              })}
            </div>
            </>
          )}

          {feedback.construction && (
            <div className="mt-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
                {feedback.construction.figureHtml
                  ? 'Your drawing should look like this'
                  : 'Your drawing should show this'}
              </div>
              {/* A pattern question has no stored picture of the answer — its
                  figure is the premise — so it says what the drawing should
                  show instead of showing the wrong thing. */}
              {feedback.construction.figureHtml ? (
                <div
                  className="mt-1 border border-paper-deep bg-white p-2 [&_svg]:h-auto [&_svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: feedback.construction.figureHtml }}
                />
              ) : (
                feedback.construction.describes && (
                  <div
                    className="question-prose mt-1 border-l-3 border-paper-deep pl-3 text-[15px]"
                    dangerouslySetInnerHTML={{ __html: feedback.construction.describes }}
                  />
                )
              )}
              <ul className="mt-2 space-y-1">
                {feedback.construction.acts.map((act) => (
                  <li key={act} className="flex gap-2 text-[13px]">
                    <span className="font-hand text-lg leading-none text-dim">☐</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
              {feedback.correct
                ? 'Worked solution'
                : feedback.isMisconception
                  ? 'What went wrong'
                  : 'Worked solution'}
            </div>
            <div
              className="question-prose mt-1 text-[15px]"
              dangerouslySetInnerHTML={{ __html: feedback.feedbackHtml }}
            />
          </div>

          {reviewing ? (
            // No ?q= at all. The session resumes at the first unanswered
            // question, or the summary when there is none, and the page works
            // that out from the attempts. Pointing this at the LAST question
            // instead was a link to the current page whenever the last question
            // was the one being reviewed, which is where a student ends up, so
            // the button did nothing.
            <Link
              href={`/study/session/${question.sessionId}`}
              className="mt-4 block bg-ink p-3 text-center font-black text-paper shadow-[3px_3px_0_var(--red)]"
            >
              Back to where you were →
            </Link>
          ) : (
            <button
              onClick={() => startTransition(() => router.refresh())}
              disabled={pending}
              className="mt-4 w-full bg-ink p-3 font-black text-paper shadow-[3px_3px_0_var(--red)] disabled:opacity-60"
            >
              {question.index + 1 >= question.total ? 'Finish session' : 'Next question →'}
            </button>
          )}
        </div>
      )}

      {/* Looking back costs nothing and writes nothing, so the way back is
          always open; forward stops at the question they are actually on. */}
      {question.total > 1 && (
        <nav className="mt-4 flex items-center justify-between border-t border-dashed border-paper-deep pt-3 font-mono text-[11px] uppercase tracking-widest">
          {question.index > 0 ? (
            <Link href={href(question.index - 1)} className="text-dim underline">
              ← previous
            </Link>
          ) : (
            <span className="text-paper-deep">← previous</span>
          )}
          <span className="text-dim">
            {question.index + 1} / {question.total}
          </span>
          {/* Only when it is the ONLY way forward. While a question is being
              answered the feedback block already carries "next question", and a
              greyed arrow beside it is a second control for the same move that
              looks broken rather than absent. */}
          {reviewing && question.index + 1 < question.total ? (
            <Link href={href(question.index + 1)} className="text-dim underline">
              next →
            </Link>
          ) : (
            <span aria-hidden />
          )}
        </nav>
      )}
    </article>
  );
}

/**
 * A revisited question shows what was typed. Typed slots stored their values
 * composed into one line, so they are split back for display — display only,
 * never for marking, which used the values as they were entered.
 */
function splitPriorValues(
  answers: Record<string, string>,
  parts: { slots: { ref: string; input?: { shape: string } }[] }[],
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const p of parts) {
    for (const s of p.slots) {
      if (!s.input) continue;
      const stored = answers[s.ref];
      if (!stored) continue;
      out[s.ref] = stored
        .replace(/^[([{]|[)\]}]$/g, '')
        .split(/\s*,\s*|\s+or\s+|\s*:\s*/)
        .map((v) => v.trim())
        .filter(Boolean);
    }
  }
  return out;
}
