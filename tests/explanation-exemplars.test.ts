import { describe, expect, it } from 'vitest';
import { batches } from '@/scripts/review/preview-question-cleanup';
import { prepare, repairs, type Content } from '@/scripts/review/repair-explanation-exemplars';
import { markStructuredParts } from '@/lib/grade/mark';
import { structuredPrefill } from '@/lib/grade/prefill';
import type { RubricItem } from '@/lib/types';

const source = (id: string) => structuredClone(batches.missing.find(repair => repair.id === id)!.expected) as unknown as Content;

describe('explanation exemplars match their existing evidence rows', () => {
  it('covers only the five approved high-priority questions and six explanation slots', () => {
    expect(repairs).toHaveLength(5);
    expect(repairs.flatMap(repair => repair.changes.map(change => change.ref))).toEqual([
      'd.image_claim', 'd.root_claim', 'c.decision', 'd.ii', 'd.ii', 'd.reason',
    ]);
  });

  for (const repair of repairs) describe(repair.id.slice(-6), () => {
    const before = source(repair.id);
    const { next } = prepare(before, repair);

    it('changes only the approved explanation exemplars and derived final answer', () => {
      expect(prepare(next, repair).changed).toBe(false);
      const restored = structuredClone(next);
      for (const change of repair.changes) {
        const [part, label] = change.ref.split('.');
        const slot = restored.parts.find(p => p.label === part)!.slots.find(s => s.label === label)!;
        Object.assign(slot, change.before);
      }
      restored.final_answer = before.final_answer;
      expect(restored).toEqual(before);
      expect(next.marks).toBe(before.marks);
      expect(next.rubric).toEqual(before.rubric);
      expect(next.objective_ids).toEqual(before.objective_ids);
      expect(next.parts.flatMap(p => p.slots.map(s => s.response_mode))).toEqual(before.parts.flatMap(p => p.slots.map(s => s.response_mode)));
      const stale = structuredClone(before);
      stale.parts.find(part => part.label === repair.changes[0].ref.split('.')[0])!.slots.find(slot => slot.label === repair.changes[0].ref.split('.')[1])!.answer = 'Changed since review';
      expect(() => prepare(stale, repair)).toThrow('changed since review');
    });

    it('keeps the changed slots photo-assessed and out of typed grading and prefill', () => {
      for (const change of repair.changes) {
        const [part, label] = change.ref.split('.');
        const slot = next.parts.find(p => p.label === part)!.slots.find(s => s.label === label)!;
        expect(slot.response_mode).toBe('explain');
        const marked = markStructuredParts(next.rubric as RubricItem[], next.parts, [{ ref: change.ref, answer: slot.answer }]);
        expect(marked.rubric_awarded).toEqual([]);
        expect(structuredPrefill(next.parts, { legible: true, lines: [{ text: slot.answer }], answers: [{ slot_ref: change.ref, entries: [slot.answer], source_lines: [1] }] })).toEqual({ answers: {}, values: {} });
      }
    });
  });

  it('requires all currently stated evidence in each replacement exemplar', () => {
    const text = Object.fromEntries(repairs.flatMap(repair => repair.changes.map(change => [`${repair.id.slice(-6)}:${change.ref}`, change.answer])));
    expect(text['804a29:d.image_claim']).toContain('symmetry');
    expect(text['804a29:d.root_claim']).toContain('(x+2)(x-4)');
    expect(text['804a29:d.root_claim']).toContain('$x$-intercepts');
    expect(text['804b34:c.decision']).toContain('1,205.86');
    expect(text['9e88a2:d.ii']).toContain('sample statistic');
    expect(text['9e88a2:d.ii']).toContain('population parameter');
    expect(text['a9f570:d.ii']).toContain('\\{A,D\\}');
    expect(text['a9f570:d.ii']).toContain('$R$ or $S$');
    expect(text['48641b:d.reason']).toContain('100\\%-70\\%=30\\%');
  });
});
