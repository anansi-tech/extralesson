import { describe, expect, it } from 'vitest';
import { captureState, retakesLeft, type Take } from '@/app/study/session/[id]/capture-state';

// One state for the photograph, as a table: takes so far, the limit, whether
// a read is in flight — and the one state every surface renders from.
const ok: Take = { legible: true };
const bad: Take = { legible: false };
const err: Take = { legible: false, failed: true };

describe('captureState', () => {
  it.each<[string, Take[], number, boolean, string]>([
    ['nothing yet', [], 2, false, 'none'],
    ['a read in flight', [], 2, true, 'reading'],
    ['a read in flight after a take', [ok], 2, true, 'reading'],
    ['a legible first take', [ok], 2, false, 'read'],
    ['a legible last take', [bad, ok], 2, false, 'read'],
    ['an illegible take with one left', [bad], 2, false, 'illegible'],
    ['a failed take with one left', [err], 2, false, 'failed'],
    ['an illegible take that was the last take', [ok, bad], 2, false, 'exhausted'],
    ['a failed take that was the last take', [bad, err], 2, false, 'exhausted'],
    ['two unusable takes', [bad, bad], 2, false, 'exhausted'],
    ['a legible take at a limit of one', [ok], 1, false, 'read'],
    ['an illegible take at a limit of one', [bad], 1, false, 'exhausted'],
  ])('%s → %s', (_name, takes, limit, pending, state) => {
    expect(captureState(takes, limit, pending)).toBe(state);
  });

  it('counts the takes left, never below zero', () => {
    expect(retakesLeft([], 2)).toBe(2);
    expect(retakesLeft([ok], 2)).toBe(1);
    expect(retakesLeft([ok, bad], 2)).toBe(0);
    expect(retakesLeft([ok, bad, err], 2)).toBe(0);
  });
});
