import { describe, expect, it } from 'vitest';
import {
  MIN_DAYS_FOR_TRAJECTORY,
  MIN_SESSIONS_FOR_TRAJECTORY,
  trajectoryGap,
} from '@/lib/study/trajectory';


// A rate is work over time, so the gate needs sessions AND elapsed days. The
// card asked for "a couple more sessions" whatever was short, so a student with
// sixteen sessions across a single day was told to do the one thing they had
// already done — and would have been told it again every visit.
describe('trajectoryGap — what is actually missing', () => {
  const day = 86_400_000;

  it('names the days when the sessions are already there', () => {
    const gap = trajectoryGap({
      sessionsBetween: 15,
      firstSessionAt: new Date(Date.now() - 0.8 * day),
      now: new Date(),
    });
    expect(gap).toEqual({ sessionsShort: 0, daysShort: 10 });
  });

  it('names the sessions when the days are already there', () => {
    const gap = trajectoryGap({
      sessionsBetween: 1,
      firstSessionAt: new Date(Date.now() - 30 * day),
      now: new Date(),
    });
    expect(gap).toEqual({ sessionsShort: 3, daysShort: 0 });
  });

  it('names both when both are short, and nothing once the gate is met', () => {
    expect(trajectoryGap({ sessionsBetween: 0, firstSessionAt: null, now: new Date() })).toEqual({
      sessionsShort: MIN_SESSIONS_FOR_TRAJECTORY,
      daysShort: MIN_DAYS_FOR_TRAJECTORY,
    });
    expect(
      trajectoryGap({
        sessionsBetween: 12,
        firstSessionAt: new Date(Date.now() - 20 * day),
        now: new Date(),
      }),
    ).toBe(null);
  });
});
