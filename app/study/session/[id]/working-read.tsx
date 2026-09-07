/**
 * One renderer for two moments: straight after a photograph is taken, and
 * whenever the student looks back at that question. Presentation only — it
 * captures nothing, marks nothing, and holds no state of its own.
 */
import { useState } from 'react';
import { DisputeButton } from './dispute-button';
import { RejectLineButton } from './reject-line-button';

export interface ReadLine {
  text: string;
  part_label?: string | null;
  confidence: number;
}

export interface MethodRow {
  code: string;
  awarded: boolean;
  /** The marker's reason, typeset: it quotes the criterion, TeX and all. */
  reasonHtml: string;
}

export function WorkingRead({
  lines,
  legible,
  method,
  heading,
  earnedLabel,
  footer,
  dispute,
  rejected,
  reject,
}: {
  lines: ReadLine[];
  legible: boolean;
  method: MethodRow[];
  /** Names the take when there is more than one to tell apart. */
  heading?: string;
  earnedLabel: string;
  footer?: string;
  /** Set once the read is marked against an attempt: a withheld row can be disputed. */
  dispute?: { attemptId: string; transcriptionId: string; disputed: string[] };
  /** Lines the student said were not theirs, by index into `lines`. */
  rejected?: number[];
  /** Set while the read is unmarked: a line can still be taken out of marking. */
  reject?: { transcriptionId: string };
}) {
  const [struck, setStruck] = useState<Set<number>>(() => new Set(rejected ?? []));
  // Grouped by the part each line belongs to, with an unlabelled line
  // inheriting the part above it — the same rule the marker applies, so what a
  // student is shown is what was marked.
  const byPart: { part: string; lines: (ReadLine & { index: number })[] }[] = [];
  let current: string | null = null;
  lines.forEach((line, index) => {
    if (line.part_label) current = line.part_label;
    const key = current ?? '—';
    const last = byPart[byPart.length - 1];
    if (last && last.part === key) last.lines.push({ ...line, index });
    else byPart.push({ part: key, lines: [{ ...line, index }] });
  });

  return (
    <div className="mt-3">
      <div className="section-label pb-0.5 shadow-[0_1.5px_0_var(--margin)]">
        {heading ?? 'This is what we read'}
      </div>
      {!legible && (
        <p className="mt-1 text-[12px] leading-snug text-dim">
          We could not read this photograph. Nothing has changed.
        </p>
      )}
      {byPart.map((group, gi) => (
        <div key={`${group.part}-${gi}`} className="mt-2.5">
          <div className="font-mono text-[11px] text-dim">
            {group.part === '—' ? 'Not matched to a part' : `(${group.part})`}
          </div>
          <ul className="mt-0.5 border-l-3 border-paper-deep pl-3">
            {group.lines.map((line) => (
              <li key={line.index} className="font-mono text-[13px] leading-snug">
                {struck.has(line.index) ? (
                  <>
                    <s className="text-dim">{line.text}</s>
                    <span className="ml-2 font-mono text-[10px] text-dim">you said this wasn&rsquo;t yours</span>
                  </>
                ) : (
                  <>
                    {line.text}
                    {line.confidence < 0.6 && (
                      <span className="ml-2 font-mono text-[10px] text-dim">hard to read</span>
                    )}
                  </>
                )}
                {/* Reversible until submit: the same control puts a line back. */}
                {reject && (
                  <RejectLineButton
                    transcriptionId={reject.transcriptionId}
                    lineIndex={line.index}
                    rejected={struck.has(line.index)}
                    onToggled={(now) =>
                      setStruck((prev) => {
                        const next = new Set(prev);
                        if (now) next.add(line.index);
                        else next.delete(line.index);
                        return next;
                      })
                    }
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {reject && struck.size > 0 && (
        <p className="mt-2 text-[12px] leading-snug text-dim">A struck line is left out of marking. It is reversible until you hand in.</p>
      )}

      {/* WHY a row did not earn is what makes photographing worth it: "we could
          not see where you divided by the scale factor" is something a student
          can check against their page. The marker is cautious (ROUND_2 §5), so
          the reason separates a miss from a misread. */}
      {method.length > 0 && (
        <div className="mt-2.5 border-t border-dashed border-paper-deep pt-2.5">
          <div className="section-label pb-0.5 shadow-[0_1.5px_0_var(--margin)]">
            {earnedLabel}
          </div>
          <MethodRows method={method} dispute={dispute} className="mt-2.5" />
          <p className="mt-2 text-[12px] leading-snug text-dim">
            These are added to what you had already earned. Nothing here can take a mark away.
          </p>
        </div>
      )}
      {footer && <p className="mt-2 text-[12px] leading-snug text-dim">{footer}</p>}
    </div>
  );
}

/**
 * The marker's rows with their reasons, a tick or a dash in the hand font,
 * and the query control under a withheld row. Under the part they belong to
 * on the marked question, and under the read for a part with nothing typed.
 */
export function MethodRows({
  method,
  dispute,
  className,
}: {
  method: MethodRow[];
  dispute?: { attemptId: string; transcriptionId: string; disputed: string[] };
  className?: string;
}) {
  if (method.length === 0) return null;
  return (
    <ul className={`flex flex-col gap-2 ${className ?? ''}`}>
      {method.map((m) => (
        <li key={m.code} className="flex gap-2 text-[13px] leading-snug lg:text-sm">
          <span className={`shrink-0 font-hand text-xl leading-none ${m.awarded ? 'text-green-pen' : 'text-dim'}`}>
            {m.awarded ? '✓' : '–'}
          </span>
          <span className="min-w-0">
            <span dangerouslySetInnerHTML={{ __html: m.reasonHtml }} />
            {dispute && !m.awarded && (
              <DisputeButton
                attemptId={dispute.attemptId}
                transcriptionId={dispute.transcriptionId}
                code={m.code}
                noted={dispute.disputed.includes(m.code)}
              />
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
