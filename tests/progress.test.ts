import { describe, expect, it } from 'vitest';
import { streakFrom } from '@/lib/study/progress';
import { gradeLabel, gradePlace } from '@/lib/study/leverage';

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
