import { expect, it } from 'vitest';
import { structuredPrefill } from '@/lib/grade/prefill';
import { readInputShape } from '@/lib/grade/input-shape';

it.each([
  ['\\begin{pmatrix} 3 \\\\ -2 \\end{pmatrix}', ['5', '1']],
  ['(2,5)', ['9', '1']],
  ['2:3', ['7', '4']],
])('fills explicit components for %s without sorting them', (answer, entries) => {
  expect(structuredPrefill([{ label: 'a', slots: [{ label: 'i', answer }] }], {
    legible: true, lines: [{ text: entries.join(', ') }],
    answers: [{ slot_ref: 'a.i', entries, source_lines: [1] }],
  })).toEqual({ answers: {}, values: { 'a.i': entries } });
});

it('a rejected grid does not prevent another field filling', () => {
  expect(structuredPrefill([{ label: 'a', slots: [{ label: 'i', answer: '(2,5)' }, { label: 'ii', answer: '12' }] }], {
    legible: true, lines: [{ text: '1,2,3; 12' }], answers: [
      { slot_ref: 'a.i', entries: ['1', '2', '3'], source_lines: [1] },
      { slot_ref: 'a.ii', entries: ['12'], source_lines: [1] },
    ],
  })).toEqual({ answers: { 'a.ii': '12' }, values: {} });
});

it('recognises labelled canonical coordinates without treating functions as coordinates', () => {
  expect(readInputShape('$O(0,0)$')).toMatchObject({ shape: 'coordinate', boxes: 2, values: ['0', '0'] });
  expect(readInputShape('P(3, -2)').values).toEqual(['3', '-2']);
  expect(readInputShape('f(x)')).toMatchObject({ shape: 'expression', boxes: 1 });
});
