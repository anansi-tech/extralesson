import { describe, expect, it } from 'vitest';
import { shouldLeadWithReachable } from '@/lib/study/lead-panel';

const warm = {
  hasAnyAttempt: true,
  reachableCount: 3,
  estimable: false,
  overallPercent: 0,
};

// "WHERE YOUR MARKS ARE" IS A CLAIM ABOUT THE STUDENT (ROUND_3, defect 2).
//
// On a cold account it was not one. pointsAvailable is
// (1 - mastery) * shareOfModule * 80 / moduleCount, so with no attempts every
// mastery is equal and the ranking collapses to blueprint weight — the same
// three topics for everybody, under a heading that says "your", naming topics
// the M1 gate blocks, above an estimate reading "Not yet estimated".
describe('shouldLeadWithReachable', () => {
  it('does not lead on an account with no attempts', () => {
    expect(shouldLeadWithReachable({ ...warm, hasAnyAttempt: false })).toBe(false);
  });

  it('leads once there is a single attempt behind the ranking', () => {
    expect(shouldLeadWithReachable(warm)).toBe(true);
  });

  it('no-attempts beats every other reason to lead', () => {
    // Even a low estimate and a full topic list do not bring it back: the
    // objection is that the ranking is not the student's, not that it is grim.
    expect(
      shouldLeadWithReachable({
        hasAnyAttempt: false,
        reachableCount: 3,
        estimable: true,
        overallPercent: 12,
      }),
    ).toBe(false);
  });

  it('does not lead with an empty list, whatever the estimate says', () => {
    expect(shouldLeadWithReachable({ ...warm, reachableCount: 0 })).toBe(false);
    expect(
      shouldLeadWithReachable({ ...warm, reachableCount: 0, estimable: true, overallPercent: 10 }),
    ).toBe(false);
  });

  it('leads when there is no estimate yet — the case it was written for', () => {
    expect(shouldLeadWithReachable({ ...warm, estimable: false })).toBe(true);
  });

  it('leads when the estimate is below a pass, and stops once it is not', () => {
    expect(shouldLeadWithReachable({ ...warm, estimable: true, overallPercent: 49 })).toBe(true);
    expect(shouldLeadWithReachable({ ...warm, estimable: true, overallPercent: 50 })).toBe(false);
    expect(shouldLeadWithReachable({ ...warm, estimable: true, overallPercent: 80 })).toBe(false);
  });
});
