import { expect, it } from 'vitest';
import { correctedQuestion, original, prepare } from '@/scripts/done/repair-d0dd1a';
import { QuestionDraftZ } from '@/lib/validation/question';
import { markStructuredParts } from '@/lib/grade/mark';
import type { RubricItem } from '@/lib/types';

const q = correctedQuestion();
const inputs = q.parts.flatMap(p => p.slots.map(s => ({ ref: `${p.label}.${s.label}`, answer: s.answer })));
function mark(overrides: Record<string, string> = {}) {
  return markStructuredParts(q.rubric as RubricItem[], q.parts, inputs.map(i => ({ ...i, answer: overrides[i.ref] ?? i.answer })));
}
it('passes the full schema and keeps 12 marks and the existing profile allocation', () => {
  expect(QuestionDraftZ.safeParse(q).success).toBe(true);
  expect(q.marks).toBe(12);
  expect(q.rubric.map(r => [r.code, r.mark_value, r.profile, r.slot_ref, r.for_format])).toEqual(original.rubric.map(r => [r.code, r.mark_value, r.profile, r.slot_ref, r.for_format]));
  expect(mark().correct).toBe(true);
  expect(mark().rubric_awarded).toHaveLength(12);
});
it('withholds only the IQR form mark for the right value in the wrong form', () => {
  const result = mark({ 'd.interquartile_range': '9.30' });
  expect(result.rubric_awarded).toHaveLength(11);
  expect(result.rubric_awarded).toContain('AK5');
  expect(result.rubric_awarded).not.toContain('R3');
  expect(result.slot_results.find(r => r.ref === 'd.interquartile_range')).toMatchObject({ correct: true, form_withheld: true });
});
it('does not charge that mark for extra trailing zeroes in the quartiles', () => {
  expect(mark({ 'd.lower_quartile': '18.90', 'd.upper_quartile': '28.30' }).rubric_awarded).toHaveLength(12);
});
it('rejects wrong and missing answers, including an opposite verdict', () => {
  for (const value of ['', '9.4']) {
    const result = mark({ 'd.interquartile_range': value });
    expect(result.rubric_awarded).not.toContain('AK5');
    expect(result.rubric_awarded).not.toContain('R3');
  }
  for (const value of ['', 'true', 'not false']) expect(mark({ 'd.claim': value }).rubric_awarded).not.toContain('R2');
  expect(mark({ 'd.claim': 'incorrect' }).rubric_awarded).toContain('R2');
});
it('is non-mutating, repeatable and refuses changed content', () => {
  const before = structuredClone(original);
  expect(prepare(original).changed).toBe(true);
  expect(original).toEqual(before);
  expect(prepare(q).changed).toBe(false);
  expect(() => prepare({ ...original, stem: 'Changed' })).toThrow('changed since review');
});

it('ignores the database update timestamp but still refuses actual content edits', () => {
  const updated_at = new Date('2026-09-13T19:01:18.918Z');
  expect(prepare({ ...original, updated_at }).changed).toBe(true);
  expect(prepare({ ...q, updated_at }).changed).toBe(false);
  expect(prepare({ ...q, updated_at: updated_at.toISOString() }).changed).toBe(false);
  expect(() => prepare({ ...q, updated_at, stem: 'Changed' })).toThrow('changed since review');
  const edited = structuredClone(q);
  edited.rubric[0].criterion = 'Changed';
  expect(() => prepare({ ...edited, updated_at })).toThrow('changed since review');
});
