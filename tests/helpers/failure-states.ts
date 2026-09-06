import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CaptureFailure } from '@/app/study/session/[id]/working-photo';
import NotFound from '@/app/not-found';
import ErrorPage from '@/app/error';
import { TOO_MANY } from '@/lib/auth/rate-limit';
export { visibleText } from './card-states';

// The four failures of Refusals.dc.html §09, as the app renders them.
const noop = () => {};
export const FAILURES: Record<string, () => string> = {
  'read-failed': () => renderToStaticMarkup(createElement(CaptureFailure, { message: 'We could not read that photo. Nothing has changed.', onRetake: noop })),
  'read-too-large': () => renderToStaticMarkup(createElement(CaptureFailure, { message: 'That photo is too large. Try again in better light.', onRetake: noop })),
  'read-limited': () => renderToStaticMarkup(createElement(CaptureFailure, { message: TOO_MANY, onRetake: noop })),
  'not-found': () => renderToStaticMarkup(createElement(NotFound)),
  broken: () => renderToStaticMarkup(createElement(ErrorPage, { error: Object.assign(new Error('boom'), { digest: 'abc123' }), reset: noop })),
};
