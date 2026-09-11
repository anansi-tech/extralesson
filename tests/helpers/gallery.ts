import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CaptureSurface } from '@/app/study/session/[id]/working-photo';
import type { CaptureState } from '@/app/study/session/[id]/capture-state';
import type { CardQuestion } from '@/app/study/session/[id]/question-card';
import type { DashboardProps } from '@/app/study/dashboard';
import { STATES as DASH, render as renderDashboard } from './dashboard-states';
import { STATES as CARD, renderBar, renderCard } from './card-states';
import { MARKED, renderMarked } from './marked-states';
import { DIAGNOSTIC } from './diagnostic-states';
import { SUMMARIES } from './summary-states';
import { WELCOME, renderWelcome } from './welcome-states';
import { AUTH, renderAuth } from './auth-states';
import { FAILURES } from './failure-states';
import { TOO_MANY } from '@/lib/auth/rate-limit';
import { PROGRESS, renderHistory, renderProgress } from './record-states';
import { bodyPage, chromePage } from './chrome-page';

/**
 * EVERY STUDENT SCREEN IN EVERY STATE, as whole pages: what the gallery
 * script photographs and what the gallery test holds to one set of rules.
 */
export interface Shot {
  screen: string;
  state: string;
  page: string;
  /** Put in place of the camera box once loaded: the two capture states only a tap reaches. */
  surface?: string;
}

const GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

const surface = (state: CaptureState, post: boolean, error = 'That photo couldn’t be sent. Take it again.'): string =>
  renderToStaticMarkup(
    createElement(CaptureSurface, {
      state,
      post,
      intro: '',
      preview: state === 'reading' ? GIF : null,
      error: state === 'failed' ? error : null,
      retakes: 1,
      limit: 2,
      thumb: null,
      onPick: () => {},
      input: createElement('input', { type: 'file', className: 'hidden' }),
      read: null,
    }),
  );

const SESSION = '/study/session/s1';
const dashboard = (state: string, props: DashboardProps): Shot => ({ screen: 'dashboard', state, page: chromePage(renderDashboard(props)) });
const returning = DASH.returning;

const card = (state: string, q: CardQuestion, swap?: CaptureState): Shot => ({
  screen: 'question-card',
  state,
  page: chromePage(renderBar(q) + renderCard(q), undefined, false, SESSION),
  surface: swap && surface(swap, false),
});

const exhausted: CardQuestion = { ...CARD.unanswered, draft: { answers: {}, values: {}, read: { ...CARD.illegible.draft!.read!, takesLeft: 0 } } };

// The handed-in card as it stands the moment after hand-in, with method marks
// still on offer: the camera is offered until a page is read or the takes run out.
const handed = MARKED.marked;
const prior = { ...handed.prior!, justMarked: true, feedback: { ...handed.prior!.feedback, earnableByMethod: 3 } };
const take = prior.working![0];
const illegibleTake = { ...take, legible: false, lines: [], marked: false, method: [], slips: [] };
const illegibleWorking = (takesLeft: number) =>
  ({ ...prior.feedback.working!, transcription: { lines: [], answers: [], legible: false }, marked: false, method: [], slips: [], marksAdded: 0, takesLeft }) as typeof prior.feedback.working;
const handedIn = (state: string, q: CardQuestion, swap?: CaptureState): Shot => ({
  screen: 'question-card',
  state: `handed-in-${state}`,
  page: chromePage(renderMarked(q), undefined, false, SESSION),
  surface: swap && surface(swap, true),
});

