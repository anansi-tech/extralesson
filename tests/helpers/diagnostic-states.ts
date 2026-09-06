import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QuestionCard, { type CardQuestion } from '@/app/study/session/[id]/question-card';
import { SessionBar } from '@/app/study/session/[id]/session-bar';
import { DiagnosticIntro } from '@/app/study/session/[id]/diagnostic-intro';
import { DiagnosticFinish } from '@/app/study/session/[id]/diagnostic-finish';
export { visibleText } from './card-states';

// The three diagnostic screens of Diagnostic and Summary.dc.html §06, as props.
const mcq: CardQuestion = {
  sessionId: 'd1',
  index: 2,
  total: 8,
  kind: 'mcq',
  stemHtml: 'A shirt marked $80 is sold at a 15% discount. What is the selling price?',
  parts: [],
  optionsHtml: ['$65.00', '$68.00', '$72.00', '$92.00'],
  topicTitle: 'Consumer arithmetic',
  scored: false,
  marks: 1,
  marksTotal: 8,
  marksAnswered: 2,
  rubricCodes: [],
};

export const DIAGNOSTIC = {
  intro: () => renderToStaticMarkup(createElement(DiagnosticIntro, { total: 8, minutes: 12, href: '/study/session/d1?begin=1' })),
  mcq: () =>
    renderToStaticMarkup(createElement(SessionBar, { index: 2, total: 8, marksAnswered: 2, marksTotal: 8, diagnostic: true })) +
    renderToStaticMarkup(createElement(QuestionCard, { question: mcq })),
  finish: () =>
    renderToStaticMarkup(
      createElement(DiagnosticFinish, {
        ranked: [
          { code: 'M1-ALG1', title: 'Algebraic manipulation', right: 0, asked: 1, marks: 8 },
          { code: 'M1-CON1', title: 'Consumer arithmetic', right: 0, asked: 1, marks: 6 },
          { code: 'M2-GEO1', title: 'Geometry & trigonometry', right: 1, asked: 2, marks: 5 },
          { code: 'M1-NUM1', title: 'Number theory', right: 1, asked: 1, marks: 2 },
        ],
        next: 'Algebraic manipulation',
        minutes: 15,
      }),
    ),
};
