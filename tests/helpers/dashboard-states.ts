import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DashboardView, type DashboardProps } from '@/app/study/dashboard';
import type { OverallPrediction } from '@/lib/grade/predict';

// The four states of design/ui/ExtraLesson Dashboard.dc.html, as props.
const modulePrediction = (module: 1 | 2 | 3, marks_seen: number) =>
  ({ module, marks_seen, mastery: 0.4, p1_estimate: 12, p2_estimate: 20, project_assumed: 10, total_estimate: 42, letter: null }) as OverallPrediction['modules'][number];

const cold: OverallPrediction = {
  modules: [modulePrediction(1, 12), modulePrediction(2, 0), modulePrediction(3, 4)],
  overall_percent: 0,
  overall_grade: null,
  marks_attempted: 16,
  estimable: false,
};
const estimated: OverallPrediction = {
  modules: [modulePrediction(1, 80), modulePrediction(2, 60), modulePrediction(3, 52)],
  overall_percent: 42,
  overall_grade: 'III',
  marks_attempted: 192,
  estimable: true,
};

const base: DashboardProps = {
  firstName: 'Kiara',
  email: 'kiara@example.com',
  sitting: 'May/June 2027',
  nextSitting: { value: 'jan-2027', label: 'January 2027 re-sit' },
  lead: 'session',
  open: null,
  diagnosticOpen: true,
  isNewStudent: false,
  firstQuestion: null,
  reachable: [
    { code: 'M1-ALG1', title: 'Algebraic manipulation', module: 1, mastery: 0.3, pointsAvailable: 8 },
    { code: 'M1-CON1', title: 'Consumer arithmetic', module: 1, mastery: 0.4, pointsAvailable: 6 },
    { code: 'M2-GEO1', title: 'Geometry & trigonometry', module: 2, mastery: 0.5, pointsAvailable: 5 },
  ],
  gatedCount: 1,
  leadWithReachable: true,
  prediction: estimated,
  progress: { sessionsCompleted: 12, questionsAnswered: 31, marksAssessed: 248, streakDays: 5, firstSessionAt: new Date('2026-08-01') },
  topicChoices: [{ code: 'M1-ALG1', title: 'Algebraic manipulation', module: 1, prefixes: ['M1.5.'] }],
  revisitMarks: 14,
  revisitObjectives: 6,
  waiting: 0,
};

export const STATES: Record<'new' | 'first-done' | 'returning' | 'no-estimate', DashboardProps> = {
  new: {
    ...base,
    lead: 'first',
    isNewStudent: true,
    reachable: [],
    gatedCount: 0,
    leadWithReachable: false,
    prediction: cold,
    progress: { sessionsCompleted: 0, questionsAnswered: 0, marksAssessed: 0, streakDays: 0, firstSessionAt: null },
    revisitMarks: 0,
    revisitObjectives: 0,
  },
  'first-done': {
    ...base,
    lead: 'diagnostic',
    firstQuestion: { sessionId: 'abc123', title: 'Quadratics — factorising', earned: 2, marks: 3 },
    reachable: [],
    gatedCount: 0,
    leadWithReachable: false,
    prediction: cold,
    progress: { sessionsCompleted: 1, questionsAnswered: 1, marksAssessed: 3, streakDays: 1, firstSessionAt: new Date('2026-09-01') },
    revisitMarks: 0,
    revisitObjectives: 0,
    waiting: 1,
  },
  returning: base,
  'no-estimate': {
    ...base,
    reachable: [],
    gatedCount: 0,
    leadWithReachable: false,
    prediction: cold,
    progress: { sessionsCompleted: 3, questionsAnswered: 5, marksAssessed: 16, streakDays: 2, firstSessionAt: new Date('2026-09-01') },
    revisitMarks: 0,
    revisitObjectives: 0,
    waiting: 9,
  },
};

export const render = (props: DashboardProps): string => renderToStaticMarkup(createElement(DashboardView, props));

/** The page's words in reading order, tags and whitespace collapsed. */
export const visibleText = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;|&rsquo;|&#8217;/g, '\u2019')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
