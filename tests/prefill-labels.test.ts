import { describe, expect, it } from 'vitest';
import { boxes, parseLabels, resolve, verdictFor, wanted } from '@/scripts/eval-prefill-holdout';

// THE HOLDOUT LABELS ARE PROSE, and prose parsed by a regex is prose read
// wrong. Two readings of design/research/prefill-holdout-labels.md were wrong
// before this test existed: "(3x/(4pi))^(1/3)" lost its exponent to a rule for
// stripping commentary in brackets, and every bare "(paper)" label was stripped
// to nothing and silently dropped from the count. Both are below.
const PARTS = [
  { label: 'a', slots: [{ label: 'x' }, { label: 'y' }] },
  { label: 'b', slots: [{ label: 'i', answer: '\\begin{pmatrix}9\\\\2\\end{pmatrix}' }] },
  { label: 'c', slots: [{ label: 'i', answer: '(3x/(4pi))^(1/3)' }] },
  { label: 'd', slots: [{ label: 'number' }, { label: 'reason' }] },
  { label: 'e', slots: [{ label: 'i', answer: '{1, 2, 3, 6}' }] },
];

describe('reading the hand labels', () => {
  it('takes the question, the slot and the value, and skips the heading', () => {
    expect(parseLabels('# holdout labels · 14 Sep 2026\n\n037c66 · d.i · 23\n')).toEqual([
      { short: '037c66', slot: 'd.i', value: '23' },
    ]);
  });

  it('names a slot by the bank, not by the label: exact, else the nth of the part', () => {
    expect(resolve(PARTS, 'b')).toBe('b.i');           // one slot, unnamed in the label
    expect(resolve(PARTS, 'a.i')).toBe('a.x');         // the part's slots are x and y
    expect(resolve(PARTS, 'a.ii')).toBe('a.y');
    expect(resolve(PARTS, 'd.ii')).toBe('d.reason');
    expect(resolve(PARTS, 'b.ii')).toBeNull();         // no second slot to name
    expect(resolve(PARTS, 'z')).toBeNull();
  });

  it('strips commentary in brackets and keeps mathematics in brackets', () => {
    expect(boxes('4 ; -2 (column vector, two boxes)', PARTS).groups[0].values).toEqual(['4', '-2']);
    expect(boxes('(3x/(4pi))^(1/3)', PARTS).groups[0].values).toEqual(['(3x/(4pi))^(1/3)']);
    expect(boxes('cbrt(3V/(4pi))', PARTS).groups[0].values).toEqual(['cbrt(3V/(4pi))']);
  });

  it('reads a slot answered on paper, with or without a note after it', () => {
    expect(boxes('(paper)', PARTS).paper).toBe(true);
    expect(boxes('(paper) (a reason — marked from the photo)', PARTS).paper).toBe(true);
    expect(boxes('23', PARTS).paper).toBe(false);
  });

  it('tells two slots on one line from two boxes of one slot', () => {
    // a has slots x and y, so "a.i … ; a.ii …" is two slots.
    const two = boxes('2 ; a.ii · 2 (x and y, two boxes)', PARTS);
    expect(two.groups.map((g) => [g.ref, g.values])).toEqual([[null, ['2']], ['a.y', ['2']]]);
    // b has one slot, so "b.ii" names nothing and its value is b.i's second box.
    const one = boxes('9 ; b.ii · 2 (OQ, column vector)', PARTS);
    expect(one.groups.map((g) => [g.ref, g.values])).toEqual([[null, ['9', '2']]]);
  });

  it('splits a one-box label for a many-box slot, and never re-splits one already said', () => {
    expect(wanted({ short: 'x', ref: 'e.i', want: ['{1, 2, 3, 6}'] }, PARTS)).toEqual(['1', '2', '3', '6']);
    expect(wanted({ short: 'x', ref: 'b.i', want: ['9', '2'] }, PARTS)).toEqual(['9', '2']);
    expect(wanted({ short: 'x', ref: 'c.i', want: ['(3x/(4pi))^(1/3)'] }, PARTS)).toEqual(['(3x/(4pi))^(1/3)']);
    expect(wanted({ short: 'x', ref: 'e.i', want: null }, PARTS)).toBeNull();
  });

  it('separates a different value from the same value spelt differently', () => {
    expect(verdictFor(['47.5'], ['47.5'])).toBe('match');
    expect(verdictFor(['26.6°'], ['26.6 degrees'])).toBe('rewritten');
    expect(verdictFor(['47.5'], ['45'])).toBe('wrong');
    expect(verdictFor(['47.5'], [])).toBe('missing');
    expect(verdictFor(['9', '2'], ['9'])).toBe('wrong');
    // A slot answered on paper: the right answer is no box offered at all.
    expect(verdictFor(null, [])).toBe('match');
    expect(verdictFor(null, ['47.5'])).toBe('wrong');
  });
});
