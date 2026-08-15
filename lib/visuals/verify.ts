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

  // Last check: does it actually draw? Params can be valid and the geometry
  // still collapse — a triangle given only side lengths once laid out every
  // vertex at NaN and reached the review queue as an empty box. A figure a
  // reviewer cannot see is worse than no figure, because the question reads as
  // if one is there.
  if (issues.length === 0) {
    try {
      const svg = template.render(parsed.data as never);
      if (svg.includes('NaN') || svg.includes('Infinity')) {
        issues.push(`${visual.template}: renders with non-finite coordinates — the figure would be blank`);
      }
    } catch (err) {
      issues.push(`${visual.template}: render threw — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { ok: issues.length === 0, issues, advisories, params: parsed.data };
}
