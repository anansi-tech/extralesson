// Predicted outcome v1 (ROUND_1 §6.6): honest arithmetic, no ML.
// Everything here is an ESTIMATE and the UI must label it so.
//
// Documented assumptions:
// - Per module, weighted contribution = P1 (30) + P2 (50) driven by
//   blueprint-weighted module mastery, i.e. mastery × 80.
// - SBA (20 weighted) is assumed at a neutral carry-over of 60% — students
//   in this round have no SBA data; 60% ≈ a middling moderated project.
// - Module letter bands (A–C) are our assumptions, not published CXC cut
//   scores: A ≥ 75, B ≥ 60, C ≥ 45 (of the 100 weighted module marks).
//   Below C we report 'U' (ungraded estimate).
// - Overall six-point-scale bands are likewise assumptions: I ≥ 75,
//   II ≥ 65, III ≥ 50, IV ≥ 35, V ≥ 20, VI below.

export const SBA_NEUTRAL_FRACTION = 0.6;

const P1_WEIGHT = 30;
const P2_WEIGHT = 50;
const SBA_WEIGHT = 20;

export type ModuleLetter = 'A' | 'B' | 'C' | 'U';
export type OverallGrade = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

export interface ModulePrediction {
  module: 1 | 2 | 3;
  mastery: number; // blueprint-weighted module mastery 0..1
  p1_estimate: number; // of 30
  p2_estimate: number; // of 50
  sba_assumed: number; // of 20, always the neutral assumption
  total_estimate: number; // of 100
  letter: ModuleLetter;
}

export function predictModule(module: 1 | 2 | 3, mastery: number): ModulePrediction {
  const m = Math.min(1, Math.max(0, mastery));
  const p1 = m * P1_WEIGHT;
  const p2 = m * P2_WEIGHT;
  const sba = SBA_NEUTRAL_FRACTION * SBA_WEIGHT;
  const total = p1 + p2 + sba;
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
    sba_assumed: round1(sba),
    total_estimate: round1(total),
    letter,
  };
}

export interface OverallPrediction {
  modules: ModulePrediction[];
  overall_percent: number; // mean of module totals
  overall_grade: OverallGrade;
}

// Overall estimate: modules combined with equal weight (each module is 100
// weighted marks of the 300 total, Assessment Grid A).
export function predictOverall(modules: ModulePrediction[]): OverallPrediction {
  if (modules.length === 0) {
    return { modules: [], overall_percent: 0, overall_grade: 'VI' };
  }
  const pct = modules.reduce((s, m) => s + m.total_estimate, 0) / modules.length;
  let grade: OverallGrade;
  if (pct >= 75) grade = 'I';
  else if (pct >= 65) grade = 'II';
  else if (pct >= 50) grade = 'III';
  else if (pct >= 35) grade = 'IV';
  else if (pct >= 20) grade = 'V';
  else grade = 'VI';
  return { modules, overall_percent: round1(pct), overall_grade: grade };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
