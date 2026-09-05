'use client';

import { Fragment, useCallback, useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveDraft, submitAnswer, type Feedback } from './actions';
import { attemptOutcome, type OutcomeRead } from '@/lib/study/outcome';
import { RetryMarkingButton } from './retry-marking-button';
import type { ReadResult } from './capture';
import { TypedInput } from './typed-input';
import { HintLines, SymbolStrip } from './affordance';
import { WorkingPhoto } from './working-photo';
import { WorkingRead } from './working-read';
import { isPositionalLabel } from '@/lib/notation';
import { PROFILE_GLOSS } from '@/lib/study/profiles';

export interface CardQuestion {
  sessionId: string;
  index: number;
  total: number;
  kind: 'mcq' | 'structured';
  stimulusHtml?: string;
  stimulusTableHtml?: string;
  stemHtml: string;
  visualHtml?: string;
  /** The narrowest this figure stays readable at; it scrolls below that. */
  figureMinWidth?: number;
  figureMaxWidth?: number;
  parts: {
    label: string;
    promptHtml: string;
    /** The prompt as plain text, for an accessible name. */
    promptText: string;
    marks: number;
    /** Cloze prose, already split on its gaps: n gaps give n+1 pieces. */
    statementHtml?: string[];
    slots: {
      ref: string;
      label: string;
      promptHtml?: string;
      /** The same prompt as plain text, for the input's accessible name. */
      promptText?: string;
      /** What this box is for, read off the table it completes. */
      cellName?: string;
      mode: string;
      /** What is legal to type here, and the symbols the keyboard hides. */
      hints?: string[];
      symbols?: string[];
      /**
       * Set when the answer is entered as several values. The shape only —
       * never the answer, and `boxes` only where the count is part of the
       * question rather than part of the answer.
       */
      input?: { shape: string; boxes?: number; cols?: number; chars?: number; pairs?: boolean };
    }[];
  }[];
  optionsHtml?: string[];
  marks: number;
  /** The session's own budget, in the unit it is actually spent in. */
  marksTotal: number;
  marksAnswered: number;
  /** What was typed and not yet handed in, so work survives a phone call. */
  draft?: {
    answers: Record<string, string>;
    values: Record<string, string[]>;
    selected?: number;
    /** The page already photographed for this question, before submit. */
    read?: ReadResult & { rejected?: number[] };
  };
  prior?: {
    answers: Record<string, string>;
    selected?: number;
    feedback: Feedback;
    /** What the photograph read and earned, one entry per take. Review only. */
    working?: {
      take: number;
      of: number;
      transcriptionId: string;
      /** Rows already reported, so the button does not come back on reload. */
      disputed: string[];
      /** Lines the student took out of marking, by index. */
      rejected: number[];
      lines: { text: string; part_label: string | null; confidence: number }[];
      legible: boolean;
      /** The marker finished on this take; a failed marking decides nothing. */
      marked: boolean;
      notes?: string;
      method: { code: string; awarded: boolean; reason: string }[];
      /** Where the working slipped, per part; the first line under that part. */
      slips?: { part: string; quote: string; sentence: string }[];
    }[];
  };
  rubricCodes: {
    code: string;
    profile: 'CK' | 'AK' | 'R';
    mark_value: number;
    part_label: string;
    slot_ref: string;
  }[];
}

/** The MCQ index that means "I don't know": past every real option, so it can only score wrong. */
export const DONT_KNOW = 4;

type CardSlot = CardQuestion['parts'][number]['slots'][number];
type CardPart = CardQuestion['parts'][number];

/**
 * What a box is called when its slot carries no prompt: the cell it fills, a
 * descriptive label's own words, or the PART's prompt — never a position
 * counted out in words, which names nothing the student can act on.
 */
function describeSlot(part: CardPart, slot: CardSlot): string {
  if (slot.cellName) return slot.cellName;
  return isPositionalLabel(slot.label) ? part.promptText : slot.label.replace(/[_-]+/g, ' ');
}

