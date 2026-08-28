'use client';

/**
 * AN INPUT SHAPED LIKE THE ANSWER.
 *
 * One box per value, with the brackets, commas and colons PRINTED rather than
 * typed. A student on a phone never reaches for a character the keyboard does
 * not carry and never guesses which delimiter the marker will accept — and
 * because each value arrives separately, the marker compares them by position
 * instead of splitting a string back apart.
 *
 * How many boxes is itself part of the answer for some shapes. A coordinate is
 * a pair and a column vector has the rows the question named, so those are laid
 * out fixed. A list is not: rendering "list the factors of 24" as eight boxes
 * would answer the question. Those start at three and grow on demand.
 */

/**
 * How many boxes a growable input opens with.
 *
 * ONE, plus an empty one after whatever has been filled. Opening with three
 * put two spare boxes under a two-value answer and read as a question asking
 * for three things — a student filled two, left the third, and reasonably
 * assumed the blank had cost them. Growing from one says nothing about the
 * length of an answer whose length is the point.
 */
const GROW_FROM = 1;

interface Props {
  shape: string;
  /** Fixed-arity shapes only; absent when showing it would give the answer. */
  boxes?: number;
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
  const count = fixed ? boxes! : Math.max(GROW_FROM, filled + 1, values.length);

  const set = (i: number, v: string) => {
    const next = [...values];
    while (next.length < count) next.push('');
    next[i] = v;
    onChange(next);
  };

  // Sized from the longest answer this slot expects, and growing past it as the
  // student types: a fixed 64px box held about seven characters, which was too
  // narrow for a word in a set and for the values a ratio carries. The ch unit
  // is the width of a digit in the box's own monospace face, so the arithmetic
  // is the same on a phone and on a desktop.
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

  // list, set, roots — the count is not shown, so the list grows itself: one
  // empty box after whatever has been filled, and a new one the moment that
  // gains content. There is no manual "add a box" control. It appended an
  // empty box BEYOND the trailing empty one, which is a box the rule above
  // would never add, and as a 44px tap target under the row it took thumbs
  // aimed at the last box — a student clicked into a box and saw one appear.
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
