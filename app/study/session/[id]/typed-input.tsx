'use client';

/**
 * One box per value, with brackets, commas and colons PRINTED rather than
 * typed: the marker compares by position instead of splitting a string, and
 * only fixed-arity shapes show the count — the rest would give the answer.
 */

/**
 * ONE, plus an empty box after whatever has been filled. Opening with three
 * reads as a question asking for three things, so a student who fills two
 * assumes the blank has cost them.
 */
const GROW_FROM = 1;

interface Props {
  shape: string;
  /** Fixed-arity shapes only; absent when showing it would give the answer. */
  boxes?: number;
  /**
   * The elements are ordered PAIRS — a sample space. Printed with their
   * brackets, two at a time; how many pairs is still withheld, a new empty
   * pair appearing when the last one is filled.
   */
  pairs?: boolean;
  cols?: number;
  /** How many characters wide each box starts; it grows past this as typed. */
  chars?: number;
  values: string[];
  onChange: (values: string[]) => void;
  disabled: boolean;
  /** 'a.i' — ids and labels are built from it. */
  slotRef: string;
  describe: string;
  /** Which box the caret is in, so an inserted symbol lands there. */
  onFocusBox: (box: number) => void;
}

/** What box i is called, for the label a screen reader and a marker both need. */
function boxName(shape: string, i: number, cols: number): string {
  if (shape === 'coordinate') return i === 0 ? 'x' : 'y';
  if (shape === 'ratio') return `part ${i + 1}`;
  if (shape === 'column_vector') return `row ${i + 1}`;
  if (shape === 'matrix') return `row ${Math.floor(i / cols) + 1}, column ${(i % cols) + 1}`;
  return `value ${i + 1}`;
}

export function TypedInput({
  shape,
  boxes,
  pairs,
  cols = 1,
  chars = 5,
  values,
  onChange,
  disabled,
  slotRef,
  describe,
  onFocusBox,
}: Props) {
  const fixed = boxes !== undefined;
  const filled = values.filter((v) => v.trim() !== '').length;
  // A pair is only complete when BOTH of its boxes hold something, so a
  // half-typed pair does not open the next one.
  const wholePairs = values.reduce(
    (n, _, i) => (i % 2 === 1 && values[i - 1]?.trim() && values[i]?.trim() ? n + 1 : n),
    0,
  );
  const count = fixed
    ? boxes!
    : pairs
      ? Math.max(2, (wholePairs + 1) * 2, values.length + (values.length % 2))
      : Math.max(GROW_FROM, filled + 1, values.length);

  const set = (i: number, v: string) => {
    const next = [...values];
    while (next.length < count) next.push('');
    next[i] = v;
    onChange(next);
  };

  // The ch unit is the width of a digit in the box's own monospace face, so
  // the sizing is the same on a phone and on a desktop.
  const box = (i: number) => {
    const typed = (values[i] ?? '').length;
    return (
      <input
        key={i}
        id={`slot-${slotRef}-${i}`}
        value={values[i] ?? ''}
        onChange={(e) => set(i, e.target.value)}
        disabled={disabled}
        onFocus={() => onFocusBox(i)}
        aria-label={`${describe} — ${boxName(shape, i, cols)}`}
        style={{ width: `${Math.min(28, Math.max(chars, typed + 1)) + 2}ch` }}
        className="min-h-11 min-w-16 max-w-full border-[1.5px] border-ink p-2 text-center font-mono text-base"
      />
    );
  };

  // Printed punctuation: the student sees the notation and types only values.
  const punct = (text: string) => (
    <span aria-hidden className="font-mono text-lg text-dim">
      {text}
    </span>
  );

  if (shape === 'coordinate') {
    return (
      <div className="mt-1 flex items-center gap-1">
        {punct('(')}
        {box(0)}
        {punct(',')}
        {box(1)}
        {punct(')')}
        <span className="ml-2 font-mono text-[11px] text-dim">(x, y)</span>
      </div>
    );
  }

  if (shape === 'ratio') {
    return (
      <div className="mt-1 flex items-center gap-1">
        {box(0)}
        {punct(':')}
        {box(1)}
      </div>
    );
  }

  if (shape === 'column_vector' || shape === 'matrix') {
    const rows = Math.ceil(count / cols);
    return (
      <div className="mt-1 flex items-stretch gap-1">
        <span aria-hidden className="w-2 border-y-[1.5px] border-l-[1.5px] border-ink" />
        <div className="flex flex-col gap-1">
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="flex gap-1">
              {Array.from({ length: cols }, (_, c) => box(r * cols + c))}
            </div>
          ))}
        </div>
        <span aria-hidden className="w-2 border-y-[1.5px] border-r-[1.5px] border-ink" />
      </div>
    );
  }

  if (pairs) {
    const open = shape === 'set' ? '{' : '';
    const close = shape === 'set' ? '}' : '';
    return (
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {open && punct(open)}
        {Array.from({ length: Math.ceil(count / 2) }, (_, g) => (
          <span key={g} className="flex items-center gap-1">
            {g > 0 && punct(',')}
            {punct('(')}
            {box(g * 2)}
            {punct(',')}
            {box(g * 2 + 1)}
            {punct(')')}
          </span>
        ))}
        {close && punct(close)}
      </div>
    );
  }

  // list, set, roots — the count is not shown, so the list grows itself: one
  // empty box after whatever has been filled. No manual "add a box" control:
  // it sat under the row and took thumbs aimed at the last box.
  const open = shape === 'set' ? '{' : '';
  const close = shape === 'set' ? '}' : '';
  const between = shape === 'roots' ? 'or' : ',';
  return (
    <div className="mt-1">
      <div className="flex flex-wrap items-center gap-1">
        {open && punct(open)}
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && punct(between)}
            {box(i)}
          </span>
        ))}
        {close && punct(close)}
      </div>
      {shape === 'set' && (
        <p className="mt-1 font-mono text-[11px] text-dim">Order does not matter.</p>
      )}
    </div>
  );
}
