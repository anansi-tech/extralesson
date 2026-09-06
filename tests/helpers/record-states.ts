import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HistoryView } from '@/app/study/history/history-view';
import { ProgressView, type ProgressModule, type WeakestTopic } from '@/app/study/progress/progress-view';
import type { HistoryRow } from '@/lib/study/history';
export { visibleText } from './card-states';

// The two record screens of design/ui/ExtraLesson History Progress Stakes.dc.html, as props.
const row = (day: number, stemHtml: string, earned: number, marks: number, unassessed = 0): HistoryRow => ({
  sessionId: `s${day}`,
  index: 0,
  ts: new Date(2026, 8, day, 10),
  stemHtml,
  earned,
  marks,
  unassessed,
});

export const HISTORY = {
  rows: [
    row(5, 'Triangle ABC, right-angled at B, AB = 8 cm and angle ACB = 34°. Calculate the length of BC.', 5, 7),
    row(5, 'Solve 3x² − 5x − 2 = 0', 2, 3),
    row(4, 'A shopkeeper buys 40 kg of rice at $3.75 per kg and sells it at a profit of 20%.', 9, 9),
    row(4, 'The table shows the masses of 60 mangoes picked from one tree.', 6, 10, 2),
    row(2, 'Make t the subject of v = u + at', 3, 3),
    row(1, 'Bearing of P from Q is 145°. Find the bearing of Q from P.', 4, 8),
  ],
  lostMarks: 14,
};

const topic = (code: string, title: string, band: ProgressModule['topics'][number]['band'], mastery: number) => ({ code, title, band, mastery });

export const PROGRESS: { estimable: boolean; modules: ProgressModule[]; weakest: WeakestTopic | null } = {
  estimable: true,
  modules: [
    { module: 1, letter: 'II', strength: 0.68, topics: [topic('M1-NUM1', 'Number theory', 'STRONG', 0.86), topic('M1-CON1', 'Consumer arithmetic', 'BUILDING', 0.54), topic('M1-ALG1', 'Algebraic manipulation', 'WEAK', 0.3)] },
    { module: 2, letter: 'III', strength: 0.41, topics: [topic('M2-GEO1', 'Geometry & trigonometry', 'BUILDING', 0.5), topic('M2-VEC1', 'Vectors & matrices', 'WEAK', 0.2)] },
  ],
  weakest: { code: 'M1-ALG1', title: 'Algebraic manipulation', marks: 8 },
};

export const renderHistory = (p = HISTORY): string => renderToStaticMarkup(createElement(HistoryView, p));
export const renderProgress = (p = PROGRESS): string => renderToStaticMarkup(createElement(ProgressView, p));
