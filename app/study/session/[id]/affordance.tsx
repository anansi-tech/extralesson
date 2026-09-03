'use client';

/**
 * The two things a student cannot learn from an empty box: which characters are
 * allowed, and how to type the ones their keyboard hides. Both sit under the
 * input they belong to, so only the case in front of them is described.
 */

export function HintLines({ hints }: { hints: string[] }) {
  if (hints.length === 0) return null;
  return (
    <ul className="mt-1 space-y-0.5">
      {hints.map((h) => (
        <li key={h} className="font-mono text-[11px] leading-snug text-dim">
          {h}
        </li>
      ))}
    </ul>
  );
}

/**
 * Characters a phone keyboard does not carry, inserted at the cursor.
 * onMouseDown is prevented so the button never takes focus: the caret must
 * still be in the box, or every symbol lands at the end of what was typed.
 */
export function SymbolStrip({
  symbols,
  onInsert,
  disabled,
}: {
  symbols: string[];
  onInsert: (ch: string) => void;
  disabled: boolean;
}) {
  if (symbols.length === 0 || disabled) return null;
  return (
    // Labelled, and in the ink the inputs are drawn in: in the faint rule colour
    // with no label it read as decoration, and a student finished two geometry
    // sessions without noticing the degree sign was a button. mt-3, not tight to
    // the inputs — at 6px a thumb aimed at the last input hit the degree sign;
    // TAP_GAP_MIN in scripts/audit-mobile.ts is the floor this clears.
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-dim">Insert</span>
      {symbols.map((ch) => (
        <button
          key={ch}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onInsert(ch)}
          aria-label={`Insert ${ch}`}
          className="min-h-11 min-w-11 border-[1.5px] border-ink bg-white px-2.5 font-mono text-base leading-none text-ink shadow-[2px_2px_0_var(--ink)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        >
          {ch}
        </button>
      ))}
    </div>
  );
}
