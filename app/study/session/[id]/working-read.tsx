/**
 * WHAT WE READ, AND WHAT IT EARNED.
 *
 * One renderer for two moments: straight after a photograph is taken, and again
 * whenever the student looks back at that question. It was written inline in
 * WorkingPhoto, which is a client component holding capture state, so looking
 * back at a finished question showed neither the transcription nor the marks
 * the working earned — the marks a student most wants to reread.
 *
 * Presentation only. It takes what is stored and shows it; it captures nothing,
 * marks nothing, and has no state of its own.
 */
export interface ReadLine {
  text: string;
  part_label?: string | null;
  confidence: number;
}

export interface MethodRow {
  code: string;
  awarded: boolean;
  reason: string;
}

export function WorkingRead({
  lines,
  legible,
  notes,
  method,
  heading,
  earnedLabel,
  footer,
}: {
  lines: ReadLine[];
  legible: boolean;
  notes?: string;
  method: MethodRow[];
  /** Names the take when there is more than one to tell apart. */
  heading?: string;
  earnedLabel: string;
  footer?: string;
}) {
  // Grouped by the part each line belongs to, with an unlabelled line
  // inheriting the part above it — the same rule the marker applies, so what a
  // student is shown is what was marked.
  const byPart: { part: string; lines: ReadLine[] }[] = [];
  let current: string | null = null;
  for (const line of lines) {
    if (line.part_label) current = line.part_label;
    const key = current ?? '—';
    const last = byPart[byPart.length - 1];
    if (last && last.part === key) last.lines.push(line);
    else byPart.push({ part: key, lines: [line] });
  }

  return (
    <div className="mt-3">
      <div className="section-label">
        {heading ?? 'This is what we read'}
      </div>
      {!legible && (
        <p className="mt-1 text-[12px] leading-snug text-dim">
          We could not read this photograph. Nothing has changed.
        </p>
      )}
      {byPart.map((group, gi) => (
        <div key={`${group.part}-${gi}`} className="mt-2">
          <div className="font-mono text-[11px] text-dim">
            {group.part === '—' ? 'Not matched to a part' : `(${group.part})`}
          </div>
          <ul className="mt-0.5 border-l-3 border-paper-deep pl-3">
            {group.lines.map((line, i) => (
              <li key={i} className="font-mono text-[13px] leading-snug">
                {line.text}
                {line.confidence < 0.6 && (
                  <span className="ml-2 font-mono text-[10px] text-dim">hard to read</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {notes && <p className="mt-2 text-[12px] leading-snug text-dim">{notes}</p>}

      {/* R2 §5. The marks the working earned, and — the part that makes this
          worth photographing — WHY a row did not earn. "We could not see where
          you divided by the scale factor" is something a student can go and
          check against their page; a struck-through code is not. The marker is
          more cautious than an examiner, so the reasons are how a student can
          tell a real miss from one we could not see. */}
      {method.length > 0 && (
        <div className="mt-3 border-t border-dashed border-paper-deep pt-2">
          <div className="section-label">
            {earnedLabel}
          </div>
          <ul className="mt-1 space-y-1">
            {method.map((m) => (
              <li key={m.code} className="flex gap-2 text-[13px] leading-snug">
                <span
                  className={`font-hand text-lg leading-none ${m.awarded ? 'text-green-pen' : 'text-dim'}`}
                >
                  {m.awarded ? '✓' : '–'}
                </span>
                <span className="min-w-0">
                  <span className="font-mono text-[11px] text-dim">{m.code}</span> {m.reason}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] leading-snug text-dim">
            These are added to what you had already earned. Nothing here can take a mark away.
          </p>
        </div>
      )}
      {footer && <p className="mt-2 text-[12px] leading-snug text-dim">{footer}</p>}
    </div>
  );
}
