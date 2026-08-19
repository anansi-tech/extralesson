'use client';

import { Fragment, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitAnswer, type Feedback } from './actions';

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
    slots: { ref: string; label: string; promptHtml?: string; mode: string }[];
  }[];
  optionsHtml?: string[];
  marks: number;
  rubricCodes: { code: string; profile: string; mark_value: number; part_label: string }[];
}

const chipColor: Record<string, string> = {
  CK: 'bg-[#E8F0E9] text-green-pen',
  AK: 'bg-[#EDF1F8] text-[#3A5A8C]',
  R: 'bg-[#FDF1F0] text-red-pen',
};

export default function QuestionCard({ question }: { question: CardQuestion }) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [partAnswers, setPartAnswers] = useState<Record<string, string>>({});
  const [working, setWorking] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const startedAt = useRef(Date.now());

  useEffect(() => {
    setSelected(null);
    setPartAnswers({});
    setWorking('');
    setFeedback(null);
    setError(undefined);
    startedAt.current = Date.now();
  }, [question.sessionId, question.index]);

  // R1.8: the student answers SLOTS. "Show that" and "explain" slots are worked
  // on paper and self-marked, so they are not typed in and never gate submit —
  // and a part may hold both kinds at once.
  const markedSlots = question.parts.flatMap((p) => p.slots.filter((s) => s.mode === 'answer'));
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
      : markedSlots.some((s) => (partAnswers[s.ref] ?? '').trim() !== '');
  const blanks = markedSlots.filter((s) => (partAnswers[s.ref] ?? '').trim() === '').length;

  const submit = () => {
    if (!canSubmit) return;
    const answers =
      question.kind === 'mcq'
        ? [{ label: 'a', answer: String(selected) }]
        : markedSlots.map((s) => ({ label: s.ref, answer: (partAnswers[s.ref] ?? '').trim() }));
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
                            aria-label={`Answer ${i + 1} in the statement for part (${p.label})`}
                            className="w-24 border-0 border-b-[1.5px] border-ink bg-transparent px-1 py-0.5 text-center font-mono text-sm"
                          />
                        )}
                      </Fragment>
                    ))}
                  </div>
                )}

                {/* One row per slot: the paper's (i), (ii), a table cell, or a
                    single unlabelled answer when the part asks for one thing. */}
                {!p.statementHtml && p.slots.map((slot) => {
                  const partFeedback = feedback?.partResults.find((r) => r.label === slot.ref);
                  return (
                    <div key={slot.ref} className={p.slots.length > 1 ? 'mt-1 pl-4' : ''}>
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
                      {slot.mode === 'answer' ? (
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            value={partAnswers[slot.ref] ?? ''}
                            onChange={(e) =>
                              setPartAnswers((prev) => ({ ...prev, [slot.ref]: e.target.value }))
                            }
                            disabled={!!feedback}
                            className="w-full border-[1.5px] border-ink p-2 font-mono text-sm"
                            placeholder={
                              p.slots.length > 1
                                ? `Answer to (${p.label})(${slot.label})`
                                : `Answer to (${p.label})`
                            }
                          />
                          {partFeedback && (
                            <span
                              className={`font-hand text-xl ${partFeedback.correct ? 'text-green-pen' : 'text-red-pen'}`}
                            >
                              {partFeedback.correct ? '✓' : '✗'}
                            </span>
                          )}
                        </div>
                      ) : slot.mode === 'construct' ? (
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
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-pen">{error}</p>}

      {!feedback ? (
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
            <span className="font-mono text-xs">
              {earned}/{question.marks}
            </span>
          </div>

          {feedback.formatFeedback && (
            <p className="mt-2 border-l-3 border-[#D9A62E] bg-[#FDF8EC] p-2 text-sm">
              {feedback.formatFeedback}
            </p>
          )}

          {question.rubricCodes.length > 0 && (
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
          )}

          {feedback.construction && (
            <div className="mt-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
                Your graph should look like this
              </div>
              <div
                className="mt-1 border border-paper-deep bg-white p-2 [&_svg]:h-auto [&_svg]:w-full"
                dangerouslySetInnerHTML={{ __html: feedback.construction.figureHtml }}
              />
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

          <button
            onClick={() => startTransition(() => router.refresh())}
            disabled={pending}
            className="mt-4 w-full bg-ink p-3 font-black text-paper shadow-[3px_3px_0_var(--red)] disabled:opacity-60"
          >
            {question.index + 1 >= question.total ? 'Finish session' : 'Next question →'}
          </button>
        </div>
      )}
    </article>
  );
}
