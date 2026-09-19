import { describe, expect, it } from 'vitest';
import repairs from './fixtures/reviewed-cloze.json';
// The 31 reviewed questions with their corrected parts already applied, frozen
// at review time. The repair that applied them has run and been deleted; what
// these still hold to account is the marker and the prefill.
import { markStructuredParts } from '@/lib/grade/mark';
import { readInputShape } from '@/lib/grade/input-shape';
import { structuredPrefill } from '@/lib/grade/prefill';
import type { RubricItem } from '@/lib/types';

describe('reviewed short cloze corrections', () => {
  // A floor, so the fixture cannot quietly shrink and leave the sweep passing
  // over less than it says. d0dd1a is absent on purpose: its quartile formats
  // have no matching form-mark rows, so it fails the current schema.
  it('sweeps 31 questions and 35 slots', () => {
    expect(new Set(repairs.map(q => q.id)).size).toBe(31);
    expect(repairs.flatMap(q => q.refs)).toHaveLength(35);
    expect(repairs.some(q => q.id.endsWith('d0dd1a'))).toBe(false);
  });
  for (const repair of repairs) {
    describe(repair.id.slice(-6), () => {
      const parts = repair.parts;
      const rubric = repair.rubric as RubricItem[];
      for (const ref of repair.refs) {
        const [label, slotLabel] = ref.split('.');
        const slot = parts.find(p => p.label === label)!.slots.find(s => s.label === slotLabel)!;
        it(`${ref}: accepts canonical and declared alternatives; rejects empty and wrong`, () => {
          for (const answer of [slot.answer, ...(slot.accept ?? [])]) {
            const marked = markStructuredParts(rubric, parts, [{ ref, answer }]);
            expect(marked.slot_results.find(r => r.ref === ref)?.correct, answer).toBe(true);
            expect(marked.rubric_awarded).toEqual(rubric.filter(r => r.slot_ref === ref).map(r => r.code));
          }
          const wrong = readInputShape(slot.answer).shape === 'word' ? `not ${slot.answer}` : '999999';
          for (const answer of ['', wrong]) {
            const marked = markStructuredParts(rubric, parts, [{ ref, answer }]);
            expect(marked.slot_results.find(r => r.ref === ref)?.correct, answer).toBe(false);
            expect(marked.rubric_awarded).toEqual([]);
          }
        });
        it(`${ref}: has a single fillable field and accepts an evidenced suggestion`, () => {
          const shape = readInputShape(slot.answer);
          expect(['number', 'quantity', 'word']).toContain(shape.shape);
          const fill = structuredPrefill(parts, { legible: true, lines: [{ text: slot.answer }],
            answers: [{ slot_ref: ref, entries: [slot.answer], source_lines: [1] }] });
          expect(fill.answers[ref]).toBe(slot.answer);
        });
      }
    });
  }
  it('accepts will only where declared, never will not', () => {
    const q = repairs.find(q => q.id.endsWith('d0dccb'))!;
    const parts = q.parts;
    for (const [answer, correct] of [['will', true], ['will not', false], ['should not', false]] as const) {
      const result = markStructuredParts(q.rubric as RubricItem[], parts, [{ ref: 'c.decision', answer }]);
      expect(result.slot_results.find(r => r.ref === 'c.decision')?.correct).toBe(correct);
    }
  });
});
