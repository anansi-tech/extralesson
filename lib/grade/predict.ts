// Predicted outcome v1 (ROUND_1 §6.6): honest arithmetic, no ML.
// Everything here is an ESTIMATE and the UI must label it so.
//
// Documented assumptions:
// - Per module, weighted contribution = P1 (30) + P2 (50) driven by
//   blueprint-weighted module mastery, i.e. mastery × 80.
// - The Paper 3 project (school-based assessment, 20 weighted) is assumed at a
//   neutral carry-over of 60% — students in this round have no project data;
//   60% ≈ a middling moderated project.
// - Module letter bands (A–C) are our assumptions, not published CXC cut
//   scores: A ≥ 75, B ≥ 60, C ≥ 45 (of the 100 weighted module marks).
//   Below C we report 'U' (ungraded estimate).
// - Overall six-point-scale bands are likewise assumptions: I ≥ 75,
//   II ≥ 65, III ≥ 50, IV ≥ 35, V ≥ 20, VI below.
// - R1.6 §4: the estimate is computed over the marks we can actually assess
//   and reports that basis. Construction and drawing marks, and show_that /
//   explain parts, are never extrapolated across — a strong student on the
//   marks we test is not evidence about the marks we do not.

import { MIN_ATTEMPTS_FOR_PREDICTION } from '@/lib/mastery/config';

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
  /** 0..1 share of this module's marks the estimate is based on (R1.6 §4). */
  coverage: number;
}

export function predictModule(
  module: 1 | 2 | 3,
  mastery: number,
  coverage = 1,
): ModulePrediction {
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
    coverage: Math.min(1, Math.max(0, coverage)),
  };
}

export interface OverallPrediction {
  modules: ModulePrediction[];
  overall_percent: number; // mean of module totals
  /**
   * null when the student has not done enough work to estimate from. Nullable
   * on purpose: a flag beside a letter is easy to read past, and printing "U"
   * or "VI" at a student who has answered nothing is a verdict we have not
   * earned. Every surface must decide what to show instead.
   */
  overall_grade: OverallGrade | null;
  /** Attempts this rests on, and whether that was enough to state a grade. */
  attempts: number;
  estimable: boolean;
  /** Mean coverage the estimate rests on; the UI must state it (R1.6 §4). */
  coverage: number;
}

// Overall estimate: modules combined with equal weight (each module is 100
// weighted marks of the 300 total, Assessment Grid A).
export function predictOverall(
  modules: ModulePrediction[],
  attempts: number,
): OverallPrediction {
  const estimable = attempts >= MIN_ATTEMPTS_FOR_PREDICTION;
  const withheld = (ms: ModulePrediction[]) => ms.map((m) => ({ ...m, letter: null }));
  if (modules.length === 0) {
    return {
      modules: [],
      overall_percent: 0,
      overall_grade: null,
      attempts,
      estimable: false,
      coverage: 1,
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
  const coverage = modules.reduce((s, m) => s + m.coverage, 0) / modules.length;
  // The arithmetic is still computed and still honest; what we withhold is the
  // CLAIM, until there is enough work behind it to make one.
  return {
    modules: estimable ? modules : withheld(modules),
    overall_percent: round1(pct),
    overall_grade: estimable ? grade : null,
    attempts,
    estimable,
    coverage,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
