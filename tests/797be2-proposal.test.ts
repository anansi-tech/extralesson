import { describe, expect, it } from 'vitest';
import { original, proposedQuestion, prepare } from '@/scripts/review/preview-797be2-proposal';
import { QuestionDraftZ, deriveFinalAnswer } from '@/lib/validation/question';
import { markStructuredParts } from '@/lib/grade/mark';
import { structuredPrefill } from '@/lib/grade/prefill';
import { renderMathHtml } from '@/lib/katex';
import type { RubricItem } from '@/lib/types';
import cases from '@/design/research/797be2-response-cases.json';

const q = proposedQuestion();
const rubric = q.rubric as RubricItem[];
const numerical = (iqr = '19.2', semi = '9.6') => markStructuredParts(rubric, q.parts, [
  { ref: 'a.i', answer: '10 kg' }, { ref: 'b.i', answer: '47.5 kg' },
  { ref: 'c.i', answer: '40 <= m < 50' }, { ref: 'c.ii', answer: '47.5' },
  { ref: 'd.i', answer: iqr }, { ref: 'd.ii', answer: semi },
]);

describe('797be2 proposed content contract', () => {
  it('reproduces the mathematical counterexample and interval from the stored figure', () => {
    const { boundaries, frequencies } = original.visual.params;
    const total = frequencies.reduce((a, b) => a + b, 0);
    const mean = frequencies.reduce((sum, f, i) => sum + f * (boundaries[i] + boundaries[i + 1]) / 2, 0) / total;
    const median = 40 + (total / 2 - 11) / 12 * 10;
    const lower = 30 + (total / 4 - 4) / 7 * 10;
    const upper = 50 + (3 * total / 4 - 23) / 9 * 10;
    expect(mean).toBe(47.5);
    expect(median).toBe(mean);
    expect(frequencies).not.toEqual([...frequencies].reverse());
    expect(frequencies.indexOf(Math.max(...frequencies))).toBe(2);
    expect((upper - lower).toFixed(1)).toBe('19.2');
    expect(((upper - lower) / 2).toFixed(1)).toBe('9.6');
    expect(median + (upper - lower) / 2).toBeLessThan(58);
  });
  it('fixes the schema defect without reallocating any mark or changing other numerical contracts', () => {
    const before = QuestionDraftZ.safeParse(original);
    expect(before.success).toBe(false);
    if (!before.success) expect(before.error.issues.map(i => i.path.join('.'))).toEqual(['parts.3.slots.0.answer_format']);
    expect(QuestionDraftZ.safeParse(q).success).toBe(true);
    expect(q.marks).toBe(12);
    expect(q.rubric.map(r => [r.code, r.profile, r.mark_value, r.slot_ref, r.for_format])).toEqual(original.rubric.map(r => [r.code, r.profile, r.mark_value, r.slot_ref, r.for_format]));
    expect(q.rubric.filter(r => !['R1', 'R3'].includes(r.code))).toEqual(original.rubric.filter(r => !['R1', 'R3'].includes(r.code)));
    expect(q.rubric.find(r => r.code === 'R3')?.criterion).toContain('their estimated median');
    expect(q.rubric.find(r => r.code === 'R3')?.criterion).toContain('correct acceptance decision');
    for (const part of q.parts) for (const slot of part.slots) {
      const beforeSlot = original.parts.find(p => p.label === part.label)!.slots.find(s => s.label === slot.label)!;
      if (part.label === 'c' && slot.label === 'iii') continue;
      expect(slot.answer).toBe(beforeSlot.answer);
      expect('accept' in slot ? slot.accept : undefined).toEqual('accept' in beforeSlot ? beforeSlot.accept : undefined);
      expect(slot.depends_on).toEqual(beforeSlot.depends_on);
    }
    expect(q.visual).toEqual(original.visual);
    expect(q.final_answer).toBe(deriveFinalAnswer(q.parts));
    expect(q.parts[2].slots[2].objective_id).toBe('M3.1.8');
    expect(q.parts[2].slots[2].depends_on).toEqual([]);
  });
  it('keeps numerical credit and charges form only to the existing semi-IQR form mark', () => {
    const canonical = numerical();
    expect(canonical.rubric_awarded).toHaveLength(10);
    expect(canonical.profile_marks).toEqual({ CK: 4, AK: 5, R: 1 });
    expect(numerical('19.20').rubric_awarded).toEqual(canonical.rubric_awarded);
    expect(numerical('19.2', '9.60').rubric_awarded).toEqual(canonical.rubric_awarded.filter(c => c !== 'R2'));
    for (const iqr of ['', '99']) {
      const result = numerical(iqr);
      expect(result.rubric_awarded).not.toContain('CK4');
      expect(result.rubric_awarded).not.toContain('AK4');
      expect(result.rubric_awarded).not.toContain('AK5');
    }
    expect(numerical('19.2', '').rubric_awarded).not.toContain('R2');
  });
  it('keeps every proposed reasoning example photo-assessed with no typed matching or prefill', () => {
    for (const example of cases.cases) {
      const marked = markStructuredParts(rubric, q.parts, [{ ref: example.ref, answer: example.answer }]);
      expect(marked.rubric_awarded).not.toContain('R1');
      expect(marked.rubric_awarded).not.toContain('R3');
      expect(structuredPrefill(q.parts, { legible: true, lines: [{ text: example.answer }], answers: [{ slot_ref: example.ref, entries: [example.answer], source_lines: [1] }] })).toEqual({ answers: {}, values: {} });
    }
  });
  it('has renderable proposed wording and guards re-review and repeatability', () => {
    for (const part of q.parts) {
      expect(renderMathHtml(part.statement ?? part.prompt)).not.toContain('katex-error');
      for (const slot of part.slots) if ('prompt' in slot) expect(renderMathHtml(String(slot.prompt))).not.toContain('katex-error');
    }
    expect(prepare(original).changed).toBe(true);
    expect(prepare(q).changed).toBe(false);
    expect(() => prepare({ ...original, stem: 'Edited after review' })).toThrow('changed since review');
    expect(() => prepare({ ...original, status: 'retired' })).toThrow('changed since review');
    expect(proposedQuestion()).toEqual(q);
  });
});
