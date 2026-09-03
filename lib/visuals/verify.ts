import { TEMPLATES, type StoredVisual } from './index';
import { isTextCrossCheckIssue, type VerifyContext } from './types';

// ROUND_1_5 §3 integrity rule: every template's params are Zod-validated AND
// numerically cross-checked against the question, and a failure here
// auto-rejects the draft BEFORE the solve pass.

export interface VisualVerifyResult {
  ok: boolean;
  /** Hard failures — these auto-reject the draft. */
  issues: string[];
  /** Text cross-check findings: logged, never fatal (see types.ts). */
  advisories: string[];
  /** Parsed params when validation passed (defaults applied). */
  params?: unknown;
}

// Templates that can honour a coordinate: everything else places its own
// vertices by its own layout, which is right for a labelled sketch and wrong
// the moment the question says where a point is.
const COORDINATE_TEMPLATES = new Set(['coordinateGrid']);

// "A = (1, 1)", "A(1, 1)", "C' = (6, 1)" — a coordinate given for a named point.
const STATED_COORDINATE = /\b([A-Z])('?)\s*(?:=\s*)?\(\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\)/g;

// Point labels the figure itself carries, read from the params without needing
// every template to declare them.
function figureLabels(params: unknown): Set<string> {
  const out = new Set<string>();
  const walk = (v: unknown) => {
    if (typeof v === 'string') {
      if (/^[A-Z]'?$/.test(v)) out.add(v[0]);
      return;
    }
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === 'object') return Object.values(v).forEach(walk);
  };
  walk(params);
  return out;
}

/** The stimulus table is verified exactly as a dataTable in the visual slot. */
export function verifyStimulusTable(
  params: unknown,
  context: VerifyContext,
): VisualVerifyResult {
  return verifyQuestionVisual({ template: 'dataTable', params: params as never }, context);
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

  // A sketch cannot show a question's coordinates: triangleLabeled places the
  // apex and the base itself, so a question stating A(1,1), B(3,1), C(2,3) is
  // drawn with A on top — figure and text describing different triangles.
  if (issues.length === 0 && !COORDINATE_TEMPLATES.has(visual.template)) {
    const text = [context.stimulus ?? '', context.stem, ...context.partPrompts].join(' ');
    const stated = new Set([...text.matchAll(STATED_COORDINATE)].map((m) => m[1]));
    const drawn = figureLabels(parsed.data);
    const shared = [...stated].filter((l) => drawn.has(l));
    if (shared.length >= 2) {
      issues.push(
        `${visual.template}: the question gives coordinates for ${shared.sort().join(', ')}, but this template places its own points — a question stating coordinates needs coordinateGrid`,
      );
    }
  }

  // Params can be valid and the geometry still collapse. A figure a reviewer
  // cannot see is worse than no figure, because the question reads as if one
  // is there.
  if (issues.length === 0) {
    try {
      const svg = template.render(parsed.data as never, context);
      if (svg.includes('NaN') || svg.includes('Infinity')) {
        issues.push(`${visual.template}: renders with non-finite coordinates — the figure would be blank`);
      }
    } catch (err) {
      issues.push(`${visual.template}: render threw — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { ok: issues.length === 0, issues, advisories, params: parsed.data };
}
