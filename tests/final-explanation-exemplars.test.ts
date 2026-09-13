import { describe, expect, it } from 'vitest';
import { batches } from '@/scripts/review/preview-question-cleanup';
import { prepare, repairs, type Content } from '@/scripts/review/repair-final-explanation-exemplars';
import { markStructuredParts } from '@/lib/grade/mark';
import { structuredPrefill } from '@/lib/grade/prefill';
import type { RubricItem } from '@/lib/types';

const source = (id: string) => structuredClone([...batches.held, ...batches.missing].find(repair => repair.id === id)!.expected) as unknown as Content;

describe('final explanation exemplars match their existing evidence rows', () => {
  it('covers the fourteen remaining reviewed questions and fifteen explanation slots', () => {
    expect(repairs).toHaveLength(14);
    expect(repairs.flatMap(repair => repair.changes.map(change => change.ref))).toHaveLength(15);
  });

  for (const repair of repairs) describe(repair.id.slice(-6), () => {
    const before = source(repair.id);
    const { next } = prepare(before, repair);

    it('changes only reviewed examples and the derived final answer', () => {
      expect(prepare(next, repair).changed).toBe(false);
      const restored = structuredClone(next);
      for (const change of repair.changes) {
        const [part, label] = change.ref.split('.');
        Object.assign(restored.parts.find(p => p.label === part)!.slots.find(s => s.label === label)!, change.before);
      }
      restored.final_answer = before.final_answer;
      expect(restored).toEqual(before);
      expect(next.marks).toBe(before.marks);
      expect(next.rubric).toEqual(before.rubric);
      expect(next.objective_ids).toEqual(before.objective_ids);
      expect(next.parts.flatMap(p => p.slots.map(s => s.response_mode))).toEqual(before.parts.flatMap(p => p.slots.map(s => s.response_mode)));
      const stale = structuredClone(before);
      const [part, label] = repair.changes[0].ref.split('.');
      stale.parts.find(p => p.label === part)!.slots.find(s => s.label === label)!.answer = 'Changed since review';
      expect(() => prepare(stale, repair)).toThrow('changed since review');
    });

    it('keeps every changed slot photo-assessed and out of typed grading and prefill', () => {
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

  it('makes the missing evidence explicit without adding a grading rule', () => {
    const text = Object.fromEntries(repairs.flatMap(repair => repair.changes.map(change => [`${repair.id.slice(-6)}:${change.ref}`, change.answer])));
    expect(text['d9c254:b.ii']).toContain('\\vec{AB}=\\vec{DC}');
    expect(text['d9c254:c.iii']).toContain('Therefore $ABCD$ is a parallelogram');
    expect(text['9e87e7:c.ii']).toContain('\\overrightarrow{AB}=\\overrightarrow{CD}');
    expect(text['d1704a:c.ii']).toContain('tangent $DA$');
    expect(text['a9f53f:d.ii']).toContain('Using $k=8$');
    expect(text['c75c61:d.reason']).toContain('mode');
    expect(text['804ada:d.reason']).toContain('\\frac{90}{10}=9');
    expect(text['8211a2:b.reason']).toContain('random sample of $12$ balls');
    expect(text['8211c1:c.ii']).toContain('same gradient');
    expect(text['c75c59:d.reason']).toContain('affect the mean');
    expect(text['804a31:d.reason']).toContain('$4\\times8-30=2$');
    expect(text['9e87f7:d.reason']).toContain('$84-72=12$');
    expect(text['0ab933:c.i']).toContain('will not be accepted');
    expect(text['037df1:d.reason']).toContain('greatest sector angle');
    expect(text['c0c0ed:b.mirror_line']).toContain('equal distances above and below');
  });
});
