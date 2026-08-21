'use client';

/**
 * The two things a student cannot learn from an empty box: which characters
 * they are allowed to use, and how to type the ones their keyboard hides.
 *
 * Both sit under the input they belong to. A help page would be read by nobody
 * and would have to describe every case at once; this describes only the case
 * in front of them.
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
 *
 * onMouseDown is prevented so the button never takes focus: the caret has to
 * still be in the box when the character arrives, or every symbol would land
 * at the end of whatever was typed.
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
    <div className="mt-1 flex flex-wrap gap-1">
      {symbols.map((ch) => (
        <button
          key={ch}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onInsert(ch)}
          aria-label={`Insert ${ch}`}
          className="min-w-8 border-[1.5px] border-rule px-2 py-1 font-mono text-sm leading-none text-ink active:bg-paper-deep"
        >
          {ch}
        </button>
      ))}
    </div>
  );
}
