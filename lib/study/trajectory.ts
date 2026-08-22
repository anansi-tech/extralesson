import type { OverallGrade } from '@/lib/grade/predict';
import type { StudyState, TopicState } from './state';

// WHAT IS REACHABLE, measured — never assumed.
//
// A new student's arithmetic is U · U · U and an overall VI, and it is correct:
// at 10% mastery that is what the marks say. Every student sees it for their
// first weeks, and a January re-sit candidate who has just failed sees the app
// agreeing with the result they came here to change. Accurate and demotivating
// is still demotivating.
//
// The fix is not to soften the estimate. It is to lead with the part of the
// picture that is about the future — where the marks actually are, and where
// this rate of work arrives — and keep the current estimate honest and
// secondary. Everything here comes out of the attempt history we already store;
// nothing is invented, and where the data does not support a projection this
// says so rather than guessing.

/** A topic ranked by how much of the estimate is still sitting in it. */
export interface Leverage {
  code: string;
  title: string;
  module: 1 | 2 | 3;
  mastery: number;
  /** Percentage points on the overall estimate if this topic reached full marks. */
  pointsAvailable: number;
}

// Module contribution is mastery x 80 of 100 weighted marks (predict.ts), and
// the overall estimate is the mean of the modules — so a topic's leverage is
// its blueprint weight inside its module, times the mastery it has left, times
// 80, divided across the modules being studied.
export function topicLeverage(state: StudyState, targetModules: number[]): Leverage[] {
  const moduleCount = Math.max(1, targetModules.length);
  const weightTotals = new Map<number, number>();
  for (const t of state.topics) {
    const w = state.topicWeightByPrefix.get(`M${t.module}.${t.order}.`) ?? 0;
    weightTotals.set(t.module, (weightTotals.get(t.module) ?? 0) + w);
  }
  return state.topics
    .filter((t) => targetModules.includes(t.module))
    .map((t: TopicState) => {
      const w = state.topicWeightByPrefix.get(`M${t.module}.${t.order}.`) ?? 0;
      const shareOfModule = w / Math.max(1e-9, weightTotals.get(t.module) ?? 1);
      return {
        code: t.code,
        title: t.title,
        module: t.module,
        mastery: t.mastery,
        pointsAvailable: (1 - t.mastery) * shareOfModule * 80 / moduleCount,
      };
    })
    .sort((a, b) => b.pointsAvailable - a.pointsAvailable);
}

export interface Trajectory {
  /** Percentage points the estimate moved per completed session, measured. */
  perSession: number;
  sessionsMeasured: number;
  /** Sessions per week so far — the cadence the projection assumes continues. */
  sessionsPerWeek: number;
  weeksToExam: number;
  projectedPercent: number;
  projectedGrade: OverallGrade;
  /** True when the rate is flat or falling, so the projection is not a promise. */
  flat: boolean;
}

// A rate needs enough sessions AND enough days behind it. Two sessions on one
// afternoon read as fourteen sessions a week, which projected a student from
// their first day to Grade I at full marks — the same invented optimism as
// extrapolating a flat rate, arriving by a different route.
export const MIN_SESSIONS_FOR_TRAJECTORY = 4;
export const MIN_DAYS_FOR_TRAJECTORY = 10;

/** Nobody sustains more than one session a day for a school year. */
export const MAX_SESSIONS_PER_WEEK = 7;

// The six-point scale, highest first. One table, used to grade and to find the
// next band up, so the two can never disagree.
const BANDS: { grade: OverallGrade; from: number }[] = [
  { grade: 'I', from: 75 },
  { grade: 'II', from: 65 },
  { grade: 'III', from: 50 },
  { grade: 'IV', from: 35 },
  { grade: 'V', from: 20 },
  { grade: 'VI', from: 0 },
];

// CXC grades are Roman numerals, and a numeral alone is ambiguous: "on track
// for I" reads as "on track for 1", which is the opposite end of the scale from
// what a student assumes. The word "Grade" goes in front of it everywhere, and
// where a grade first appears on a page it says where on the scale it sits.
export function gradeLabel(grade: OverallGrade): string {
  return `Grade ${grade}`;
}

const PLACE: Record<OverallGrade, string> = {
  I: 'the highest of the six',
  II: 'second of the six',
  III: 'third of the six',
  IV: 'fourth of the six',
  V: 'fifth of the six',
  VI: 'the lowest of the six',
};

export function gradePlace(grade: OverallGrade): string {
  return PLACE[grade];
}

export function gradeFor(percent: number): OverallGrade {
  return (BANDS.find((b) => percent >= b.from) ?? BANDS[BANDS.length - 1]).grade;
}

