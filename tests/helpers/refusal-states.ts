import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DashboardView } from '@/app/study/dashboard';
import QuestionCard from '@/app/study/session/[id]/question-card';
import { WorkingPhoto } from '@/app/study/session/[id]/working-photo';
import { STATES as DASH } from './dashboard-states';
import { MARKED } from './marked-states';
import { STATES as CARD } from './card-states';
export { visibleText } from './card-states';

/** The refusal panel alone, out of the surface that renders it. */
export function panel(html: string, id: string): string {
  const m = new RegExp(`<section data-refusal="${id}"[\\s\\S]*?<\\/section>`).exec(html);
  if (!m) throw new Error(`no refusal ${id}`);
  return m[0];
}

const dash = (error: string, mode?: string) => renderToStaticMarkup(createElement(DashboardView, { ...DASH.returning, error, mode }));

export const REFUSALS: Record<string, () => string> = {
  paywall: () => panel(dash('needs-access'), 'paywall'),
  'sitting-passed': () => panel(dash('access-expired'), 'sitting-passed'),
  'no-retakes': () =>
    panel(
      renderToStaticMarkup(
        createElement(WorkingPhoto, { sessionId: 's1', questionIndex: 1, initial: { ...CARD.read.draft!.read!, takesLeft: 0 } }),
      ),
      'no-retakes',
    ),
  'nothing-to-revisit': () => panel(dash('nothing-to-revisit'), 'nothing-to-revisit'),
  'handed-in': () => panel(renderToStaticMarkup(createElement(QuestionCard, { question: MARKED.marked })), 'handed-in'),
  'diagnostic-taken': () => panel(dash('diagnostic-taken'), 'diagnostic-taken'),
  'first-taken': () => panel(dash('first-taken'), 'first-taken'),
  'no-questions': () => panel(dash('no-questions'), 'no-questions'),
  'no-questions-topic': () => panel(dash('no-questions', 'topic'), 'no-questions-topic'),
  'no-topic': () => panel(dash('no-topic'), 'no-topic'),
};
