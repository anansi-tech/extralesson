import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QuestionCard, { DONT_KNOW, type CardQuestion } from '@/app/study/session/[id]/question-card';
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

/** The card with a choice already made: the state a student is in most of the time. */
const chosen = (selected: number): CardQuestion => ({ ...mcq, draft: { answers: {}, values: {}, selected } });

const SOLUTION = '<p>15% of $80 is $12, so the selling price is $80 − $12 = <b>$68.00</b>.</p>';

/**
 * The screen after the tap, which nothing looked at until now. justMarked
 * means the card was answered a moment ago rather than revisited, so it is the
 * live panel and not the review one.
 */
const answered = (selected: number, misconception?: { nameHtml: string; remediationHtml: string }): CardQuestion => ({
  ...mcq,
  prior: {
    answers: { 'a.i': String(selected) },
    selected,
    justMarked: true,
    feedback: {
      correct: !misconception,
      profile_marks: { CK: misconception ? 0 : 1, AK: 0, R: 0 } as never,
      rubric_awarded: misconception ? [] : ['CK1'],
      partResults: [{ label: 'a', correct: !misconception }],
      feedbackHtml: SOLUTION,
      misconception,
      attemptId: 'att-d1',
      earnableByMethod: 0,
    },
  },
});

export const DIAGNOSTIC = {
  intro: () => renderToStaticMarkup(createElement(DiagnosticIntro, { total: 8, minutes: 12, href: '/study/session/d1?begin=1' })),
  mcq: () =>
    renderToStaticMarkup(createElement(SessionBar, { index: 2, total: 8, marksAnswered: 2, marksTotal: 8, diagnostic: true })) +
    renderToStaticMarkup(createElement(QuestionCard, { question: mcq })),
  'mcq-chosen': () =>
    renderToStaticMarkup(createElement(SessionBar, { index: 2, total: 8, marksAnswered: 2, marksTotal: 8, diagnostic: true })) +
    renderToStaticMarkup(createElement(QuestionCard, { question: chosen(1) })),
  'mcq-dont-know': () =>
    renderToStaticMarkup(createElement(SessionBar, { index: 2, total: 8, marksAnswered: 2, marksTotal: 8, diagnostic: true })) +
    renderToStaticMarkup(createElement(QuestionCard, { question: chosen(DONT_KNOW) })),
  'mcq-answered-right': () =>
    renderToStaticMarkup(createElement(SessionBar, { index: 2, total: 8, marksAnswered: 3, marksTotal: 8, diagnostic: true })) +
    renderToStaticMarkup(createElement(QuestionCard, { question: answered(1) })),
  'mcq-answered-wrong': () =>
    renderToStaticMarkup(createElement(SessionBar, { index: 2, total: 8, marksAnswered: 3, marksTotal: 8, diagnostic: true })) +
    renderToStaticMarkup(
      createElement(QuestionCard, {
        question: answered(3, {
          nameHtml: 'Discount added, not subtracted',
          remediationHtml: 'A 15% discount is taken off the marked price: $80 × 0.85, not $80 × 1.15.',
        }),
      }),
    ),
  finish: () =>
    renderToStaticMarkup(
      createElement(DiagnosticFinish, {
        ranked: [
          { code: 'M1-ALG1', title: 'Algebraic manipulation', right: 0, asked: 1, marks: 8 },
          { code: 'M1-CON1', title: 'Consumer arithmetic', right: 0, asked: 1, marks: 6 },
          { code: 'M2-GEO1', title: 'Geometry & trigonometry', right: 1, asked: 2, marks: 5 },
          { code: 'M1-NUM1', title: 'Number theory', right: 1, asked: 1, marks: 2 },
          { code: 'M1-SET1', title: 'Sets', right: 0, asked: 0, marks: 7 },
          { code: 'M2-STA1', title: 'Statistics', right: 0, asked: 0, marks: 4 },
        ],
        minutes: 15,
      }),
    ),
};
