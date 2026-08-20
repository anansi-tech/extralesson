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

export const MIN_SESSIONS_FOR_TRAJECTORY = 2;

export function gradeFor(percent: number): OverallGrade {
  if (percent >= 75) return 'I';
  if (percent >= 65) return 'II';
  if (percent >= 50) return 'III';
  if (percent >= 35) return 'IV';
  if (percent >= 20) return 'V';
  return 'VI';
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
export function projectTrajectory(args: {
  percentNow: number;
  percentBefore: number;
  sessionsBetween: number;
  firstSessionAt: Date;
  now: Date;
  examDate: Date;
}): Trajectory | null {
  const { percentNow, percentBefore, sessionsBetween, firstSessionAt, now, examDate } = args;
  if (sessionsBetween < MIN_SESSIONS_FOR_TRAJECTORY) return null;

  const perSession = (percentNow - percentBefore) / sessionsBetween;
  const daysStudying = Math.max(1, (now.getTime() - firstSessionAt.getTime()) / 86_400_000);
  const sessionsPerWeek = (sessionsBetween / daysStudying) * 7;
  const weeksToExam = Math.max(0, (examDate.getTime() - now.getTime()) / (7 * 86_400_000));

  const gain = perSession * sessionsPerWeek * weeksToExam;
  // A rate that is flat or falling projects to where they already are. We do
  // not extrapolate a decline into a worse grade either: the honest statement
  // is that the estimate has not moved, and that is what `flat` says.
  const projectedPercent = Math.min(100, Math.max(percentNow, percentNow + gain));
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
