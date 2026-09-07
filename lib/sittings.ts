import type { ExamSitting } from '@/lib/types';

/**
 * THE SITTINGS, AND WHEN EACH ONE IS OVER. One definition for the countdown and
 * for ending access, so the two cannot disagree. `ends` is the last day of the
 * sitting WINDOW, not a paper date: CXC sits several papers and timetables move.
 * Every list of sittings in the app — the type, the schema enums, the forms'
 * options, the door to the next sitting — is read from this table, in order.
 *
 * From 2028 on the rows are CXC's usual calendar, PROVISIONAL until CXC
 * publishes the year's dates: January papers from the second week of January,
 * May/June papers from the start of May, each window ending with its month.
 */
export const SITTINGS: Record<ExamSitting, { label: string; paper: Date; ends: Date }> = {
  'jan-2027': {
    label: 'January 2027',
    paper: new Date('2027-01-11T00:00:00Z'),
    ends: new Date('2027-01-31T23:59:59Z'),
  },
  'may-june-2027': {
    label: 'May/June 2027',
    paper: new Date('2027-06-01T00:00:00Z'),
    ends: new Date('2027-06-30T23:59:59Z'),
  },
  // provisional
  'jan-2028': { label: 'January 2028', paper: new Date('2028-01-10T00:00:00Z'), ends: new Date('2028-01-31T23:59:59Z') },
  // provisional
  'may-june-2028': { label: 'May/June 2028', paper: new Date('2028-05-01T00:00:00Z'), ends: new Date('2028-06-30T23:59:59Z') },
  // provisional
  'jan-2029': { label: 'January 2029', paper: new Date('2029-01-08T00:00:00Z'), ends: new Date('2029-01-31T23:59:59Z') },
  // provisional
  'may-june-2029': { label: 'May/June 2029', paper: new Date('2029-05-01T00:00:00Z'), ends: new Date('2029-06-30T23:59:59Z') },
  // provisional
  'jan-2030': { label: 'January 2030', paper: new Date('2030-01-07T00:00:00Z'), ends: new Date('2030-01-31T23:59:59Z') },
  // provisional
  'may-june-2030': { label: 'May/June 2030', paper: new Date('2030-05-01T00:00:00Z'), ends: new Date('2030-06-30T23:59:59Z') },
  // provisional
  'jan-2031': { label: 'January 2031', paper: new Date('2031-01-06T00:00:00Z'), ends: new Date('2031-01-31T23:59:59Z') },
  // provisional
  'may-june-2031': { label: 'May/June 2031', paper: new Date('2031-05-01T00:00:00Z'), ends: new Date('2031-06-30T23:59:59Z') },
};

/** The sittings in the table's order: the one list every enum and select reads. */
export const SITTING_IDS = Object.keys(SITTINGS) as [ExamSitting, ...ExamSitting[]];

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
  return SITTING_IDS.filter((s) => SITTINGS[s].ends.getTime() > now.getTime()).sort(
    (a, b) => SITTINGS[a].ends.getTime() - SITTINGS[b].ends.getTime(),
  );
}

/** The next sitting on the books, for the door after one has passed; none once the table runs out. */
export function nextSittingAt(now: Date): { value: ExamSitting; label: string } | null {
  const next = sittingsOpenAt(now)[0];
  return next ? { value: next, label: SITTINGS[next].label } : null;
}
