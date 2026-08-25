import type { ExamSitting } from '@/lib/types';

/**
 * THE SITTINGS, AND WHEN EACH ONE IS OVER.
 *
 * One definition for both things we do with a sitting date: count down to the
 * paper, and end access after it. They were about to be two — trajectory.ts
 * already held the paper dates — and two sources for the same fact is how a
 * countdown and a paywall come to disagree about when an exam is.
 *
 * `paper` is the date to count down to. `ends` is the last day of the sitting
 * WINDOW, deliberately the end of the month rather than a specific paper date:
 * CXC sits several papers across a period, timetables move, and a student
 * revising for a paper on the 24th should not lose access on the 11th. The
 * grace period on top means this never needs to be precise.
 */
export const SITTINGS: Record<ExamSitting, { label: string; paper: Date; ends: Date }> = {
  'jan-2027': {
    label: 'January 2027 re-sit',
    paper: new Date('2027-01-11T00:00:00Z'),
    ends: new Date('2027-01-31T23:59:59Z'),
  },
  'may-june-2027': {
    label: 'May/June 2027',
    paper: new Date('2027-06-01T00:00:00Z'),
    ends: new Date('2027-06-30T23:59:59Z'),
  },
};

/**
 * How long access outlives the sitting it was bought for. A student sitting the
 * last paper of the period should not find the app closed the next morning —
 * results are not out, and a re-sit decision has not been made.
 */
export const GRACE_DAYS = 30;

/** The sitting's label, for a student who needs telling which one theirs was. */
export function sittingLabel(sitting: string): string | null {
  return SITTINGS[sitting as ExamSitting]?.label ?? null;
}

/** When access bought for this sitting stops working. */
export function accessEndsAt(sitting: string): Date | null {
  const s = SITTINGS[sitting as ExamSitting];
  if (!s) return null;
  return new Date(s.ends.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
}
