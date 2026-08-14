import type { QuestionVisual } from '@/lib/validation/question-visual';

export const DeterministicQualityIssueZ = [
  'visual-scale-risk',
] as const;

export type DeterministicQualityIssue = typeof DeterministicQualityIssueZ[number];

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
