/** One take of the page: whether it could be read, and whether the attempt failed outright. */
export interface Take {
  legible: boolean;
  failed?: boolean;
}

export type CaptureState = 'none' | 'reading' | 'read' | 'illegible' | 'failed' | 'exhausted';

/**
 * THE ONE STATE OF THE PHOTOGRAPH. Every surface that shows the page — the
 * camera box, the card around it, the look-back — asks this and nothing else.
 * The last take decides: a legible read is `read` however many takes it took;
 * an unusable last take is `illegible` or `failed` while a take remains, and
 * `exhausted` once the last take allowed has been spent on it.
 */
export function captureState(takes: Take[], limit: number, pending: boolean): CaptureState {
  if (pending) return 'reading';
  const last = takes[takes.length - 1];
  if (!last) return 'none';
  if (last.legible && !last.failed) return 'read';
  if (takes.length >= limit) return 'exhausted';
  return last.failed ? 'failed' : 'illegible';
}

/** Takes still allowed, never below zero. */
export function retakesLeft(takes: Take[], limit: number): number {
  return Math.max(0, limit - takes.length);
}
