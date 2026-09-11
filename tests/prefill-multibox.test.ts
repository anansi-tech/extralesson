import { describe, expect, it } from 'vitest';
import { prefillFromRead } from '@/lib/grade/prefill';
import { readInputShape } from '@/lib/grade/input-shape';

/**
 * A multi-box slot used to be left alone: splitting a read line into boxes
 * would have meant guessing the delimiter. It does not — the marker already
 * splits the slot's own answer with readInputShape, and the same reader over
 * the read gives the same values in the same order.
 *
 * The count is the check, and it is exact. The student still checks every box
 * before handing in; this only saves the typing.
 */
const slot = (label: string, answer: string, response_mode = 'answer') => ({ label, answer, response_mode });
const part = (label: string, ...slots: ReturnType<typeof slot>[]) => ({ label, slots });
const read = (slot_ref: string, text: string) => ({ slot_ref, text });

describe('a multi-box slot fills when the read splits into its boxes', () => {
  it('a column vector', () => {
    // Two boxes, and the read gives two values.
    expect(readInputShape('\\begin{pmatrix} 3 \\\\ -2 \\end{pmatrix}').boxes).toBe(2);

    const filled = prefillFromRead(
      [part('a', slot('i', '\\begin{pmatrix} 3 \\\\ -2 \\end{pmatrix}'))],
      [read('a.i', '\\begin{pmatrix} 5 \\\\ 1 \\end{pmatrix}')],
    );

    expect(filled.values).toEqual({ 'a.i': ['5', '1'] });
    expect(filled.answers, 'nothing goes in the single-box map').toEqual({});
  });

  it('a coordinate', () => {
    const filled = prefillFromRead([part('a', slot('i', '(2, 5)'))], [read('a.i', '(4, -3)')]);

    expect(filled.values).toEqual({ 'a.i': ['4', '-3'] });
  });

  it('and the values are in reading order, not sorted', () => {
    const filled = prefillFromRead([part('a', slot('i', '(2, 5)'))], [read('a.i', '(9, 1)')]);

    expect(filled.values['a.i']).toEqual(['9', '1']);
  });
});

describe('a count that does not match fills nothing for that slot', () => {
  it('three values into a two-box slot', () => {
    const filled = prefillFromRead([part('a', slot('i', '(2, 5)'))], [read('a.i', '(1, 2, 3)')]);

    // Not a partial fill and not a guess: a wrong split sitting in the boxes is
    // worse than an empty one, because the student checks values, not their
    // number.
    expect(filled.values).toEqual({});
    expect(filled.answers).toEqual({});
  });

  it('one value into a two-box slot', () => {
    expect(prefillFromRead([part('a', slot('i', '(2, 5)'))], [read('a.i', '7')]).values).toEqual({});
  });

  it('and it costs the other slots nothing', () => {
    const filled = prefillFromRead(
      [part('a', slot('i', '(2, 5)')), part('b', slot('i', '12'))],
      [read('a.i', '(1, 2, 3)'), read('b.i', '12')],
    );

    expect(filled.values).toEqual({});
    expect(filled.answers, 'the slot that could fill still did').toEqual({ 'b.i': '12' });
  });
});

describe('single-box behaviour is unchanged', () => {
  it('fills the box, as it always did', () => {
    const filled = prefillFromRead([part('a', slot('i', '5'))], [read('a.i', ' 11.9 ')]);

    expect(filled.answers).toEqual({ 'a.i': '11.9' });
    expect(filled.values).toEqual({});
  });

  it('fills nothing from an empty read, and nothing for a slot with no read', () => {
    expect(prefillFromRead([part('a', slot('i', '5'))], [read('a.i', '   ')]).answers).toEqual({});
    expect(prefillFromRead([part('a', slot('i', '5'))], []).answers).toEqual({});
  });

  it('never fills a slot the student does not type into', () => {
    const construct = prefillFromRead([part('a', slot('i', 'a straight line', 'construct'))], [read('a.i', 'a line')]);
    expect(construct).toEqual({ answers: {}, values: {} });

    const shown = prefillFromRead([part('a', slot('i', '5', 'show_that'))], [read('a.i', '5')]);
    expect(shown).toEqual({ answers: {}, values: {} });
  });

  it('ignores a read for a slot that is not on the question', () => {
    expect(prefillFromRead([part('a', slot('i', '5'))], [read('z.i', '5')])).toEqual({ answers: {}, values: {} });
  });
});
