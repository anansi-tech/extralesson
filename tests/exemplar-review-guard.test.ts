import { describe, expect, it } from 'vitest';
import { batches, prepare as wording } from '@/scripts/review/preview-question-cleanup';
import { prepare as priority, repairs as priorityRepairs, type Content } from '@/scripts/review/repair-explanation-exemplars';
import { prepare as final, repairs as finalRepairs } from '@/scripts/review/repair-final-explanation-exemplars';
import { deriveFinalAnswer } from '@/lib/validation/question';
import { renderAnswerHtml } from '@/lib/katex';

for (const [name, prepare, repairs] of [
  ['priority', priority, priorityRepairs], ['final', final, finalRepairs],
] as const) describe(`${name} exemplar reviewed-content guard`, () => {
  for (const repair of repairs) {
    const source = [...batches.held, ...batches.missing].find(r => r.id === repair.id)!;
    it(`${repair.id.slice(-6)} accepts approved wording and ignores system timestamps`, () => {
      const q = wording(source.expected, source).next as unknown as Content;
      const { next } = prepare({ ...q, updated_at: new Date() }, repair);
      expect(prepare(next, repair).changed).toBe(false);
    });
  }
  const repair = repairs[0];
  const source = [...batches.held, ...batches.missing].find(r => r.id === repair.id)!;
  for (const field of ['status', 'stimulus', 'rubric', 'mode', 'dependency', 'prompt', 'final_answer']) {
    it(`rejects changed ${field} before and after application`, () => {
      const before = wording(source.expected, source).next as unknown as Content;
      for (const q of [structuredClone(before), prepare(before, repair).next]) {
        const [part, label] = repair.changes[0].ref.split('.');
        const slot = q.parts.find(p => p.label === part)!.slots.find(s => s.label === label)!;
        if (field === 'rubric') (q.rubric as { criterion: string }[])[0].criterion = 'A different reviewed criterion';
        else if (field === 'mode') slot.response_mode = 'answer';
        else if (field === 'dependency') Object.assign(slot, { depends_on: [] });
        else if (field === 'prompt') Object.assign(slot, { prompt: 'Changed instruction' });
        else q[field] = field === 'status' ? 'retired' : 'Changed since review';
        expect(() => prepare(q, repair)).toThrow('changed since review');
      }
    });
  }
});

it('upgrades only the reviewed 037df1 intermediate exemplar and compares all sectors', () => {
  const repair = finalRepairs.find(r => r.id.endsWith('037df1'))!;
  const source = batches.missing.find(r => r.id === repair.id)!;
  const q = wording(source.expected, source).next as unknown as Content;
  const slot = q.parts.find(p => p.label === 'd')!.slots.find(s => s.label === 'reason')!;
  Object.assign(slot, repair.changes[0].previous);
  q.final_answer = deriveFinalAnswer(q.parts);
  const { next, changed } = final(q, repair);
  expect(changed).toBe(true);
  expect(final(next, repair).changed).toBe(false);
  expect(next.rubric).toEqual(q.rubric);
  expect(next.marks).toEqual(q.marks);
  for (const answer of [repair.changes[0].answer, ...repair.changes[0].accept]) {
    for (const text of ['x=60', '120°', '90°', '60°', 'Sorrel', 'Coconut water', 'Mauby']) expect(answer).toContain(text);
    expect(renderAnswerHtml(answer)).not.toContain('katex-error');
  }
  slot.answer += ' Unreviewed edit';
  q.final_answer = deriveFinalAnswer(q.parts);
  expect(() => final(q, repair)).toThrow('changed since review');
});
