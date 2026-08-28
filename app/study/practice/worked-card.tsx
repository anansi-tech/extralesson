'use client';

import { useState } from 'react';
import { PROFILE_GLOSS } from '@/lib/study/profiles';

export interface WorkedQuestion {
  id: string;
  module: number;
  marks: number;
  stimulusHtml?: string;
  stimulusTableHtml?: string;
  stemHtml: string;
  visualHtml?: string;
  parts: { label: string; promptHtml: string; marks: number; mode: string }[];
  workedSolutionHtml: string;
  rubric: { code: string; profile: string; mark_value: number; part_label: string; criterionHtml: string }[];
}

const modeLabel: Record<string, string> = {
  show_that: 'SHOW THAT',
  explain: 'EXPLAIN',
};

export default function WorkedCard({ question }: { question: WorkedQuestion }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <article className="mt-4 border-[1.5px] border-ink bg-white p-5 shadow-[4px_4px_0_var(--ink)]">
      {question.stimulusHtml && (
        <div
          className="question-prose mb-3 border-l-3 border-paper-deep pl-3 text-[15px]"
          dangerouslySetInnerHTML={{ __html: question.stimulusHtml }}
        />
      )}

      {question.stimulusTableHtml && (
        <div className="figure-frame mt-3">
          <div
            className="figure-inner [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-paper-deep [&_td]:p-1 [&_th]:border [&_th]:border-paper-deep [&_th]:bg-paper-deep [&_th]:p-1"
            dangerouslySetInnerHTML={{ __html: question.stimulusTableHtml }}
          />
        </div>
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

      <ol className="mt-4 space-y-3">
        {question.parts.map((p) => (
          <li key={p.label} className="flex gap-2">
            <span className="font-mono text-sm text-dim">({p.label})</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <div
                  className="question-prose text-[15px]"
                  dangerouslySetInnerHTML={{ __html: p.promptHtml }}
                />
                <span className="shrink-0 font-mono text-xs text-dim">[{p.marks}]</span>
              </div>
              {modeLabel[p.mode] && (
                <span className="mt-1 inline-block bg-paper-deep px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-dim">
                  {modeLabel[p.mode]}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="mt-5 w-full border-[1.5px] border-ink bg-paper p-3 font-mono text-[11px] uppercase tracking-widest shadow-[3px_3px_0_var(--ink)]"
        >
          Work it on paper first — then reveal the mark scheme
        </button>
      ) : (
        <div className="mt-5 border-t-[1.5px] border-dashed border-paper-deep pt-4">
          <div className="section-label">
            Worked solution
          </div>
          <div
            className="question-prose mt-2 text-[15px]"
            dangerouslySetInnerHTML={{ __html: question.workedSolutionHtml }}
          />

          {question.rubric.length > 0 && (
            <>
              <div className="mt-4 section-label">
                Mark scheme — self-mark honestly
              </div>
              <p className="mt-1 text-[11px] leading-snug text-dim">{PROFILE_GLOSS}</p>
              <ul className="mt-2 space-y-1.5">
                {question.rubric.map((r) => (
                  <li key={r.code} className="flex gap-2 text-sm">
                    <span className="shrink-0 font-mono text-[10px] text-dim">
                      ({r.part_label}) {r.profile} {r.mark_value}
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: r.criterionHtml }} />
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-4 font-mono text-[10px] text-dim">
            Nothing here is recorded — self-marked work does not move your estimate.
          </p>
        </div>
      )}
    </article>
  );
}
