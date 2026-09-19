import { describe, expect, it } from 'vitest';
import { markStructuredParts, markableSlots } from '@/lib/grade/mark';
import { structuredPrefill } from '@/lib/grade/prefill';
import type { RubricItem } from '@/lib/types';

const part = {
  label: 'c', prompt: 'Complete the statement.', marks: 4,
  statement: 'The modal number was sold on {} days. This is {} than one-third, so the supplier {} make the arrangement.',
  slots: [
    { label: 'days', answer: '7', response_mode: 'explain', rubric_codes: ['R1', 'R2'] },
    { label: 'comparison', answer: 'more', accept: ['greater'], response_mode: 'explain', rubric_codes: ['R3'] },
    { label: 'decision', answer: 'should', response_mode: 'explain', rubric_codes: ['R4'] },
  ],
};
const parts = [{ ...part, slots: part.slots.map((s) => ({ ...s, response_mode: 'answer' })) }];
const rubric: RubricItem[] = [
  ['R1', 'c.days', 'Uses their modal value to select the relevant frequency'],
  ['R2', 'c.days', 'States that their modal value occurred on 7 of the 20 days'],
  ['R3', 'c.comparison', 'Compares 7/20 with 1/3 correctly'],
  ['R4', 'c.decision', 'Concludes the supplier should make the arrangement'],
].map(([code, slot_ref, criterion]) => ({ code, slot_ref, criterion, profile: 'R', mark_value: 1, part_label: 'c' }));

describe('reviewed d0dccb correction', () => {
  it('prefills the readable blanks and lets the student supply the missed conclusion', () => {
    const fill = structuredPrefill(parts, { legible: true, lines: [{ text: '7 of the 20 days, more than one-third' }], answers: [
      { slot_ref: 'c.days', entries: ['7'], source_lines: [1] },
      { slot_ref: 'c.comparison', entries: ['more'], source_lines: [1] },
    ] });
    expect(fill.answers).toEqual({ 'c.days': '7', 'c.comparison': 'more' });
    expect(markableSlots(parts)).toEqual(['c.days', 'c.comparison', 'c.decision']);
    const confirmed = { ...fill.answers, 'c.decision': 'should' };
    const result = markStructuredParts(rubric, parts, Object.entries(confirmed).map(([ref, answer]) => ({ ref, answer })));
    expect(result.rubric_awarded).toEqual(['R1', 'R2', 'R3', 'R4']);
    expect(result.profile_marks.R).toBe(4);
    expect(result.slot_results.every((r) => r.correct)).toBe(true);
  });
  it('does not award the conclusion mark when that blank is empty or wrong', () => {
    for (const answer of ['', 'should not']) {
      const result = markStructuredParts(rubric, parts, [
        { ref: 'c.days', answer: '7' }, { ref: 'c.comparison', answer: 'more' }, { ref: 'c.decision', answer },
      ]);
      expect(result.profile_marks.R).toBe(3);
      expect(result.slot_results.find((r) => r.ref === 'c.decision')?.correct).toBe(false);
    }
  });
  it('accepts declared alternatives and harmless casing, but not the opposite comparison', () => {
    for (const [answer, correct] of [[' GREATER. ', true], ['not more', false]] as const) {
      const result = markStructuredParts(rubric, parts, [{ ref: 'c.comparison', answer }]);
      expect(result.slot_results.find((r) => r.ref === 'c.comparison')?.correct).toBe(correct);
    }
  });
});
