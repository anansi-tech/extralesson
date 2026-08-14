import type { QuestionVisual } from '@/lib/validation/question-visual';
import type { BlindPilotEvaluation } from '@/lib/generation/pilot-evaluation';
import { expectedProfiles } from '@/lib/generation/pilot-evaluation';
import type { QuestionRecipe } from '@/lib/generation/question-recipe';

export const DeterministicQualityIssueZ = [
  'visual-scale-risk',
] as const;

export type DeterministicQualityIssue = typeof DeterministicQualityIssueZ[number];

export const BlindReviewIssueZ = [
  'difficulty-mismatch',
  'archetype-mismatch',
  'profile-mismatch',
  'part-count-mismatch',
  'visual-type-mismatch',
  'readiness-not-pass',
  'exam-fidelity-low',
  'clarity-low',
  'visual-legibility-low',
  'visual-necessity-low',
  'reviewer-concern',
] as const;

export type BlindReviewIssue = typeof BlindReviewIssueZ[number];

export function reviewRouteForModule(module: 1 | 2 | 3): {
  primary: 'luna' | 'terra';
  comparator: 'terra' | null;
} {
  return module === 3
    ? { primary: 'terra', comparator: null }
    : { primary: 'luna', comparator: 'terra' };
}

// Diagram coordinates are rendered directly on a fixed 0–100 canvas. Reject
// layouts that use only a tiny corner; mathematical correctness alone does
// not make such a figure usable for students.
export function deterministicPresentationIssues(
  visual: QuestionVisual | null | undefined,
): DeterministicQualityIssue[] {
  if (!visual || visual.format !== 'diagram') return [];
  const xs = visual.points.map((point) => point.x);
  const ys = visual.points.map((point) => point.y);
  const largestSpan = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
  );
  return largestSpan < 35 ? ['visual-scale-risk'] : [];
}

export function blindReviewIssues(
  evaluation: BlindPilotEvaluation,
  recipe: QuestionRecipe,
): BlindReviewIssue[] {
  const issues: BlindReviewIssue[] = [];
  if (evaluation.difficulty !== recipe.difficulty) issues.push('difficulty-mismatch');
  if (evaluation.archetype !== recipe.archetype) issues.push('archetype-mismatch');
  if (!expectedProfiles(recipe).includes(evaluation.profile)) issues.push('profile-mismatch');
  if (evaluation.part_count !== recipe.part_count) issues.push('part-count-mismatch');
  if (evaluation.visual_type !== recipe.visual_type) issues.push('visual-type-mismatch');
  if (evaluation.readiness !== 'pass') issues.push('readiness-not-pass');
  if (evaluation.exam_fidelity < 4) issues.push('exam-fidelity-low');
  if (evaluation.clarity < 4) issues.push('clarity-low');
  if (evaluation.visual_legibility !== null && evaluation.visual_legibility < 3) {
    issues.push('visual-legibility-low');
  }
  if (evaluation.visual_necessity !== null && evaluation.visual_necessity < 3) {
    issues.push('visual-necessity-low');
  }
  if (evaluation.concerns.length > 0) issues.push('reviewer-concern');
  return issues;
}
