import { SITTINGS } from '@/lib/sittings';
import type { ExamSitting } from '@/lib/types';
import type { OverallGrade } from '@/lib/grade/predict';
import type { StudyState, TopicState } from './state';

// Lead with what is REACHABLE and keep the current estimate honest but
// secondary: a new student's U · U · U is accurate and still demotivating.
// Everything here folds over stored attempts, and where the data does not
// support a projection this says so rather than guessing.

export interface Leverage {
  code: string;
  title: string;
  module: 1 | 2 | 3;
  mastery: number;
  /** Percentage points on the overall estimate if this topic reached full marks. */
  pointsAvailable: number;
}

// A module contributes mastery x 80 of 100 weighted marks (predict.ts) and the
// overall estimate is the mean of the modules — so leverage is blueprint weight
// within the module, times mastery left, times 80, over the modules studied.
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

// A rate needs enough sessions AND enough days behind it: two sessions in one
// afternoon read as fourteen a week, which projects a first-day student to
// Grade I at full marks.
export const MIN_SESSIONS_FOR_TRAJECTORY = 4;
export const MIN_DAYS_FOR_TRAJECTORY = 10;

/** Nobody sustains more than one session a day for a school year. */
export const MAX_SESSIONS_PER_WEEK = 7;

// One table, used both to grade and to find the next band up, so the two can
// never disagree.
const BANDS: { grade: OverallGrade; from: number }[] = [
  { grade: 'I', from: 75 },
  { grade: 'II', from: 65 },
  { grade: 'III', from: 50 },
  { grade: 'IV', from: 35 },
  { grade: 'V', from: 20 },
  { grade: 'VI', from: 0 },
];

// CXC grades are Roman numerals and a numeral alone is ambiguous: "on track
// for I" reads as "on track for 1", the opposite end of the scale. The word
// "Grade" goes in front of it everywhere.
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
 * The next band's threshold, or 100 at the top. The projection is capped here
 * because early evidence supports a claim about DIRECTION, not a destination
 * nine months away. The cap rises with them.
 */
export function nextBandEntry(percent: number): number {
  const above = [...BANDS].reverse().find((b) => b.from > percent);
  return above ? above.from : 100;
}

/**
 * A rate is work over time, so both halves matter: sixteen sessions crammed
 * into two days says nothing about a week. Read from the constants the gate
 * reads, so the two cannot drift.
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

  // DIMINISHING RETURNS: the measured gain is the share of the headroom it
  // closed, applied to the headroom left, so a rate earned climbing out of
  // nothing is not extrapolated straight through the ceiling.
  const headroomBefore = Math.max(1e-9, 100 - percentBefore);
  const sharePerSession = Math.max(0, Math.min(1, perSession / headroomBefore));
  const closed = 1 - Math.pow(1 - sharePerSession, sessionsLeft);
  const damped = percentNow + (100 - percentNow) * closed;

  // A rate that is flat or falling projects to where they already are; a
  // decline is not extrapolated into a worse grade either.
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

export function examDateFor(sitting: string): Date {
  // One definition, shared with the access expiry — a countdown and a paywall
  // must not disagree about when the exam is.
  return (SITTINGS[sitting as ExamSitting] ?? SITTINGS['may-june-2027']).paper;
}
