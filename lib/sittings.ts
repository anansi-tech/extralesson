import type { ExamSitting } from '@/lib/types';

/**
 * THE SITTINGS, AND WHEN EACH ONE IS OVER. One definition for the countdown and
 * for ending access, so the two cannot disagree. `ends` is the last day of the
 * sitting WINDOW, not a paper date: CXC sits several papers and timetables move.
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

export function sittingLabel(sitting: string): string | null {
  return SITTINGS[sitting as ExamSitting]?.label ?? null;
}

export function accessEndsAt(sitting: string): Date | null {
  const s = SITTINGS[sitting as ExamSitting];
  if (!s) return null;
  return new Date(s.ends.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
}

/** The sittings still to be sat, soonest first. */
export function sittingsOpenAt(now: Date): ExamSitting[] {
  return (Object.keys(SITTINGS) as ExamSitting[])
    .filter((s) => SITTINGS[s].ends.getTime() > now.getTime())
    .sort((a, b) => SITTINGS[a].ends.getTime() - SITTINGS[b].ends.getTime());
}
