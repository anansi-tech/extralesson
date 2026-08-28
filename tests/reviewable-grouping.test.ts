import { describe, expect, it } from 'vitest';
import { groupReviewableByDay, type ReviewableQuestion } from '@/lib/study/reviewable';

// GROUPED BY DAY, NOT BY SESSION.
//
// A session holds one or two questions, so a heading per session is a heading
// per question and the list gets longer. Measured on the live bank: the
// heaviest user has 30 questions across 29 sessions but only 5 days.

const q = (ts: string, earned: number, marks: number, index = 0): ReviewableQuestion => ({
  sessionId: `s${index}`,
  index,
  earned,
  marks,
  photographed: false,
  ts: new Date(ts),
  objectiveIds: ['M1.5.1'],
});

describe('grouping the look-back list', () => {
  it('puts several sessions from one day under one heading', () => {
    const days = groupReviewableByDay([
      q('2026-08-27T18:00:00', 3, 4, 0),
      q('2026-08-27T09:00:00', 2, 5, 1),
      q('2026-08-25T10:00:00', 1, 3, 2),
    ]);
    expect(days).toHaveLength(2);
    expect(days[0].questions).toHaveLength(2);
    expect(days[1].questions).toHaveLength(1);
  });

  it('puts the most recent day first, which is the one left open', () => {
    const days = groupReviewableByDay([
      q('2026-08-20T10:00:00', 1, 2, 0),
      q('2026-08-27T10:00:00', 1, 2, 1),
      q('2026-08-24T10:00:00', 1, 2, 2),
    ]);
    expect(days.map((d) => d.day)).toEqual(['2026-08-27', '2026-08-24', '2026-08-20']);
  });

  it('totals the day, so a collapsed heading still says what it holds', () => {
    const days = groupReviewableByDay([
      q('2026-08-27T18:00:00', 3, 4, 0),
      q('2026-08-27T09:00:00', 2, 5, 1),
    ]);
    expect(days[0].earned).toBe(5);
    expect(days[0].marks).toBe(9);
  });

  it('keeps every question — collapsing hides rows, it does not drop them', () => {
    const rows = [
      q('2026-08-27T18:00:00', 1, 2, 0),
      q('2026-08-27T09:00:00', 1, 2, 1),
      q('2026-08-25T10:00:00', 1, 2, 2),
      q('2026-08-01T10:00:00', 1, 2, 3),
    ];
    const days = groupReviewableByDay(rows);
    expect(days.flatMap((d) => d.questions)).toHaveLength(rows.length);
  });

  it('has nothing to group when nothing has been answered', () => {
    expect(groupReviewableByDay([])).toEqual([]);
  });

  it('reads the day in local time, so a late-evening session is not tomorrow', () => {
    // 23:30 local must stay on its own date, whatever UTC makes of it.
    const days = groupReviewableByDay([q('2026-08-27T23:30:00', 1, 2, 0)]);
    expect(days[0].day).toBe('2026-08-27');
  });
});
