import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { repairs, reviewedBefore, prepare } from '@/scripts/review/repair-answer-labels';
import QuestionCard from '@/app/study/session/[id]/question-card';
import { MARKED } from './helpers/marked-states';
import { renderMathHtml } from '@/lib/katex';
import { markStructuredParts } from '@/lib/grade/mark';
import type { RubricItem } from '@/lib/types';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study/session/s1' }));
it('covers exactly the remaining twelve approved fields', () => {
  expect(repairs).toHaveLength(12);
  expect(new Set(repairs.map(r => r.id)).size).toBe(12);
  expect(repairs.some(r => r.id.endsWith('797ba6'))).toBe(false);
});
for (const repair of repairs) describe(repair.id.slice(-6), () => {
  const before = reviewedBefore(repair);
  const plan = prepare(before, repair);
  const [label, slotLabel] = repair.ref.split('.');
  it('changes only the approved label, with repeatability and stale-context refusal', () => {
    const restored = structuredClone(plan.next);
    delete (restored.parts.find(p => p.label === label)!.slots.find(s => s.label === slotLabel)! as { prompt?: string }).prompt;
    expect(restored).toEqual(before);
    expect(prepare(plan.next, repair).changed).toBe(false);
    expect(Object.values(plan.update.$set)).toEqual([repair.prompt]);
    expect(plan.filter.parts).toEqual({ $eq: before.parts });
    expect(() => prepare({ ...before, stem: 'Edited' }, repair)).toThrow('changed since review');
    expect(() => prepare({ ...before, status: 'retired' }, repair)).toThrow('changed since review');
  });
  it('preserves correct, wrong and blank deterministic grading', () => {
    for (const kind of ['correct', 'wrong', 'blank']) {
      const inputs = before.parts.flatMap(p => p.slots.map(s => ({ ref: `${p.label}.${s.label}`, answer: kind === 'correct' ? s.answer : kind === 'wrong' ? '999999 wrong' : '' })));
      expect(markStructuredParts(plan.next.rubric as RubricItem[], plan.next.parts, inputs))
        .toEqual(markStructuredParts(before.rubric as RubricItem[], before.parts, inputs));
    }
  });
  it('renders the parent instruction once and a distinct labelled answer box', () => {
    const part = plan.next.parts.find(p => p.label === label)!;
    const parent = String((part as unknown as { prompt: string }).prompt);
    const html = renderToStaticMarkup(createElement(QuestionCard, { question: { ...MARKED.marked, prior: undefined,
      parts: [{ label, marks: 3, promptHtml: renderMathHtml(parent), promptText: parent,
        slots: part.slots.map(s => ({ ref: `${label}.${s.label}`, label: s.label, mode: s.response_mode as 'answer' | 'explain',
          promptHtml: 'prompt' in s && s.prompt ? renderMathHtml(String(s.prompt)) : undefined,
          promptText: 'prompt' in s ? String(s.prompt) : undefined,
        })),
      }],
    } }));
    expect(html.split(renderMathHtml(parent))).toHaveLength(2);
    expect(html).toContain(renderMathHtml(repair.prompt));
    expect(html).toContain(`id="slot-${repair.ref}"`);
  });
});
