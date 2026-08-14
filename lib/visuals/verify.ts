import { TEMPLATES, type StoredVisual } from './index';
import { isTextCrossCheckIssue, type VerifyContext } from './types';

// R1.5 §3 integrity rule (load-bearing): every template's params are
// Zod-validated AND numerically cross-checked against the question. A failure
// here auto-rejects the draft BEFORE the solve pass.

export interface VisualVerifyResult {
  ok: boolean;
  /** Hard failures — these auto-reject the draft. */
  issues: string[];
  /** Text cross-check findings: logged, never fatal (see types.ts). */
  advisories: string[];
  /** Parsed params when validation passed (defaults applied). */
  params?: unknown;
}

export function verifyQuestionVisual(
  visual: StoredVisual,
  context: VerifyContext,
): VisualVerifyResult {
  const template = TEMPLATES[visual.template];
  if (!template) {
    return { ok: false, issues: [`unknown template '${visual.template}'`], advisories: [] };
  }
  const parsed = template.paramsSchema.safeParse(visual.params);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 5)
      .map((i) => `${visual.template}.params.${i.path.join('.')}: ${i.message}`);
    return { ok: false, issues, advisories: [] };
  }
  const all = template.verify(parsed.data as never, context);
  const advisories = all.filter(isTextCrossCheckIssue);
  const issues = all.filter((i) => !isTextCrossCheckIssue(i));
  return { ok: issues.length === 0, issues, advisories, params: parsed.data };
}
