import { describe, expect, it } from 'vitest';
import { streakFrom } from '@/lib/study/progress';
import {
  MAX_SESSIONS_PER_WEEK,
  gradeFor,
  gradeLabel,
  gradePlace,
  nextBandEntry,
  projectTrajectory,
} from '@/lib/study/trajectory';

const day = (base: Date, back: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() - back);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

describe('streaks', () => {
  const now = new Date('2026-08-20T09:00:00');

  it('counts consecutive days back from today', () => {
    expect(streakFrom(new Set([0, 1, 2].map((n) => day(now, n))), now)).toBe(3);
  });

  it('does not break the streak before today\'s session is done', () => {
    // Counting from today alone reports 0 every morning to someone who has not
    // broken anything.
    expect(streakFrom(new Set([1, 2, 3].map((n) => day(now, n))), now)).toBe(3);
  });

  it('is broken by a missed day', () => {
    expect(streakFrom(new Set([0, 1, 3].map((n) => day(now, n))), now)).toBe(2);
    expect(streakFrom(new Set([2, 3].map((n) => day(now, n))), now)).toBe(0);
  });

  it('is zero with nothing done', () => {
    expect(streakFrom(new Set(), now)).toBe(0);
  });
});

describe('trajectory', () => {
  const base = {
    percentNow: 30,
    percentBefore: 20,
    sessionsBetween: 5,
    firstSessionAt: new Date('2026-08-01'),
    now: new Date('2026-08-21'),
    examDate: new Date('2027-06-01'),
  };

  it('projects from the measured rate and the measured cadence', () => {
    const t = projectTrajectory(base)!;
    expect(t.perSession).toBeCloseTo(2);
    expect(t.projectedPercent).toBeGreaterThan(base.percentNow);
    expect(t.flat).toBe(false);
  });

  it('says nothing at all off a single session', () => {
    // One session is a starting point, not a rate — projecting from it would be
    // exactly the invented optimism this is meant to avoid.
    expect(projectTrajectory({ ...base, sessionsBetween: 1 })).toBeNull();
  });

  it('says nothing off a burst of sessions in a day or two', () => {
    // The defect this replaced: two sessions on one afternoon read as fourteen
    // sessions a week and projected a first-day student to Grade I at 100%.
    const t = projectTrajectory({
      percentNow: 25,
      percentBefore: 0,
      sessionsBetween: 2,
      firstSessionAt: new Date('2026-08-19'),
      now: new Date('2026-08-20'),
      examDate: new Date('2027-06-01'),
    });
    expect(t).toBeNull();
  });

  it('never assumes more than one session a day', () => {
    const t = projectTrajectory({
      ...base,
      sessionsBetween: 40,
      firstSessionAt: new Date('2026-08-01'),
    })!;
    expect(t.sessionsPerWeek).toBeLessThanOrEqual(MAX_SESSIONS_PER_WEEK);
  });

  it('projects no further than the next grade up', () => {
    // Early evidence supports a claim about direction, not a destination nine
    // months out. The cap rises with them as they reach it.
    const t = projectTrajectory({ ...base, percentNow: 30, percentBefore: 5, sessionsBetween: 12 })!;
    expect(t.projectedPercent).toBeLessThanOrEqual(nextBandEntry(30));
    expect(t.projectedGrade).toBe('IV');
  });

  it('applies the measured rate to shrinking headroom, not in a straight line', () => {
    // 0 -> 25 closes a quarter of the gap; the next quarter of what is LEFT is
    // fewer points, as it is in practice.
    const t = projectTrajectory({
      percentNow: 25,
      percentBefore: 0,
      sessionsBetween: 6,
      firstSessionAt: new Date('2026-07-01'),
      now: new Date('2026-08-21'),
      examDate: new Date('2027-06-01'),
    })!;
    expect(t.projectedPercent).toBeGreaterThan(25);
    expect(t.projectedPercent).toBeLessThanOrEqual(35);
  });

  it('never projects a decline, and flags a flat rate as flat', () => {
    const t = projectTrajectory({ ...base, percentNow: 20, percentBefore: 30 })!;
    expect(t.flat).toBe(true);
    expect(t.projectedPercent).toBe(20);
  });

  it('cannot exceed full marks however long the run-up', () => {
    const t = projectTrajectory({ ...base, percentNow: 90, percentBefore: 10 })!;
    expect(t.projectedPercent).toBeLessThanOrEqual(100);
  });

  it('reads the six-point bands the way predict.ts does', () => {
    expect(gradeFor(80)).toBe('I');
    expect(gradeFor(50)).toBe('III');
    expect(gradeFor(10)).toBe('VI');
  });

  it('names the band above, and stops at the top', () => {
    expect(nextBandEntry(30)).toBe(35);
    expect(nextBandEntry(66)).toBe(75);
    expect(nextBandEntry(80)).toBe(100);
  });
});

describe('grades read as grades, not as numbers', () => {
  it('never renders a bare numeral', () => {
    // "on track for I" reads as "on track for 1", which is the wrong end of
    // the scale from what a student assumes.
    expect(gradeLabel('I')).toBe('Grade I');
    expect(gradeLabel('VI')).toBe('Grade VI');
  });

  it('says where on the scale each grade sits', () => {
    expect(gradePlace('I')).toContain('highest');
    expect(gradePlace('VI')).toContain('lowest');
    expect(gradePlace('III')).toContain('third');
  });
});
