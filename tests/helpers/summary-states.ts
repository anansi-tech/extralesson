import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SessionSummary, type SummaryProps } from '@/app/study/session/[id]/session-summary';
import { DIAGNOSTIC } from './diagnostic-states';
export { visibleText } from './card-states';

// The four summaries of Diagnostic and Summary.dc.html §07, as props from the fold.
const tiles = [
  { index: 0, earned: 5, assessed: 7, href: '/study/session/s1?q=0#marking' },
  { index: 1, earned: 6, assessed: 9, href: '/study/session/s1?q=1#marking' },
  { index: 2, earned: 3, assessed: 5, href: '/study/session/s1?q=2#marking' },
];
const quiet = { label: 'Back to your notebook', href: '/study' };

export const SUMMARIES: Record<string, () => string> = {
  first: () =>
    renderToStaticMarkup(
      createElement(SessionSummary, {
        eyebrow: 'Your first session',
        headline: '5 of 7 marks',
        claim: 'Nothing to compare it against yet. From tomorrow this line shows which way it is going.',
        tilesLabel: 'What that question earned',
        questions: tiles.slice(0, 1),
        moved: 'Algebraic manipulation: 0% → 71% topic strength.',
        before: createElement('section', { className: 'mt-5 border-l-3 border-red-pen bg-[#FDF1F0] px-3 py-2' }, createElement('div', { className: 'section-label' }, 'Next: the diagnostic'), createElement('p', { className: 'mt-1 text-sm leading-snug' }, 'Eight quick questions across the syllabus. Nothing is graded — it puts your topics in order, so the sessions after it start in the right place.')),
        action: { label: 'Start the diagnostic', small: 'About 12 minutes · finds where to start', mode: 'diagnostic' },
        quiet,
      } satisfies SummaryProps),
    ),
  adaptive: () =>
    renderToStaticMarkup(
      createElement(SessionSummary, {
        eyebrow: 'Session 12 · Algebraic manipulation',
        headline: '14 of 21 marks',
        claim: 'Up from 11 of 21 on the same topic 5 days ago.',
        questions: tiles,
        estimate: 'Grade III',
        moved: 'Algebraic manipulation: 40% → 55% topic strength.',
        action: { label: 'Start the next session', small: 'Consumer arithmetic is next · +6 marks', mode: 'adaptive' },
        quiet,
      } satisfies SummaryProps),
    ),
  'adaptive-no-trend': () =>
    renderToStaticMarkup(
      createElement(SessionSummary, {
        eyebrow: 'Session 2 · Consumer arithmetic',
        headline: '9 of 12 marks',
        claim: null,
        questions: tiles.slice(0, 2),
        estimate: null,
        moved: 'Consumer arithmetic: 30% → 62% topic strength.',
        action: { label: 'Start the next session', small: 'About 15 minutes at exam pace', mode: 'adaptive' },
        quiet,
      } satisfies SummaryProps),
    ),
  revisit: () =>
    renderToStaticMarkup(
      createElement(SessionSummary, {
        eyebrow: 'Revisit · 4 objectives',
        headline: '11 of 14 marks',
        claim: 'These were new questions on the objectives you had lost marks on.',
        questions: tiles,
        objectives: [
          { text: 'Factorise a quadratic expression', recovered: true },
          { text: 'Find the area of a triangle', recovered: true },
          { text: 'Calculate a percentage discount', recovered: true },
          { text: 'Solve problems involving bearings', recovered: false },
        ],
        moved: '3 of 4 recovered.',
        action: { label: 'Start the next session', small: 'Consumer arithmetic is next · +6 marks', mode: 'adaptive' },
        quiet,
      } satisfies SummaryProps),
    ),
  diagnostic: () => DIAGNOSTIC.finish(),
};