/**
 * The percentage that would earn the next grade up, or 100 at the top.
 *
 * The projection is capped here on purpose. Early evidence supports a claim
 * about DIRECTION, not about a destination nine months away, and the next band
 * is the honest form of that claim — it is also the one a student can act on.
 * The cap rises with them: reach it, and the next band becomes the new one.
 */
export function nextBandEntry(percent: number): number {
  const above = [...BANDS].reverse().find((b) => b.from > percent);
  return above ? above.from : 100;
}

/**
 * Where this rate of work arrives by the exam.
 *
 * Both inputs are measured: how much the estimate moved over the sessions we
 * have, and how often those sessions happened. Returns null below two completed
 * sessions, because one session is a starting point and not a rate — and a
 * projection off one session would be exactly the invented optimism this is
 * meant to avoid.
 */
/**
 * WHAT IS STILL MISSING BEFORE A RATE CAN BE PROJECTED.
 *
 * The gate below needs BOTH enough sessions and enough elapsed days: a rate is
 * work over time, and sixteen sessions crammed into two days says nothing about
 * how much gets done in a week. The card used to ask for "a couple more
 * sessions" whatever was actually short, so a student with sixteen sessions
 * across three days was told to do something they had already done, and would
 * have been told it again every visit.
 *
 * Read from the same two constants the gate reads, so the two cannot drift.
 */
export interface TrajectoryGap {
  /** Sessions still needed, 0 when that half is satisfied. */
  sessionsShort: number;
  /** Whole days still needed, 0 when that half is satisfied. */
  daysShort: number;
}

export function trajectoryGap(args: {
  sessionsBetween: number;
  firstSessionAt: Date | null;
  now: Date;
}): TrajectoryGap | null {
  const { sessionsBetween, firstSessionAt, now } = args;
  if (!firstSessionAt) {
    return { sessionsShort: MIN_SESSIONS_FOR_TRAJECTORY, daysShort: MIN_DAYS_FOR_TRAJECTORY };
  }
  const daysStudying = (now.getTime() - firstSessionAt.getTime()) / 86_400_000;
  const gap = {
    sessionsShort: Math.max(0, MIN_SESSIONS_FOR_TRAJECTORY - sessionsBetween),
    daysShort: Math.max(0, Math.ceil(MIN_DAYS_FOR_TRAJECTORY - daysStudying)),
  };
  return gap.sessionsShort === 0 && gap.daysShort === 0 ? null : gap;
}

export function projectTrajectory(args: {
  percentNow: number;
  percentBefore: number;
  sessionsBetween: number;
  firstSessionAt: Date;
  now: Date;
  examDate: Date;
}): Trajectory | null {
  const { percentNow, percentBefore, sessionsBetween, firstSessionAt, now, examDate } = args;
  const daysStudying = (now.getTime() - firstSessionAt.getTime()) / 86_400_000;
  if (sessionsBetween < MIN_SESSIONS_FOR_TRAJECTORY) return null;
  if (daysStudying < MIN_DAYS_FOR_TRAJECTORY) return null;

  const perSession = (percentNow - percentBefore) / sessionsBetween;
  const sessionsPerWeek = Math.min(MAX_SESSIONS_PER_WEEK, (sessionsBetween / daysStudying) * 7);
  const weeksToExam = Math.max(0, (examDate.getTime() - now.getTime()) / (7 * 86_400_000));
  const sessionsLeft = sessionsPerWeek * weeksToExam;

  // DIMINISHING RETURNS. The measured gain is expressed as the share of the
  // headroom it closed, and applied to the headroom that is left — so a rate
  // earned climbing out of nothing is not extrapolated straight through the
  // ceiling. Going from 0% to 25% is a quarter of the way to full marks; the
  // next quarter of what remains is a smaller number of points, as it is in
  // practice.
  const headroomBefore = Math.max(1e-9, 100 - percentBefore);
  const sharePerSession = Math.max(0, Math.min(1, perSession / headroomBefore));
  const closed = 1 - Math.pow(1 - sharePerSession, sessionsLeft);
  const damped = percentNow + (100 - percentNow) * closed;

  // A rate that is flat or falling projects to where they already are. We do
  // not extrapolate a decline into a worse grade either: the honest statement
  // is that the estimate has not moved, and that is what `flat` says.
  const projectedPercent = Math.min(
    100,
    nextBandEntry(percentNow),
    Math.max(percentNow, damped),
  );
  return {
    perSession,
    sessionsMeasured: sessionsBetween,
    sessionsPerWeek,
    weeksToExam,
    projectedPercent,
    projectedGrade: gradeFor(projectedPercent),
    flat: perSession <= 0,
  };
}

/** The sitting a student is entered for, as a date to count down to. */
export function examDateFor(sitting: string): Date {
  // CXC sits the January paper in early January and May/June in early June.
  return sitting === 'jan-2027' ? new Date('2027-01-11') : new Date('2027-06-01');
}