export const GALLERY: Shot[] = [
  dashboard('lead-first', DASH.new),
  dashboard('lead-diagnostic', DASH['first-done']),
  dashboard('lead-session', returning),
  dashboard('lead-session-no-estimate', DASH['no-estimate']),
  dashboard('lead-resume', { ...returning, lead: 'resume', open: { id: 's9', answered: 2, questions: 5, marksLeft: 9 } }),
  dashboard('refusal-paywall', { ...returning, lead: 'paywall' }),
  dashboard('refusal-sitting-passed', { ...returning, lead: 'sitting-passed' }),
  dashboard('refusal-sitting-passed-none', { ...returning, lead: 'sitting-passed', nextSitting: null }),
  dashboard('refusal-no-questions', { ...returning, lead: 'no-questions' }),
  dashboard('refusal-revoked', { ...returning, lead: 'revoked' }),
  dashboard('refusal-diagnostic-taken', { ...returning, error: 'diagnostic-taken' }),
  dashboard('refusal-first-taken', { ...returning, error: 'first-taken' }),
  dashboard('refusal-nothing-to-revisit', { ...returning, error: 'nothing-to-revisit' }),
  dashboard('refusal-no-questions-topic', { ...returning, error: 'no-questions', mode: 'topic' }),
  dashboard('refusal-no-topic', { ...returning, error: 'no-topic' }),

  card('unanswered-none', CARD.unanswered),
  card('unanswered-reading', CARD.unanswered, 'reading'),
  card('unanswered-read', CARD.read),
  card('unanswered-illegible', CARD.illegible),
  card('unanswered-failed', CARD.unanswered, 'failed'),
  card('unanswered-exhausted', exhausted),
  handedIn('none', { ...handed, prior: { ...prior, feedback: { ...prior.feedback, working: undefined }, working: [] } }),
  handedIn('reading', { ...handed, prior: { ...prior, feedback: { ...prior.feedback, working: undefined }, working: [] } }, 'reading'),
  handedIn('read', { ...handed, prior }),
  handedIn('illegible', { ...handed, prior: { ...prior, feedback: { ...prior.feedback, working: illegibleWorking(1) }, working: [illegibleTake] } }),
  handedIn('failed', { ...handed, prior: { ...prior, feedback: { ...prior.feedback, working: undefined }, working: [] } }, 'failed'),
  handedIn('exhausted', { ...handed, prior: { ...prior, feedback: { ...prior.feedback, working: illegibleWorking(0) }, working: [illegibleTake] } }),

  ...(Object.keys(MARKED) as (keyof typeof MARKED)[]).map((state) => ({ screen: 'marked-question', state, page: chromePage(renderMarked(MARKED[state]), undefined, false, SESSION) })),
  ...(Object.keys(DIAGNOSTIC) as (keyof typeof DIAGNOSTIC)[]).map((state) => ({ screen: 'diagnostic', state, page: chromePage(DIAGNOSTIC[state](), undefined, false, SESSION) })),
  ...Object.keys(SUMMARIES).map((state) => ({ screen: 'summary', state, page: chromePage(SUMMARIES[state](), undefined, false, SESSION) })),
  ...(Object.keys(WELCOME) as (keyof typeof WELCOME)[]).map((state) => ({ screen: 'welcome', state, page: bodyPage(renderWelcome(WELCOME[state])) })),
  ...Object.keys(AUTH).map((state) => ({ screen: 'auth', state, page: bodyPage(renderAuth(state)) })),
  // A read failure is a state of the card, so it is photographed there.
  ...Object.entries({ 'read-failed': 'We could not read that photo. Nothing has changed.', 'read-too-large': 'That photo is too large. Try again in better light.', 'read-limited': TOO_MANY }).map(
    ([state, message]) => ({ screen: 'failure', state, page: chromePage(renderBar(CARD.unanswered) + renderCard(CARD.unanswered), undefined, false, SESSION), surface: surface('failed', false, message) }),
  ),
  ...['not-found', 'broken'].map((state) => ({ screen: 'failure', state, page: bodyPage(FAILURES[state]()) })),
  { screen: 'history', state: 'populated', page: chromePage(renderHistory(), undefined, false, '/study/history') },
  { screen: 'history', state: 'empty', page: chromePage(renderHistory({ rows: [], lostMarks: 0 }), undefined, false, '/study/history') },
  { screen: 'progress', state: 'populated', page: chromePage(renderProgress(), undefined, false, '/study/progress') },
  {
    screen: 'progress',
    state: 'empty',
    page: chromePage(
      renderProgress({
        estimable: false,
        modules: PROGRESS.modules.map((m) => ({ ...m, letter: null, strength: 0, topics: m.topics.map((t) => ({ ...t, band: 'NOT_STARTED' as const, mastery: 0 })) })),
        weakest: null,
      }),
      undefined,
      false,
      '/study/progress',
    ),
  },
];

export const WIDTHS = [390, 1280] as const;
export const shotName = (s: Shot, width: number) => `${s.screen}--${s.state}--${width}`;
