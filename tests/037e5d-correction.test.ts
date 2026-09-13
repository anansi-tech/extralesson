import { expect, it } from 'vitest';
import { original, correctedQuestion, prepare } from '@/scripts/done/repair-037e5d';
import { QuestionDraftZ } from '@/lib/validation/question';
import { markStructuredParts } from '@/lib/grade/mark';
import type { RubricItem } from '@/lib/types';

const q = correctedQuestion();
const part = q.parts.find(p => p.label === 'c')!;
const rubric = q.rubric.filter(r => r.part_label === 'c') as RubricItem[];
const mark = (answer: string) => markStructuredParts(rubric, [part], [{ ref: 'c.i', answer }]);

it('passes the schema and changes only the approved AK4 criterion, template and form flag', () => {
  expect(QuestionDraftZ.safeParse(q).success).toBe(true);
  expect(q.marks).toBe(12);
  expect(q.rubric.map(r => [r.code, r.mark_value, r.profile, r.slot_ref])).toEqual(original.rubric.map(r => [r.code, r.mark_value, r.profile, r.slot_ref]));
  const reverted = structuredClone(q);
  reverted.rubric = reverted.rubric.map(r => r.code === 'AK4' ? original.rubric.find(r => r.code === 'AK4')! : r);
  expect(reverted).toEqual(original);
});
it('gives all four marks for both accepted exact expressions', () => {
  const slot = part.slots[0];
  const accepted = 'accept' in slot ? slot.accept ?? [] : [];
  for (const answer of [slot.answer, ...accepted, '10*(sqrt(3)+1)', '20/(sqrt(3)-1)']) {
    const result = mark(answer);
    expect(result.correct, answer).toBe(true);
    expect(result.rubric_awarded).toEqual(['R1', 'R2', 'AK3', 'AK4']);
  }
});
it('withholds only the exact-form mark for an equivalent decimal value', () => {
  const result = mark('27.32050807568877');
  expect(result.rubric_awarded).toEqual(['R1', 'R2', 'AK3']);
  expect(result.slot_results[0]).toMatchObject({ correct: true, form_withheld: true });
});
it('does not award marks for blank or wrong exact values', () => {
  for (const answer of ['', '10*(sqrt(3)-1)', '20/(sqrt(3)+1)']) expect(mark(answer).rubric_awarded).toEqual([]);
});
it('is repeatable despite metadata timestamps but rejects changed content', () => {
  expect(prepare(original).changed).toBe(true);
  expect(prepare({ ...q, updated_at: new Date() }).changed).toBe(false);
  expect(() => prepare({ ...q, stem: 'Changed' })).toThrow('changed since review');
});
