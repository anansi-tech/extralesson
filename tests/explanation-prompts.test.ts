import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QuestionCard, { type CardQuestion } from '@/app/study/session/[id]/question-card';
import { MARKED } from './helpers/marked-states';
import { reviewFlags } from '@/lib/admin/review-flags';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study/session/s1' }));

describe('specific photo-reason instructions, not disabled-looking answer blanks', () => {
  it('keeps the numeric blank and shows a separate explanation without a typed input', () => {
    const question: CardQuestion = { ...MARKED.marked, prior: undefined, parts: [{
      label: 'a', marks: 2, promptHtml: 'Complete.', promptText: 'Complete.',
      statementHtml: ['The angle is ', ' because ', '.'], slots: [
        { ref: 'a.i', label: 'i', mode: 'answer' },
        { ref: 'a.ii', label: 'ii', mode: 'explain', promptHtml: 'State the circle theorem used.' },
      ],
    }] };
    const html = renderToStaticMarkup(createElement(QuestionCard, { question }));
    expect(html).toContain('id="slot-a.i"');
    expect(html).not.toContain('id="slot-a.ii"');
    // The reason's gap is a RULE, not a box that cannot be typed in: no input,
    // nothing focusable, nothing to read as broken. It is the blank the other
    // gap is, and the prompt beneath says what goes on the line.
    expect(html).not.toMatch(/disabled[^>]*slot-a\.ii|slot-a\.ii[^>]*disabled/);
    expect(html).toContain('<span class="inline-block min-h-11 w-24 border-b-[1.5px] border-ink px-1 py-2 align-baseline">');
    expect(html).toContain('State the circle theorem used.');
    // The label is named once, by the instruction, and never as a heading.
    expect(html).toContain('Write this on paper, labelled (a)(ii)');
    expect(html).not.toMatch(/Reason \d|reason \d below/);
    expect(html).toContain('nothing to type here');
  });
  it('recognises an explicitly prompted explanation as a valid statement configuration', () => {
    expect(reviewFlags({ module: 2, stem: 'A triangle.', parts: [{ label: 'a', prompt: 'Complete.', statement: '{}', slots: [
      { label: 'i', response_mode: 'explain', prompt: 'Give a reason.' },
    ] }] })).toEqual([]);
  });
});
