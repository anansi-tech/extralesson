import { expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QuestionCard, { type CardQuestion } from '@/app/study/session/[id]/question-card';
import { MARKED } from './helpers/marked-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study/session/s1' }));

function blanks(options: { marked?: boolean; mode?: string; withheld?: boolean; missing?: boolean } = {}) {
  const q: CardQuestion = {
    ...MARKED.marked,
    parts: [{ label: 'a', marks: 2, promptHtml: 'Complete.', promptText: 'Complete.', statementHtml: ['The frame has ', ' lines and order ', '.'], slots: [
      { ref: 'a.i', label: 'i', mode: options.mode ?? 'answer' },
      { ref: 'a.ii', label: 'ii', mode: 'answer' },
    ] }],
    prior: options.marked === false ? undefined : {
      ...MARKED.marked.prior!,
      answers: { 'a.i': '1', 'a.ii': '2' },
      feedback: { ...MARKED.marked.prior!.feedback, partResults: options.missing ? [] : [
        { label: 'a.i', correct: true, formWithheld: options.withheld },
        { label: 'a.ii', correct: false },
      ] },
    },
  };
  const CELL = '<span class="inline-flex items-baseline gap-1">';
  // One cell per gap: from its opening tag to the next gap's, or to the end of
  // the statement row. The cell nests — the gap and the punctuation it carries
  // are one unit inside it — so a match to the first </span> stops short of the
  // verdict.
  return renderToStaticMarkup(createElement(QuestionCard, { question: q }))
    .split(CELL)
    .slice(1)
    .map((chunk) => chunk.split('</div>')[0]);
}

it('puts the green tick and red cross beside the corresponding cloze inputs', () => {
  const cells = blanks();
  expect(cells).toHaveLength(2);
  expect(cells[0]).toContain('slot-a.i');
  expect(cells[0]).toContain('aria-label="Correct"');
  expect(cells[0]).toContain('text-green-pen');
  expect(cells[0]).toContain('✓');
  expect(cells[1]).toContain('slot-a.ii');
  expect(cells[1]).toContain('aria-label="Incorrect"');
  expect(cells[1]).toContain('text-red-pen');
  expect(cells[1]).toContain('✗');
});

it('keeps form-withheld amber instead of showing a green correct mark', () => {
  const cell = blanks({ withheld: true })[0];
  expect(cell).toContain('text-[#B8860B]');
  expect(cell).toContain('value · form withheld');
  expect(cell).not.toContain('text-green-pen');
});

it.each([{ marked: false }, { missing: true }])('shows no verdict before marking or without a result: %j', (options) => {
  expect(blanks(options).join('')).not.toMatch(/✓|✗/);
});

it('does not invent a typed verdict for a photo-assessed explanation blank', () => {
  expect(blanks({ mode: 'explain' })[0]).not.toMatch(/✓|✗/);
});
