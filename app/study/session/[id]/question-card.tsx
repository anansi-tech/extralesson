'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitAnswer, type Feedback } from './actions';

export interface CardQuestion {
  sessionId: string;
  index: number;
  total: number;
  kind: 'mcq' | 'structured';
  stemHtml: string;
  optionsHtml?: string[];
  marks: number;
  rubricCodes: { code: string; profile: string; mark_value: number }[];
}

const chipColor: Record<string, string> = {
  CK: 'bg-[#E8F0E9] text-green-pen',
  AK: 'bg-[#EDF1F8] text-[#3A5A8C]',
  R: 'bg-[#FDF1F0] text-red-pen',
};

export default function QuestionCard({ question }: { question: CardQuestion }) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [working, setWorking] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const startedAt = useRef(Date.now());

  useEffect(() => {
    setSelected(null);
    setAnswer('');
    setWorking('');
    setFeedback(null);
    setError(undefined);
    startedAt.current = Date.now();
  }, [question.sessionId, question.index]);

  const submit = () => {
    const value = question.kind === 'mcq' ? String(selected) : answer.trim();
    if (question.kind === 'mcq' ? selected === null : value === '') return;
    startTransition(async () => {
      const res = await submitAnswer({
        sessionId: question.sessionId,
        questionIndex: question.index,
        answer: value,
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
      <div className="flex items-baseline justify-between">
        <div className="text-lg" dangerouslySetInnerHTML={{ __html: question.stemHtml }} />
        <span className="ml-3 shrink-0 font-mono text-xs text-dim">
          [{question.marks} mark{question.marks === 1 ? '' : 's'}]
        </span>
      </div>

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
        <div className="mt-4 space-y-3">
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
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
              Final answer
            </span>
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={!!feedback}
              className="mt-1 w-full border-[1.5px] border-ink p-3 font-mono text-sm"
              placeholder="e.g. x = -1/3 or x = 2"
            />
          </label>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-pen">{error}</p>}

      {!feedback ? (
        <button
          onClick={submit}
          disabled={pending || (question.kind === 'mcq' ? selected === null : answer.trim() === '')}
          className="mt-5 w-full bg-red-pen p-3 font-black text-white shadow-[3px_3px_0_var(--ink)] disabled:opacity-50"
        >
          {pending ? 'Marking…' : 'Submit answer'}
        </button>
      ) : (
        <div className="mt-5">
          <div
            className={`flex items-baseline justify-between border-l-3 p-3 ${
              feedback.correct
                ? 'border-green-pen bg-[#E8F0E9]'
                : 'border-red-pen bg-[#FDF1F0]'
            }`}
          >
            <b className={feedback.correct ? 'text-green-pen' : 'text-red-pen'}>
              {feedback.correct ? 'Correct ✓' : feedback.isMisconception ? feedback.feedbackTitle : 'Not quite ✗'}
            </b>
            <span className="font-mono text-xs">
              {earned}/{question.marks}
            </span>
          </div>

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
                    {r.code} {got ? '✓' : '✗'}
                  </span>
                );
              })}
            </div>
          )}

          <div className="mt-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
              {feedback.correct ? 'Worked solution' : feedback.isMisconception ? 'What went wrong' : 'Worked solution'}
            </div>
            <div
              className="mt-1 text-sm"
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
