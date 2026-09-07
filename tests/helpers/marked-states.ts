import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QuestionCard, { type CardQuestion } from '@/app/study/session/[id]/question-card';
import { STATES as CARD, renderBar, visibleText } from './card-states';

// The three states of design/ui/ExtraLesson Marked Question.dc.html, as
// props. The just-marked screen is the card's own state after submit, so the
// states are rendered through the look back, which carries the same reads,
// rows, disputes and retry.
type Take = NonNullable<NonNullable<CardQuestion['prior']>['working']>[number];

const lines = [
  { text: 'tan 34 = 8 / BC', part_label: 'a', confidence: 0.9 },
  { text: 'BC = 8 / tan 34 = 11.9', part_label: null, confidence: 0.9 },
  { text: '8 × 11.9 = 95.2', part_label: 'b', confidence: 0.9 },
  { text: 'P = 8 + 11.9 + 14.3 = 34.2 < 35', part_label: null, confidence: 0.9 },
];
const method = [
  { code: 'AK3', awarded: true, reasonHtml: 'Correct base and height used' },
  { code: 'AK4', awarded: false, reasonHtml: 'Area correct to 1 d.p. — 95.2 is twice the area' },
  { code: 'R1', awarded: true, reasonHtml: 'Perimeter formed from all three sides' },
  { code: 'R2', awarded: true, reasonHtml: 'Comparison with 35 cm stated' },
];
const take = (over: Partial<Take>): Take => ({
  take: 1,
  of: 1,
  transcriptionId: 't1',
  disputed: [],
  rejected: [],
  lines,
  legible: true,
  marked: true,
  method,
  slips: [{ part: 'b', quote: '8 × 11.9 = 95.2', sentence: 'You wrote 8 × 11.9 and stopped — the half is missing.' }],
  ...over,
});

const feedback = (working: Take): NonNullable<CardQuestion['prior']>['feedback'] => ({
  correct: false,
  profile_marks: { CK: 1, AK: 3, R: 2 } as never,
  rubric_awarded: ['CK1', 'AK1', 'AK2', 'AK3'],
  partResults: [
    { label: 'a.i', correct: true },
    { label: 'b.i', correct: false, reasonHtml: 'Area of a triangle is ½ × base × height. The multiplication earned the method mark; the value did not earn the accuracy mark.' },
  ],
  feedbackTitleHtml: 'Worked solution',
  feedbackHtml: '<p>(a) tan 34° = AB / BC, so BC = 8 / tan 34° = 11.9 cm (1 d.p.).</p><p>(b) Area = ½ × BC × AB = ½ × 11.9 × 8 = <b>47.6 cm²</b>.</p><p>(c) AC = 8 / sin 34° = 14.3 cm, so the perimeter is 8 + 11.9 + 14.3 = 34.2 cm, which is less than 35 cm.</p>',
  isMisconception: false,
  attemptId: 'att1',
  earnableByMethod: 0,
  working: {
    transcription: { lines: working.lines.map((l) => ({ ...l, slot_label: null })), answers: [], legible: working.legible },
    transcriptionId: working.transcriptionId,
    rejected: working.rejected,
    take: 1,
    takesLeft: 1,
    method: working.method.map((m) => ({ ...m, mark_value: 1 })),
    marksAdded: working.method.filter((m) => m.awarded).length,
    slips: working.slips ?? [],
    marked: working.marked,
  } as NonNullable<CardQuestion['prior']>['feedback']['working'],
});

const marked = (working: Take): CardQuestion => ({
  ...CARD.unanswered,
  marksAnswered: 12,
  prior: { answers: { 'a.i': '11.9', 'b.i': '95.2' }, feedback: feedback(working), working: [working] },
});

export const MARKED: Record<'marked' | 'queried' | 'failed', CardQuestion> = {
  marked: marked(take({})),
  queried: marked(take({ disputed: ['AK4'], rejected: [3] })),
  failed: marked(take({ marked: false, method: [], slips: [] })),
};

export const renderMarked = (q: CardQuestion): string => renderBar(q) + renderToStaticMarkup(createElement(QuestionCard, { question: q }));
export { visibleText };
