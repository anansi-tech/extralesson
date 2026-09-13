import { describe, expect, it } from 'vitest';
import { correctedParts, fingerprint, prepare, repairs, heldQuestion } from '@/scripts/done/repair-reviewed-cloze';
import { markStructuredParts } from '@/lib/grade/mark';
import { readInputShape } from '@/lib/grade/input-shape';
import { structuredPrefill } from '@/lib/grade/prefill';
import type { RubricItem } from '@/lib/types';

describe('reviewed short cloze corrections', () => {
  it('limits the patch to 31 questions and 35 slots, excluding the schema hold', () => {
    expect(new Set(repairs.map(q => q.id)).size).toBe(31);
    expect(repairs.flatMap(q => q.refs)).toHaveLength(35);
    expect(repairs.some(q => q.id === heldQuestion)).toBe(false);
  });
  for (const repair of repairs) {
    describe(repair.id.slice(-6), () => {
      const parts = correctedParts(repair, repair);
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
      it('changes only reviewed modes and the contextual will alternative', () => {
        const reverted = structuredClone(parts);
        for (const part of reverted) for (const slot of part.slots) {
          const before = repair.parts.find(p => p.label === part.label)!.slots.find(s => s.label === slot.label)!;
          slot.response_mode = before.response_mode;
          if (repair.id.endsWith('d0dccb') && part.label === 'c' && slot.label === 'decision') slot.accept = before.accept;
        }
        expect(reverted).toEqual(repair.parts);
        expect(correctedParts({ parts }, repair)).toEqual(parts);
      });
      it('guards changed content and is safely repeatable', () => {
        const q = { ...repair, status: 'approved', stem: 'fixture', stimulus: 'fixture' };
        const review = { ...repair, fingerprint: fingerprint(q) };
        expect(prepare(q, review).changed).toBe(true);
        expect(prepare({ ...q, parts }, review).changed).toBe(false);
        expect(() => prepare({ ...q, stem: 'changed' }, review)).toThrow('content changed');
        expect(() => prepare({ ...q, status: 'retired' }, review)).toThrow('no longer approved');
        const changed = structuredClone(q);
        changed.parts[0].slots[0].answer = 'changed';
        expect(() => prepare(changed, review)).toThrow('content changed');
      });
    });
  }
  it('accepts will only where declared, never will not', () => {
    const q = repairs.find(q => q.id.endsWith('d0dccb'))!;
    const parts = correctedParts(q, q);
    for (const [answer, correct] of [['will', true], ['will not', false], ['should not', false]] as const) {
      const result = markStructuredParts(q.rubric as RubricItem[], parts, [{ ref: 'c.decision', answer }]);
      expect(result.slot_results.find(r => r.ref === 'c.decision')?.correct).toBe(correct);
    }
  });
});
