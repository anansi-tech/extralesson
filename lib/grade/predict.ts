// Predicted outcome (ROUND_1 §6.6): honest arithmetic, no ML, and every figure
// is an ESTIMATE the UI must label as one. The estimate is built from the
// marks we can assess and nothing else; what we cannot assess is never
// extrapolated across, and is not a number here (ROUND_6 Task 6).

import { MIN_MARKS_FOR_PREDICTION } from '@/lib/mastery/config';

// ASSUMED. The module letter and overall grade cut-offs below, and the 60%
// project carry-over, are our own working assumptions: CXC publishes no cut
// scores, and none of these has been checked against a real result yet.
export const PROJECT_NEUTRAL_FRACTION = 0.6;

const P1_WEIGHT = 30;
const P2_WEIGHT = 50;
const PROJECT_WEIGHT = 20;

export type ModuleLetter = 'A' | 'B' | 'C' | 'U';
export type OverallGrade = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

export interface ModulePrediction {
  module: 1 | 2 | 3;
  mastery: number; // blueprint-weighted module mastery 0..1
  p1_estimate: number; // of 30
  p2_estimate: number; // of 50
  project_assumed: number; // Paper 3 project, of 20 — always the neutral assumption
  total_estimate: number; // of 100
  /** null until there is enough work to estimate from — see predictOverall. */
  letter: ModuleLetter | null;
  /** Assessed marks behind this module's estimate; the gate is per module (ROUND_6 Task 5). */
  marks_seen: number;
}

export function predictModule(module: 1 | 2 | 3, mastery: number): ModulePrediction {
  const m = Math.min(1, Math.max(0, mastery));
  const p1 = m * P1_WEIGHT;
  const p2 = m * P2_WEIGHT;
  const project = PROJECT_NEUTRAL_FRACTION * PROJECT_WEIGHT;
  const total = p1 + p2 + project;
  let letter: ModuleLetter;
  if (total >= 75) letter = 'A';
  else if (total >= 60) letter = 'B';
  else if (total >= 45) letter = 'C';
  else letter = 'U';
  return {
    module,
    mastery: m,
    p1_estimate: round1(p1),
    p2_estimate: round1(p2),
    project_assumed: round1(project),
    total_estimate: round1(total),
    letter,
    marks_seen: 0,
  };
}

export interface OverallPrediction {
  modules: ModulePrediction[];
  overall_percent: number; // mean of module totals
  /**
   * Null when the student has not done enough work: printing "U" or "VI" at
   * someone who has answered nothing is a verdict we have not earned. Every
   * surface must decide what to show instead.
   */
  overall_grade: OverallGrade | null;
  /** Assessed marks this rests on, and whether EVERY module had enough (§2; ROUND_6 Task 5). */
  marks_attempted: number;
  estimable: boolean;
}

// Modules combine with equal weight: each is 100 weighted marks of the 300
// total, Assessment Grid A. The claim needs MIN_MARKS_FOR_PREDICTION assessed
// in EVERY module: one module's evidence says nothing about another's.
export function predictOverall(
  modules: ModulePrediction[],
  marksSeen: Partial<Record<1 | 2 | 3, number>> | number,
): OverallPrediction {
  const seenOf = (m: 1 | 2 | 3) => (typeof marksSeen === 'number' ? marksSeen : (marksSeen[m] ?? 0));
  const withSeen = modules.map((m) => ({ ...m, marks_seen: seenOf(m.module) }));
  const marksAttempted = withSeen.reduce((s, m) => s + m.marks_seen, 0);
  const estimable = withSeen.length > 0 && withSeen.every((m) => m.marks_seen >= MIN_MARKS_FOR_PREDICTION);
  const withheld = (ms: ModulePrediction[]) => ms.map((m) => ({ ...m, letter: null }));
  if (modules.length === 0) {
    return {
      modules: [],
      overall_percent: 0,
      overall_grade: null,
      marks_attempted: marksAttempted,
      estimable: false,
    };
  }
  const pct = modules.reduce((s, m) => s + m.total_estimate, 0) / modules.length;
  let grade: OverallGrade;
  if (pct >= 75) grade = 'I';
  else if (pct >= 65) grade = 'II';
  else if (pct >= 50) grade = 'III';
  else if (pct >= 35) grade = 'IV';
  else if (pct >= 20) grade = 'V';
  else grade = 'VI';
  // The arithmetic is still computed; what we withhold is the CLAIM, until
  // there is enough work behind it to make one.
  return {
    modules: estimable ? withSeen : withheld(withSeen),
    overall_percent: round1(pct),
    overall_grade: estimable ? grade : null,
    marks_attempted: marksAttempted,
    estimable,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
