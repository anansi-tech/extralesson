import { describe, expect, it } from 'vitest';
import { structuredPrefill } from '@/lib/grade/prefill';
import { markStructuredParts } from '@/lib/grade/mark';
import { fillEmpty } from '@/lib/grade/fill-empty';
import type { RubricItem } from '@/lib/types';

const parts = [{ label: 'd', slots: [{ label: 'i', response_mode: 'answer', answer_format: 'exact',
  answer: '\\begin{pmatrix}\\frac{2}{\\sqrt{29}}\\\\\\frac{5}{\\sqrt{29}}\\end{pmatrix}' }] }];
const rubric: RubricItem[] = [
  { code: 'AK1', profile: 'AK', criterion: 'unit vector', mark_value: 1, slot_ref: 'd.i', part_label: 'd' },
  { code: 'R1', profile: 'R', criterion: 'exact form', mark_value: 1, slot_ref: 'd.i', part_label: 'd', for_format: true },
];
const read = (entries: string[]) => ({ legible: true, lines: [{ text: 'unit vector = 1/sqrt29 (2, 5)' }],
  answers: [{ slot_ref: 'd.i', entries, source_lines: [1] }] });

describe('reader radical syntax reaches the typed checker intact', () => {
  it('replays the saved d0dd9b suggestion through prefill and exact-form marking', () => {
    const saved = read(['2/sqrt29', '5/sqrt29']);
    const before = structuredClone(saved);
    const fill = structuredPrefill(parts, saved);
    expect(fill.values['d.i']).toEqual(['2/sqrt(29)', '5/sqrt(29)']);
    const marked = markStructuredParts(rubric, parts, [{ ref: 'd.i', answer: '[2/sqrt(29),5/sqrt(29)]', values: fill.values['d.i'] }]);
    expect(marked.slot_results).toEqual([{ ref: 'd.i', correct: true, form_withheld: false }]);
    expect(marked.rubric_awarded).toEqual(['AK1', 'R1']);
    expect(saved).toEqual(before);
  });
  it('does not correct a wrong mathematical value', () => {
    const fill = structuredPrefill(parts, read(['3/sqrt29', '5/sqrt29']));
    expect(fill.values['d.i'][0]).toBe('3/sqrt(29)');
    expect(markStructuredParts(rubric, parts, [{ ref: 'd.i', answer: '', values: fill.values['d.i'] }]).correct).toBe(false);
  });
  it.each([
    ['sqrt7', 'sqrt(7)'], ['2/sqrt 17', '2/sqrt(17)'],
    ['sqrt2.5', 'sqrt(2.5)'], ['2/sqrt(29)', '2/sqrt(29)'],
    ['sqrtx', 'sqrtx'], ['sqrt29x', 'sqrt29x'], ['sqrt29^2', 'sqrt29^2'],
    ['mysqrt29', 'mysqrt29'], ['\\sqrt{29}', '\\sqrt{29}'],
  ])('normalises only an unambiguous numeric argument: %s', (entry, expected) => {
    expect(structuredPrefill(parts, read([entry, '1'])).values['d.i'][0]).toBe(expected);
  });
  it('applies to matrix components too, without changing their order', () => {
    const matrix = [{ label: 'd', slots: [{ label: 'i', answer: '\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}' }] }];
    expect(structuredPrefill(matrix, read(['sqrt7', '2', '3', 'sqrt11'])).values['d.i']).toEqual(['sqrt(7)', '2', '3', 'sqrt(11)']);
  });
  it('leaves word entries and existing typed fields untouched', () => {
    const word = [{ label: 'd', slots: [{ label: 'i', answer: 'some words' }] }];
    expect(structuredPrefill(word, read(['sqrt29'])).answers['d.i']).toBe('sqrt29');
    expect(fillEmpty({ answers: {}, values: { 'd.i': ['2/sqrt29', ''] } }, structuredPrefill(parts, read(['2/sqrt29', '5/sqrt29'])))).toEqual({ answers: {}, values: {} });
  });
});
