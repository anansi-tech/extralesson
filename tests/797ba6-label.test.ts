import { expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { before, prepare, prompt } from '@/scripts/review/repair-797ba6-label';
import QuestionCard from '@/app/study/session/[id]/question-card';
import { MARKED } from './helpers/marked-states';
import { renderMathHtml } from '@/lib/katex';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study/session/s1' }));

it('changes only d.i prompt and refuses unreviewed content', () => {
  const { next } = prepare(before);
  expect(prepare(next).changed).toBe(false);
  const restored = structuredClone(next);
  delete (restored.parts.find(p => p.label === 'd')!.slots[0] as { prompt?: string }).prompt;
  expect(restored).toEqual(before);
  expect(() => prepare({ ...before, stem: 'Changed' })).toThrow('changed since review');
});

it('renders the parent instruction once and gives d.i its own label', () => {
  const { next } = prepare(before);
  const part = next.parts.find(p => p.label === 'd')!;
  const html = renderToStaticMarkup(createElement(QuestionCard, { question: { ...MARKED.marked, prior: undefined,
    parts: [{ label: part.label, marks: part.marks, promptHtml: renderMathHtml(part.prompt), promptText: part.prompt,
      slots: part.slots.map(s => ({ ref: `d.${s.label}`, label: s.label, mode: s.response_mode,
        promptHtml: 'prompt' in s && s.prompt ? renderMathHtml(String(s.prompt)) : undefined,
        promptText: 'prompt' in s ? String(s.prompt) : undefined,
      })),
    }],
  } }));
  expect(html.split(renderMathHtml(part.prompt))).toHaveLength(2);
  expect(html).toContain(prompt);
  expect(html).toContain('id="slot-d.i"');
});
