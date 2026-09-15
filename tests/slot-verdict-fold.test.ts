import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QuestionCard from '@/app/study/session/[id]/question-card';
import { MARKED } from './helpers/marked-states';
import type { CardQuestion } from '@/app/study/session/[id]/question-card';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study/session/s1' }));

/**
 * THE HEADER, THE ROWS AND THE SLOT READ ONE FOLD.
 *
 * Found on 9e8767 (a): the header said 9 of 9 while the slot drew a red cross
 * and a hint. partResults is the grader's word on the TYPED value, decided at
 * submit and never revisited, so a slot whose rows the page later earned still
 * read as wrong beside a header saying every mark was given.
 */
const base = MARKED.marked as CardQuestion;
const prior = base.prior!;

/** (b) typed wrong, and the page then earns both of its rows. */
const pageRescued = (over: Partial<NonNullable<CardQuestion['prior']>> = {}): CardQuestion => ({
  ...base,
  prior: {
    ...prior,
    ...over,
    feedback: {
      ...prior.feedback,
      // The grader withheld b.i on the typed value.
      // a.i's three rows are the grader's; c.i's two are not in play here.
      rubric_awarded: ['CK1', 'AK1', 'AK2', 'R1', 'R2'],
      partResults: [
        { label: 'a.i', correct: true },
        { label: 'b.i', correct: false, reasonHtml: 'Area of a triangle is half base times height.' },
      ],
      working: {
        ...prior.feedback.working!,
        marked: true,
        // …and the marker awarded b.i's rows from the page.
        method: [
          { code: 'AK3', awarded: true, reasonHtml: 'the halving is on the page', mark_value: 1 },
          { code: 'AK4', awarded: true, reasonHtml: 'the value follows', mark_value: 1 },
        ],
        marksAdded: 2,
        slips: [],
      } as NonNullable<CardQuestion['prior']>['feedback']['working'],
    },
  },
});

const render = (q: CardQuestion) => renderToStaticMarkup(createElement(QuestionCard, { question: q }));
const crosses = (html: string) => (html.match(/aria-label="Incorrect"/g) ?? []).length;
const ticks = (html: string) => (html.match(/aria-label="Correct"/g) ?? []).length;

describe('a slot the page rescued shows a tick and no hint', () => {
  it('on revisit', () => {
    const html = render(pageRescued());

    expect(crosses(html), 'no slot is wrong once the fold earns its rows').toBe(0);
    expect(ticks(html)).toBeGreaterThan(0);
    expect(html, 'and the hint goes with the cross').not.toContain('half base times height');
  });

  it('live, in the same marking', () => {
    // justMarked is the same feedback before the student has navigated away.
    const html = render(pageRescued({ justMarked: true } as never));

    expect(crosses(html)).toBe(0);
    expect(html).not.toContain('half base times height');
  });

  it('and the header agrees with the slot, which was the fault', () => {
    const html = render(pageRescued());
    // Every row earned: four of four, and no cross anywhere on the page.
    expect(html).toMatch(/7 of 7 marks/);
    expect(crosses(html)).toBe(0);
  });
});

describe('a slot the page did not rescue still shows the cross and the hint', () => {
  const notRescued = (): CardQuestion => {
    const q = pageRescued();
    const w = q.prior!.feedback.working!;
    return {
      ...q,
      prior: { ...q.prior!, feedback: { ...q.prior!.feedback, working: { ...w, method: [{ code: 'AK3', awarded: false, reasonHtml: 'not on the page', mark_value: 1 }], marksAdded: 0 } as typeof w } },
    };
  };

  it('keeps the cross the fold still withholds', () => {
    const html = render(notRescued());
    expect(crosses(html)).toBeGreaterThan(0);
    expect(html, 'and says what to do').toContain('half base times height');
  });

  it('so the cross means one thing: the fold withheld a row on that slot', () => {
    expect(crosses(render(pageRescued()))).toBe(0);
    expect(crosses(render(notRescued()))).toBeGreaterThan(0);
  });
});
