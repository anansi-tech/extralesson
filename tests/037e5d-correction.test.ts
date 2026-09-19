import { expect, it } from 'vitest';
import q from './fixtures/question-037e5d.json';
// The question as the reviewed AK4 repair left it, frozen at review time — it
// was computed from the repair's own snapshot before, so this is the same shape
// in a plainer home. The bank has moved on since; what is tested here is the
// MARKER against a known question, not the bank's current content.
import { QuestionDraftZ } from '@/lib/validation/question';
import { markStructuredParts } from '@/lib/grade/mark';
import type { RubricItem } from '@/lib/types';

const part = q.parts.find(p => p.label === 'c')!;
const rubric = q.rubric.filter(r => r.part_label === 'c') as RubricItem[];
const mark = (answer: string) => markStructuredParts(rubric, [part], [{ ref: 'c.i', answer }]);

it('passes the schema, keeps 12 marks, and asks for the exact form on AK4', () => {
  expect(QuestionDraftZ.safeParse(q).success).toBe(true);
  expect(q.marks).toBe(12);
  const ak4 = q.rubric.find(r => r.code === 'AK4')!;
  expect(ak4.for_format).toBe(true);
  expect(ak4.criterion).toContain('exact form');
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
