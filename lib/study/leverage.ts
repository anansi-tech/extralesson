import type { OverallGrade } from '@/lib/grade/predict';
import type { StudyState, TopicState } from './state';

// Lead with what is REACHABLE and keep the current estimate honest but
// secondary: a new student's U · U · U is accurate and still demotivating.
// Everything here folds over stored attempts.

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
      // An unseen topic is unknown, and unknown is high-leverage: the whole
      // of its share is still on the table (ROUND_6 Task 6).
      const deficit = t.band === 'NOT_STARTED' ? 1 : 1 - t.mastery;
      return {
        code: t.code,
        title: t.title,
        module: t.module,
        mastery: t.mastery,
        pointsAvailable: deficit * shareOfModule * 80 / moduleCount,
      };
    })
    .sort((a, b) => b.pointsAvailable - a.pointsAvailable);
}

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
