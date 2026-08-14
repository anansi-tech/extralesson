import { deterministicPresentationIssues } from '@/lib/generation/question-quality';
import { QuestionVisualZ } from '@/lib/validation/question-visual';

export function draftVisualAuditIssues(raw: unknown): string[] {
  const parsed = QuestionVisualZ.safeParse(raw);
  if (!parsed.success) return ['visual-schema-invalid'];
  return deterministicPresentationIssues(parsed.data);
}
