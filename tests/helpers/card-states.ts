import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QuestionCard, { HandIn, type CardQuestion } from '@/app/study/session/[id]/question-card';
import { CameraBox } from '@/app/study/session/[id]/working-photo';
import { SessionBar } from '@/app/study/session/[id]/session-bar';

// The four states of design/ui/ExtraLesson Question Card.dc.html, as props.
// The card is a client component: next/navigation is mocked by the test file.
const FIGURE = `<svg viewBox="0 0 280 200" width="280" height="200" xmlns="http://www.w3.org/2000/svg"><polygon points="40,170 40,40 240,170" fill="none" stroke="#1e2430" stroke-width="1.5"/><rect x="40" y="156" width="14" height="14" fill="none" stroke="#1e2430"/><text x="30" y="34" font-size="12">A</text><text x="30" y="186" font-size="12">B</text><text x="246" y="186" font-size="12">C</text><text x="8" y="108" font-size="11">8 cm</text><text x="196" y="160" font-size="11">34°</text></svg><div style="margin-top:4px;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#5b6373">Not drawn to scale</div>`;

const base: CardQuestion = {
  sessionId: 's1',
  index: 1,
  total: 3,
  kind: 'structured',
  stemHtml: 'The diagram shows triangle ABC, right-angled at B, with AB = 8 cm and angle ACB = 34°.',
  visualHtml: FIGURE,
  figureMinWidth: 280,
  figureMaxWidth: 280,
  parts: [
    { label: 'a', promptHtml: 'Calculate the length of BC.', promptText: 'Calculate the length of BC.', marks: 3, slots: [{ ref: 'a.i', label: 'i', mode: 'answer', hints: ['Give the length in cm to 1 decimal place.'], symbols: [] }] },
    { label: 'b', promptHtml: 'Calculate the area of triangle ABC.', promptText: 'Calculate the area of triangle ABC.', marks: 2, slots: [{ ref: 'b.i', label: 'i', mode: 'answer', hints: [], symbols: ['√', '°', '²'] }] },
    { label: 'c', promptHtml: 'Show that the perimeter is less than 35 cm.', promptText: 'Show that the perimeter is less than 35 cm.', marks: 2, slots: [{ ref: 'c.i', label: 'i', mode: 'show_that' }] },
  ],
  marks: 7,
  marksTotal: 21,
  marksAnswered: 7,
  rubricCodes: [
    { code: 'CK1', profile: 'CK', mark_value: 1, part_label: 'a', slot_ref: 'a.i' },
    { code: 'AK1', profile: 'AK', mark_value: 1, part_label: 'a', slot_ref: 'a.i' },
    { code: 'AK2', profile: 'AK', mark_value: 1, part_label: 'a', slot_ref: 'a.i' },
    { code: 'AK3', profile: 'AK', mark_value: 1, part_label: 'b', slot_ref: 'b.i' },
    { code: 'AK4', profile: 'AK', mark_value: 1, part_label: 'b', slot_ref: 'b.i' },
    { code: 'R1', profile: 'R', mark_value: 1, part_label: 'c', slot_ref: 'c.i' },
    { code: 'R2', profile: 'R', mark_value: 1, part_label: 'c', slot_ref: 'c.i' },
  ],
};

const read = {
  transcription: {
    lines: [
      { text: 'tan 34 = 8 / BC', part_label: 'a', slot_label: null, confidence: 0.9 },
      { text: 'BC = 8 / tan 34 = 11.9', part_label: null, slot_label: null, confidence: 0.5 },
      { text: '½ × 8 × 11.9 = 47.6', part_label: 'b', slot_label: null, confidence: 0.9 },
    ],
    answers: [],
    legible: true,
  },
  transcriptionId: 't1',
  take: 1,
  takesLeft: 1,
  prefill: { 'a.i': '11.9', 'b.i': '47.6' },
  rejected: [],
} as NonNullable<CardQuestion['draft']>['read'];

export const STATES: Record<'unanswered' | 'reading' | 'read' | 'blanks', CardQuestion> = {
  unanswered: base,
  reading: base,
  read: { ...base, draft: { answers: { 'a.i': '11.9', 'b.i': '47.6' }, values: {}, read } },
  blanks: { ...base, draft: { answers: { 'a.i': '11.9' }, values: {} } },
};

export const renderCard = (q: CardQuestion): string => renderToStaticMarkup(createElement(QuestionCard, { question: q }));

export const renderBar = (q: CardQuestion): string =>
  renderToStaticMarkup(createElement(SessionBar, { index: q.index, total: q.total, marksAnswered: q.marksAnswered, marksTotal: q.marksTotal }));

/** The two pieces that differ while a page is being read, as the live components render them. */
export const readingPieces = () => ({
  camera: renderToStaticMarkup(
    createElement(CameraBox, {
      post: false,
      heading: 'Your working on paper',
      pending: true,
      preview: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
      pick: createElement('button', { type: 'button', disabled: true, className: 'mt-2.5 w-full p-3 text-xs min-h-11 border-[1.5px] border-ink bg-white font-mono uppercase tracking-[0.1em] disabled:opacity-60' }, 'Reading…'),
    }),
  ),
  handIn: renderToStaticMarkup(createElement(HandIn, { disabled: true, phase: 'reading', kind: 'structured', blanks: 3, typedMarks: 5, pageMarks: 2, fromPage: 0 })),
});

/** The page's words in reading order, tags and whitespace collapsed. */
export const visibleText = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<input[^>]*>/g, (m) => (/type="hidden"/.test(m) ? ' ' : ` ${/placeholder="([^"]*)"/.exec(m)?.[1] ?? ''} ${/value="([^"]*)"/.exec(m)?.[1] ?? ''} `))
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;|&rsquo;|&#8217;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