function slotAriaLabel(part: CardPart, slot: CardSlot): string {
  if (part.slots.length === 1) return `Answer to part (${part.label})`;
  const named = slot.promptText?.trim() || describeSlot(part, slot);
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
  const [feedback, setFeedback] = useState<Feedback | null>(question.prior?.feedback ?? null);
  const [reading, setReading] = useState(false);
  // HONEST PREFILL (ROUND_7 Task 2): a read fills single boxes only. Which
  // boxes it filled and which it did not is said, with a way to each.
  const [readFilled, setReadFilled] = useState<string[] | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const startedAt = useRef(Date.now());

  // Moving to another question resets the card to that question, mirroring the
  // useState initialisers, which run only on MOUNT and so never on an in-app
  // move. `question.draft` is deliberately NOT a dependency: a fresh object
  // every render, it would reset the card mid-keystroke.
  useEffect(() => {
    setSelected(question.prior?.selected ?? question.draft?.selected ?? null);
    setPartAnswers(question.prior?.answers ?? question.draft?.answers ?? {});
    setBoxValues(
      question.prior
        ? splitPriorValues(question.prior.answers, question.parts ?? [])
        : (question.draft?.values ?? {}),
    );
    setFeedback(question.prior?.feedback ?? null);
    setError(undefined);
    startedAt.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.sessionId, question.index, question.prior]);

  const reviewing = !!question.prior;
  const href = (i: number) => `/study/session/${question.sessionId}?q=${i}`;

  // R1.8: the student answers SLOTS. "Show that" and "explain" slots are worked
  // on paper and self-marked, so they are not typed in and never gate submit —
  // and a part may hold both kinds at once.
  const markedSlots = question.parts.flatMap((p) => p.slots.filter((s) => s.mode === 'answer'));
  // The figure has to stay reachable while a later part is answered: at 360px
  // the last input of a 12-mark question sits 909px below it, more than a
  // screen. A control brings the figure back OVER the page, so dismissing it
  // returns the student exactly where they were — the page never moved.
  const figureRef = useRef<HTMLDivElement | null>(null);
  const submitRef = useRef<HTMLButtonElement | null>(null);
  const [figureAway, setFigureAway] = useState(false);
  const [atSubmit, setAtSubmit] = useState(false);
  const [figureOpen, setFigureOpen] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const watch = (el: Element | null, set: (v: boolean) => void, want: boolean) => {
      if (!el) return undefined;
      const io = new IntersectionObserver(([e]) => set(e.isIntersecting === want), {
        threshold: 0.01,
      });
      io.observe(el);
      return io;
    };
    const a = watch(figureRef.current, setFigureAway, false);
    // The recall button is pinned bottom-right and the submit button is the
    // last thing on the card, so at the foot of a long question they sat on top
    // of each other — measured at 390px, a 93x7px overlap across the submit
    // button's corner. Once the student has scrolled to the submit button the
    // whole card is behind them; the recall goes away rather than covering it.
    const b = watch(submitRef.current, setAtSubmit, true);
    return () => {
      a?.disconnect();
      b?.disconnect();
    };
  }, [question.visualHtml, feedback]);

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

  const filled = (s: { ref: string; input?: unknown }) =>
    s.input
      ? (boxValues[s.ref] ?? []).some((v) => v.trim() !== '')
      : (partAnswers[s.ref] ?? '').trim() !== '';
  // ONE filled slot hands the question in, because a paper-shaped question can
  // be the whole session: requiring every slot meant a student who could do (a)
  // to (c) but not (d) submitted nothing and left no attempt behind. The two
  // layouts — a stacked box, and a gap inside a cloze statement — differ only in
  // PRESENTATION, so both branch on slot.input and no shape is honoured in one.
  const slotAnswerInput = (
    slot: { ref: string; input?: { shape: string; boxes?: number; cols?: number; chars?: number; pairs?: boolean } },
    opts: { describe: string; className: string; placeholder?: string },
  ) =>
    slot.input ? (
      <TypedInput
        shape={slot.input.shape}
        boxes={slot.input.boxes}
        pairs={slot.input.pairs}
        cols={slot.input.cols}
        chars={slot.input.chars}
        values={boxValues[slot.ref] ?? []}
        onChange={(vals) => setBoxValues((prev) => ({ ...prev, [slot.ref]: vals }))}
        disabled={!!feedback}
        slotRef={slot.ref}
        describe={opts.describe}
        onFocusBox={(box) => setFocus({ ref: slot.ref, box })}
      />
    ) : (
      <input
        id={`slot-${slot.ref}`}
        value={partAnswers[slot.ref] ?? ''}
        onChange={(e) => setPartAnswers((prev) => ({ ...prev, [slot.ref]: e.target.value }))}
        disabled={!!feedback}
        onFocus={() => setFocus({ ref: slot.ref, box: -1 })}
        aria-label={opts.describe}
        className={opts.className}
        placeholder={opts.placeholder}
      />
    );

  // HAND IN AS IS (ROUND_7 Task 2): a student who does not know the answer
  // can still hand in. A blank scores zero, like the exam, and the solution
  // is what they get for it; there is no other path to it.
  const canSubmit = question.kind === 'mcq' ? selected !== null : markedSlots.length > 0;
  const blanks = markedSlots.filter((s) => !filled(s)).length;

  // AUTOSAVE writes a draft and never an attempt: attempts stay append-only and
  // are written once, on submit. Debounced while typing, and FLUSHED wherever
  // the page might stop existing — the debounce otherwise loses the last 800ms
  // when a student switches app or locks the phone, which is when they most
  // need it. visibilitychange is the one event a mobile app switch fires.
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Values and feedback only. `prior` is a PROP, already describing the
  // question ARRIVING, so a guard reading it here would refuse to save the
  // draft of the question being left.
  const latest = useRef({ partAnswers, boxValues, selected, feedback });
  latest.current = { partAnswers, boxValues, selected, feedback };

  // The question is passed IN, not read from props: the card is re-rendered
  // rather than remounted between questions, so a save fired on the way out
  // would write question 2's answers under question 3's index.
  const saveDraftFor = useCallback((sessionId: string, questionIndex: number) => {
    const { partAnswers: a, boxValues: v, selected: sel, feedback: fb } = latest.current;
    // Feedback is STATE, so at cleanup it is still the outgoing question's.
    // A submitted question has an attempt and needs no draft.
    if (fb) return;
    const typed =
      Object.values(a).some((x) => x.trim() !== '') ||
      Object.values(v).some((vals) => vals.some((x) => x.trim() !== '')) ||
      sel !== null;
    if (!typed) return null;
    return saveDraft({
      sessionId,
      questionIndex,
      answers: a,
      values: v,
      selected: sel ?? undefined,
    });
  }, []);

  const saveNow = useCallback(() => {
    if (question.prior) return;
    void saveDraftFor(question.sessionId, question.index);
  }, [saveDraftFor, question.prior, question.sessionId, question.index]);

  useEffect(() => {
    if (feedback || question.prior) return;
    draftTimer.current = setTimeout(saveNow, 800);
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [partAnswers, boxValues, selected, feedback, question.prior, saveNow]);

  useEffect(() => {
    if (feedback || question.prior) return;
    const flush = () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
      saveNow();
    };
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    // A page restored from the back/forward cache carries the DOM as it was
    // when the student left it, which is older than the draft they went on to
    // save. Re-render from the server instead of trusting it.
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) router.refresh();
    };
    window.addEventListener('blur', flush);
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', flush);
    window.addEventListener('pageshow', onShow);
    return () => {
      window.removeEventListener('blur', flush);
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('pageshow', onShow);
    };
  }, [feedback, question.prior, saveNow, router]);

  // blur, visibilitychange and pagehide all mean "the tab is going away", and
  // none fires on navigation INSIDE the app, which is how a student moves.
  // Unmount does not catch it either: QuestionCard has no key, so moving
  // between questions re-renders the same instance. Keyed on the question, so
  // the cleanup runs with the session and index it was set up with.
  useEffect(() => {
    const sessionId = question.sessionId;
    const index = question.index;
    // Captured with the effect, so it describes the question being left.
    const wasReview = !!question.prior;
    return () => {
      if (wasReview) return; // revisiting writes nothing
      if (draftTimer.current) clearTimeout(draftTimer.current);
      // The page being left is already in the client router cache WITHOUT
      // this draft, so browser back would restore that payload and show an
      // empty box. refresh() drops the cache so the return trip re-fetches.
      void saveDraftFor(sessionId, index)?.then(() => router.refresh());
    };
  }, [question.sessionId, question.index, question.prior, saveDraftFor, router]);

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
        durationMs: Date.now() - startedAt.current,
      });
      if ('error' in res) setError(res.error);
      else setFeedback(res);
    });
  };

  // THE ONE FOLD (ROUND_6 Task 1): the same function every other surface calls.
  const reads: OutcomeRead[] = [
    ...(feedback?.working ? [{ legible: feedback.working.transcription.legible, marker_version: feedback.working.marked ? 'marked' : undefined, method_marks: feedback.working.method }] : []),
    ...(question.prior?.working ?? []).map((w) => ({ legible: w.legible, marker_version: w.marked ? 'marked' : undefined, method_marks: w.method })),
  ];
  const readExists = reads.length > 0;
  // A marking that did not finish is not the photograph's fault, and says so.
  const markingFailed =
    (!!feedback?.working && !feedback.working.marked) || (question.prior?.working ?? []).some((w) => !w.marked);
  // THE SLIP COMES FIRST (ROUND_7 Task 1): one sentence naming the line where
  // the working went wrong, before any reason or code.
  const slipFor = (part: string) =>
    [...(feedback?.working?.slips ?? []), ...(question.prior?.working ?? []).flatMap((w) => w.slips ?? [])].find((s) => s.part === part)?.sentence;
  const outcome = attemptOutcome(
    { rubric_awarded: feedback?.rubric_awarded ?? [], correct: feedback?.correct },
    {
      parts: question.parts.map((part) => ({ label: part.label, slots: part.slots.map((s) => ({ label: s.label, response_mode: s.mode })) })),
      rubric: question.rubricCodes,
      marks: question.marks,
    },
    reads,
  );
  const earned = feedback ? outcome.earned : 0;
  const outOf = outcome.assessed;
  const stateOf = new Map(outcome.rows.map((r) => [r.code, r.state]));

  return (
    <article className="mt-4 border-[1.5px] border-ink bg-white p-5 shadow-[4px_4px_0_var(--ink)]">
      {question.stimulusHtml && (
        <div
          className="question-prose mb-3 border-l-3 border-paper-deep pl-3 text-[15px]"
          dangerouslySetInnerHTML={{ __html: question.stimulusHtml }}
        />
      )}

      {question.stimulusTableHtml && (
        // The GIVEN data, in the figure frame but with NO minimum width: a
        // table reflows to the sheet it is on, which is why it lives here
        // rather than in the prose as an array that cannot.
        <div className="figure-frame mt-3">
          <div
            className="figure-inner [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-paper-deep [&_td]:p-1 [&_th]:border [&_th]:border-paper-deep [&_th]:bg-paper-deep [&_th]:p-1"
            dangerouslySetInnerHTML={{ __html: question.stimulusTableHtml }}
          />
        </div>
      )}

      <div id="question" className="flex items-baseline justify-between">
        <div
          className="question-prose text-lg"
          dangerouslySetInnerHTML={{ __html: question.stemHtml }}
        />
        <span className="ml-3 shrink-0 font-mono text-xs text-dim">
          [{question.marks} mark{question.marks === 1 ? '' : 's'}]
        </span>
      </div>

      {question.visualHtml && (
        <div className="figure-frame mt-3" ref={figureRef}>
          <div
            className="figure-inner [&_svg]:h-auto [&_svg]:w-full [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-paper-deep [&_td]:p-1 [&_th]:border [&_th]:border-paper-deep [&_th]:bg-paper-deep [&_th]:p-1"
            style={{
              minWidth: question.figureMinWidth,
              maxWidth: question.figureMaxWidth,
            }}
            dangerouslySetInnerHTML={{ __html: question.visualHtml }}
          />
        </div>
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
          {/* The fifth option scores wrong and shows the solution, exactly as a wrong letter does. */}
          <button
            disabled={!!feedback}
            onClick={() => setSelected(DONT_KNOW)}
            className={`flex w-full items-baseline gap-2 border-[1.5px] border-dashed p-3 text-left text-sm ${
              selected === DONT_KNOW ? 'border-red-pen bg-[#FDF1F0]' : 'border-paper-deep bg-white'
            } disabled:opacity-70`}
          >
            <span className="font-mono text-xs text-dim">—</span>
            <span>I don&rsquo;t know</span>
          </button>
        </div>
      )}

      {/* PHOTO FIRST (ROUND_4 Task 1): the camera sits above the boxes from the
          start. A read fills the single-box slots; the student checks them and
          submits, and only then does the read become the answer. */}
      {question.kind === 'structured' && !reviewing && !feedback && (
        <WorkingPhoto
          key={`${question.sessionId}-${question.index}`}
          sessionId={question.sessionId}
          questionIndex={question.index}
          initial={question.draft?.read}
          onRead={(prefill) => {
            setPartAnswers((prev) => ({ ...prev, ...prefill }));
            setReadFilled(Object.keys(prefill));
          }}
          onBusy={setReading}
        />
      )}

      {readFilled && !feedback && (() => {
        const unfilled = markedSlots.filter((sl) => !readFilled.includes(sl.ref));
        const filledRefs = markedSlots.filter((sl) => readFilled.includes(sl.ref)).map((sl) => sl.ref);
        return (
          <p className="mt-2 border-l-3 border-margin bg-[#FFFDF6] py-1 pl-3 text-[12px] leading-snug text-dim">
            {filledRefs.length > 0
              ? `We filled the single answers${filledRefs.length < markedSlots.length ? ` for (${filledRefs.join('), (')})` : ''}.`
              : 'We could not fill any boxes from the page.'}
            {unfilled.length > 0 && (
              <>
                {' '}Enter the rest yourself:{' '}
                {unfilled.map((sl, k) => (
                  <span key={sl.ref}>
                    {k > 0 && ', '}
                    <a href={`#slot-${sl.ref}${sl.input ? '-0' : ''}`} className="underline">({sl.ref})</a>
                  </span>
                ))}
                .
              </>
            )}
          </p>
        );
      })()}

      {question.kind === 'structured' && (
        <div className="mt-4 space-y-4">
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
                          slotAnswerInput(p.slots[i], {
                            describe: `Answer ${i + 1} in the statement for part (${p.label})`,
                            className:
                              'min-h-11 w-24 border-0 border-b-[1.5px] border-ink bg-transparent px-1 py-2 text-center font-mono text-sm',
                          })
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
                          {/* The label belongs TO THE BOX, on its own line: two boxes under one
                              instruction are told apart by counting, and a wrong count marks a
                              correct answer wrong. */}
                        {/* Stacked on a phone, side by side once there is room: the label held
                            42% of a 360px row, leaving the box too narrow to type a long answer in. */}
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
                              ) : slot.cellName || !isPositionalLabel(slot.label) ? (
                                <span className="text-dim">{describeSlot(p, slot)}</span>
                              ) : (
                                <span
                                  className="question-prose text-dim"
                                  dangerouslySetInnerHTML={{ __html: p.promptHtml }}
                                />
                              )}
                            </label>
                          )}
                          {/* Input and its mark stay on one line at every
                              width. Stacking the row on a phone put the tick
                              underneath the box, reading as a separate line of
                              the answer rather than as its verdict. */}
                          <div className="flex min-w-0 flex-1 items-start gap-2">
                          {slotAnswerInput(slot, {
                            describe: slotAriaLabel(p, slot),
                            className: 'min-h-11 w-full border-[1.5px] border-ink p-2 font-mono text-base',
                            placeholder:
                              p.slots.length > 1
                                ? `Answer to (${p.label})(${slot.label})`
                                : `Answer to (${p.label})`,
                          })}
                          {partFeedback && (
                            <span
                              className={`shrink-0 pt-1.5 font-hand text-xl ${
                                partFeedback.formWithheld
                                  ? 'text-[#B8860B]'
                                  : partFeedback.correct
                                    ? 'text-green-pen'
                                    : 'text-red-pen'
                              }`}
                            >
                              {partFeedback.formWithheld ? (
                                <>
                                  ✓<span className="ml-1 font-mono text-[10px]">value · form withheld</span>
                                </>
                              ) : partFeedback.correct ? (
                                '✓'
                              ) : (
                                '✗'
                              )}
                            </span>
                          )}
                          </div>
                          </div>
                          <div className={p.slots.length > 1 ? 'sm:ml-auto sm:basis-[62%]' : ''}>
                            {partFeedback && !partFeedback.correct && slipFor(p.label) && (
                              <p className="mt-1 font-hand text-[15px] leading-snug text-red-pen">{slipFor(p.label)}</p>
                            )}
                            {partFeedback && !partFeedback.correct && partFeedback.reasonHtml && (
                              <p
                                className="question-prose mt-1 border-l-3 border-red-pen bg-[#FDF1F0] px-2 py-1 text-[12px] leading-snug"
                                dangerouslySetInnerHTML={{ __html: partFeedback.reasonHtml }}
                              />
                            )}
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
                          {readExists
                            ? 'Work this one on paper — it is marked from your photograph.'
                            : `Work this one on paper. ${feedback ? 'Mark it yourself against the solution below' : 'Photograph the page and it is marked from there'} — until then these marks are left out of your estimate.`}
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

      {/* THE MARKED QUESTION READS TOP-DOWN (ROUND_7 Task 1): one line that
          says what was earned, and three places to go. */}
      {feedback && (
        <nav id="marking" className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-[1.5px] border-rule pb-2">
          <b className="font-mono text-sm">
            {earned} of {outOf} marks
            {outcome.unassessedMarks > 0 && <span className="font-normal text-dim"> · {outcome.unassessedMarks} unassessed</span>}
          </b>
          <span className="flex gap-x-3 font-mono text-[10px] uppercase tracking-widest">
            <a href="#your-marking" className="underline">Your marking</a>
            <a href="#question" className="underline">Question</a>
            <a href="#worked-solution" className="underline">Worked solution</a>
          </span>
        </nav>
      )}

      {!feedback ? (
        reviewing ? null : (
        <>
        <button
          ref={submitRef}
          onClick={submit}
          disabled={pending || reading || !canSubmit}
          className="mt-5 w-full bg-red-pen p-3 font-black text-white shadow-[3px_3px_0_var(--ink)] disabled:opacity-50"
        >
          {pending
            ? 'Marking…'
            : reading
              ? 'Reading your page…'
              : blanks > 0 && question.kind === 'structured'
                ? 'Hand in as is'
                : 'Submit answer'}
        </button>
        {blanks > 0 && question.kind === 'structured' && !pending && (
          <p className="mt-1 text-center text-[12px] text-dim">
            {blanks} box{blanks === 1 ? '' : 'es'} left blank. Blanks score zero, like the exam.
          </p>
        )}
        {/* Inline, in the place the marking will appear; never a modal. */}
        {pending && (
          <div className="mt-5 animate-pulse" aria-live="polite">
            <div className="font-mono text-[10px] uppercase tracking-widest text-dim">Marking…</div>
            {[3, 2, 4].map((w, i) => (
              <div key={i} className={`mt-2 h-3 rounded bg-paper-deep w-${w}/5`} />
            ))}
          </div>
        )}
        </>
        )
      ) : (
        <div className="mt-5">
          {/* The fraction is the verdict. A cross only at zero: two of three is
              not "not quite", it is two of three. */}
          <div
            className={`flex items-baseline justify-between border-l-3 p-3 ${
              earned === 0
                ? 'border-red-pen bg-[#FDF1F0]'
                : earned >= outOf
                  ? 'border-green-pen bg-[#E8F0E9]'
                  : 'border-[#D9A62E] bg-[#FDF8EC]'
            }`}
          >
            <b className={`font-mono text-lg ${earned === 0 ? 'text-red-pen' : earned >= outOf ? 'text-green-pen' : 'text-ink'}`}>
              {earned}/{outOf}
              {earned === 0 && <span className="ml-1 font-hand">✗</span>}
            </b>
            {markingFailed ? (
              <span className="text-right font-mono text-[10px] text-dim">marking did not finish — try again below</span>
            ) : (
              outcome.unassessedMarks > 0 && (
                <span className="text-right font-mono text-[10px] text-dim">
                  {outcome.unassessedMarks} mark{outcome.unassessedMarks === 1 ? '' : 's'}{' '}
                  {readExists ? 'could not be assessed from this photo' : 'not assessed without the working'}
                </span>
              )
            )}
          </div>
          <div id="your-marking" />

          {feedback.formatFeedbackHtml && (
            <p
              className="question-prose mt-2 border-l-3 border-[#D9A62E] bg-[#FDF8EC] p-2 text-sm"
              dangerouslySetInnerHTML={{ __html: feedback.formatFeedbackHtml }}
            />
          )}

          {feedback.construction && (
            <div className="mt-3">
              <div className="section-label">
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

          <div id="worked-solution" className="mt-3">
            <div className="section-label">
              {feedback.isMisconception ? (
                <span dangerouslySetInnerHTML={{ __html: feedback.feedbackTitleHtml }} />
              ) : (
                'Worked solution'
              )}
            </div>
            <div
              className="question-prose mt-1 text-[15px]"
              dangerouslySetInnerHTML={{ __html: feedback.feedbackHtml }}
            />
          </div>

          {/* After submit the read is marked. A student who typed instead is
              offered the camera only where the working could still earn
              something: a prompt on every question is a chore. */}
          {question.kind === 'structured' && !reviewing && (feedback.working || feedback.earnableByMethod > 0) && (
            <WorkingPhoto
              sessionId={question.sessionId}
              questionIndex={question.index}
              attemptId={feedback.attemptId}
              marks={feedback.earnableByMethod}
              initial={feedback.working}
            />
          )}

          {/* The CAPTURE control is what a finished question does not get; what it
              read is kept and shown. */}
          {reviewing &&
            question.prior?.working?.map((w) => (
              <div key={w.take} className="mt-4 border-t-[1.5px] border-rule pt-4">
                <div className="section-label">
                  Your working on paper
                </div>
                <WorkingRead
                  lines={w.lines}
                  legible={w.legible}
                  notes={w.notes}
                  method={w.method}
                  dispute={{
                    attemptId: question.prior!.feedback.attemptId,
                    transcriptionId: w.transcriptionId,
                    disputed: w.disputed,
                  }}
                  rejected={w.rejected}
                  heading={
                    w.of > 1
                      ? `${w.take === 1 ? 'First' : 'Second'} photograph — what we read`
                      : undefined
                  }
                  earnedLabel="What this earned"
                />
                {!w.marked && <RetryMarkingButton attemptId={question.prior!.feedback.attemptId} />}
              </div>
            ))}

          {/* CODES BELOW THE SENTENCE (ROUND_7 Task 1): after the slip or hint and the rows with reasons, never before them. */}
          {question.rubricCodes.length > 0 && (
            <>
              <p className="mt-2 text-[11px] leading-snug text-dim">{PROFILE_GLOSS}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {question.rubricCodes.map((r) => {
                const state = stateOf.get(r.code) ?? 'unassessed';
                return (
                  <span
                    key={r.code}
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                      state === 'unassessed'
                        ? 'border border-dashed border-rule text-dim'
                        : state === 'awarded'
                          ? chipColor[r.profile]
                          : 'bg-paper-deep text-dim line-through'
                    }`}
                  >
                    ({r.part_label}) {r.code} {state === 'unassessed' ? '— not assessed' : state === 'awarded' ? '✓' : '✗'}
                  </span>
                );
              })}
            </div>
            </>
          )}

          {reviewing ? (
            // No ?q= at all: the session resumes at the first unanswered
            // question, or the summary when there is none. Pointing it at the
            // LAST question linked to the current page whenever that was the
            // one being reviewed, which is where a student ends up.
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

      {question.visualHtml && figureAway && !atSubmit && !figureOpen && (
        // In the gutter, not over the text: the page's 20px and the card's 20px
        // of padding put the first character 40px from the edge, so a 40px
        // button at the edge covers padding only.
        <button
          type="button"
          onClick={() => setFigureOpen(true)}
          aria-label="Show figure"
          className="fixed bottom-3 right-0 z-40 flex h-11 w-10 items-center justify-center border-y-[1.5px] border-l-[1.5px] border-ink bg-paper font-mono text-[10px] uppercase tracking-widest shadow-[-2px_2px_0_var(--ink)]"
        >
          fig
        </button>
      )}

      {figureOpen && question.visualHtml && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[rgba(30,36,48,0.55)] p-3">
          <div className="flex min-h-0 flex-1 flex-col border-[1.5px] border-ink bg-white shadow-[4px_4px_0_var(--ink)]">
            <div className="flex items-center justify-between border-b border-paper-deep px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
                The figure
              </span>
              <button
                type="button"
                onClick={() => setFigureOpen(false)}
                className="min-h-11 px-3 font-mono text-xs uppercase tracking-widest underline"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-2">
              <div
                className="[&_svg]:h-auto [&_svg]:w-full [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-paper-deep [&_td]:p-1 [&_th]:border [&_th]:border-paper-deep [&_th]:bg-paper-deep [&_th]:p-1"
                style={{ minWidth: question.figureMinWidth }}
                dangerouslySetInnerHTML={{ __html: question.visualHtml }}
              />
            </div>
          </div>
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
