import { z } from 'zod';
import { CONTEXT_CATEGORIES } from '@/lib/generation/contexts';
import type { Representation, ResponseMode, TemplateName } from '@/lib/types';

// Boundary validation for questions (R1.5 §2). Every question write —
// generation pipeline output, admin edits — passes through here.
//
// A model asked for an optional field returns it as null, not by omitting it:
// structured output fills every declared key. So at this boundary an optional
// field means "null or absent", and .optional() alone rejects half of what
// arrives. R1.7 shipped for_format as .optional() and every structured draft
// generated afterwards failed on rubric rows that simply had no form mark.
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullish().transform((v) => (v === null ? undefined : v));

// Same reason, for a field that has a default: .default() fires on undefined
// and not on null, so the null has to become undefined before it is reached.
const defaulted = <T extends z.ZodTypeAny>(schema: T, fallback: z.infer<T>) =>
  z.preprocess((v) => v ?? undefined, schema.default(fallback));

export const OBJECTIVE_ID_RE = /^M[123]\.\d+\.\d+$/;

export const ArchetypeZ = z.enum([
  'multi-step-application',
  'direct-procedure',
  'interpretation',
  'justification',
  'reverse-reasoning',
  'comparison',
  'complete-the-table',
]);

export const RepresentationZ = z.enum(['prose', 'diagram', 'graph', 'table', 'chart', 'venn']);

export const TemplateNameZ = z.enum([
  'triangleLabeled',
  'circleCenter',
  'parallelTransversal',
  'polygonMarkedAngle',
  'coordinateGrid',
  'travelGraph',
  'barChart',
  'pieChart',
  'histogram',
  'cumulativeFrequency',
  'venn2',
  'compositeShape',
  'patternFigure',
  'numberLine',
  'bearingDiagram',
  'vectorFigure',
  'dataTable',
]);

// Which templates satisfy which representation (R1.5 §2: visual must be
// type-consistent). Matrices are NOT visuals — KaTeX notation in stem/parts.
/** A grid drawn from question-named points, without axes — a schematic. */
export function isNamedSketch(params: Record<string, unknown> | undefined): boolean {
  const named = params?.named as { sketch?: boolean } | undefined;
  return Boolean(named) && named?.sketch !== false;
}

export const TEMPLATES_BY_REPRESENTATION: Record<Exclude<Representation, 'prose'>, TemplateName[]> =
  {
    diagram: [
      'triangleLabeled',
      'circleCenter',
      'parallelTransversal',
      'polygonMarkedAngle',
      'compositeShape',
      'patternFigure',
      'numberLine',
      'bearingDiagram',
      'vectorFigure',
    ],
    graph: ['coordinateGrid', 'travelGraph', 'cumulativeFrequency'],
    chart: ['barChart', 'pieChart', 'histogram'],
    table: ['dataTable'],
    venn: ['venn2'],
  };

export const VisualZ = z.object({
  template: TemplateNameZ,
  // Per-template param schemas live in lib/visuals/ and are enforced by the
  // visual-verify gate; here we require a params object to exist.
  params: z.record(z.unknown()),
});

export const RubricItemZ = z
  .object({
    code: z.string().regex(/^(CK|AK|R)\d+$/, 'rubric code must be CK/AK/R + number'),
    profile: z.enum(['CK', 'AK', 'R']),
    criterion: z.string().min(1),
    mark_value: z.number().int().min(1),
    part_label: z.string().regex(/^[a-j]$/),
    // R1.7 §B4: the separate mark for the required form.
    for_format: optional(z.boolean()),
  })
  .refine((r) => r.code.replace(/\d+$/, '') === r.profile, {
    message: 'rubric code prefix must match profile',
  });

export const MisconceptionZ = z.object({
  trigger: z.string().min(1),
  name: z.string().min(1),
  remediation: z.string().min(1),
});

export const ResponseModeZ = z.enum(['answer', 'show_that', 'explain', 'construct']);

// 'sf:N' / 'dp:N' carry a precision; the rest are bare tags.
export const AnswerFormatZ = z.union([
  z.enum(['exact', 'standard_form', 'lowest_terms', 'integer', 'surd', 'equation_form']),
  z.string().regex(/^(sf|dp):\d$/),
]);

// A part's response mode is a property of what it ASKS, so we read it from the
// wording rather than trusting the label. A "Show that" part carries its answer
// in the stem: auto-marked, it would pass a student who typed the given result
// and wrote no working — the R1.6 §1 failure. Only ever strengthens the model's
// label, never weakens it.
const SHOW_THAT_RE = /^\s*(?:\(?[a-j]\)?[\s.:]*)?(?:show|prove|verify|deduce)\s+that\b/i;
const EXPLAIN_RE = /^\s*(?:\(?[a-j]\)?[\s.:]*)?(?:explain|justify|give\s+(?:a|one|two)?\s*reasons?|state\s+(?:a|one)\s+reason|why\b|comment\s+on)/i;

export function modeFromWording(prompt: string, declared: ResponseMode): ResponseMode {
  if (declared !== 'answer') return declared;
  if (SHOW_THAT_RE.test(prompt)) return 'show_that';
  if (EXPLAIN_RE.test(prompt)) return 'explain';
  return declared;
}

export const PartZ = z.object({
  label: z.string().regex(/^[a-j]$/),
  prompt: z.string().min(1),
  marks: z.number().int().min(1),
  answer: z.string().min(1), // values-only convention
  // Mark-scheme accept list: alternative correct forms of THIS part's answer
  // (real schemes write "edge (accept: line segment)"). Grading and the solve
  // gate treat any listed form as correct.
  accept: optional(z.array(z.string().min(1)).max(4)),
  // R1.6 §1: only 'answer' parts can be auto-marked.
  response_mode: defaulted(ResponseModeZ, 'answer'),
  // R1.6 §2: set whenever the stem demands a particular form.
  //
  // A value we do not recognise drops out rather than failing the question. The
  // model reaches for real demands we have no checker for — one run lost seven
  // attempts to "set_builder_notation" — and the demand still reaches the
  // student through the part's wording, which is where they read it. Losing a
  // whole question over the label would be the expensive way to be strict.
  // Generation reports what it dropped, so the drift stays visible.
  answer_format: z.preprocess(
    (v) => (AnswerFormatZ.safeParse(v).success ? v : undefined),
    AnswerFormatZ.optional(),
  ),
}).transform((p) => ({ ...p, response_mode: modeFromWording(p.prompt, p.response_mode) }));

const PART_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

const QuestionBaseZ = z.object({
  objective_ids: z.array(z.string().regex(OBJECTIVE_ID_RE)).min(1),
  module: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  stimulus: z.string().min(1).optional(), // shared context (KaTeX-safe)
  stem: z.string().min(10),
  visual: VisualZ.optional(),
  archetype: ArchetypeZ,
  representation: RepresentationZ,
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  marks: z.number().int().min(1),
  worked_solution: z.string().min(1),
  misconceptions: z.array(MisconceptionZ).default([]),
  // R1.8 Part 0: where the question is set. Absent on questions written before
  // the field existed; the backfill classifies those from their own text.
  context_category: optional(z.enum(CONTEXT_CATEGORIES)),
});

const moduleAgrees = (q: { module: number; objective_ids: string[] }) =>
  q.objective_ids.every((id) => id.startsWith(`M${q.module}.`));

function checkVisualConsistency(
  q: {
    representation: Representation;
    visual?: { template: TemplateName; params?: Record<string, unknown> };
  },
  ctx: z.RefinementCtx,
) {
  if (q.representation === 'prose') {
    if (q.visual) {
      ctx.addIssue({ code: 'custom', path: ['visual'], message: 'prose questions carry no visual' });
    }
    return;
  }
  if (!q.visual) {
    ctx.addIssue({
      code: 'custom',
      path: ['visual'],
      message: `representation '${q.representation}' requires a visual`,
    });
    return;
  }
  // A coordinateGrid whose points are named by the question and drawn in
  // sketch mode has no axes, gridlines or scale: it IS a diagram, and calling
  // it a graph would misreport the bank's composition. A plotted grid the
  // student reads values off is a graph, as before.
  const namedSketch =
    q.visual.template === 'coordinateGrid' &&
    isNamedSketch(q.visual.params);
  const allowed = TEMPLATES_BY_REPRESENTATION[q.representation];
  if (!allowed.includes(q.visual.template) && !(q.representation === 'diagram' && namedSketch)) {
    ctx.addIssue({
      code: 'custom',
      path: ['visual', 'template'],
      message: `template '${q.visual.template}' is not valid for representation '${q.representation}'`,
    });
  }
}

function checkPartLabels(parts: { label: string }[], ctx: z.RefinementCtx) {
  const expected = PART_LABELS.slice(0, parts.length);
  if (parts.map((p) => p.label).join('') !== expected.join('')) {
    ctx.addIssue({
      code: 'custom',
      path: ['parts'],
      message: `part labels must be sequential ${expected.join(', ')}`,
    });
  }
}

export const McqQuestionZ = QuestionBaseZ.extend({
  kind: z.literal('mcq'),
  options: z.array(z.string().min(1)).length(4),
  answer_key: z.number().int().min(0).max(3),
  // Single profile per MCQ item, per the syllabus grid.
  profile: z.enum(['CK', 'AK', 'R']),
  parts: z.array(PartZ).length(1), // mcq: exactly 1 part
})
  .refine(moduleAgrees, { message: 'objective_ids must belong to module' })
  .superRefine((q, ctx) => {
    checkVisualConsistency(q, ctx);
    checkPartLabels(q.parts, ctx);
    if (q.parts[0].marks !== q.marks) {
      ctx.addIssue({ code: 'custom', path: ['parts'], message: 'mcq part marks must equal marks' });
    }
  });

export const StructuredQuestionZ = QuestionBaseZ.extend({
  kind: z.literal('structured'),
  parts: z.array(PartZ).min(1).max(10), // flat labels 'a'..'j'; no nesting (R1.6 §5)
  rubric: z.array(RubricItemZ).min(1),
  // Derived: "; "-joined part answers (kept for grading/back-compat).
  final_answer: z.string().min(1),
})
  .refine(moduleAgrees, { message: 'objective_ids must belong to module' })
  .refine((q) => q.rubric.reduce((s, r) => s + r.mark_value, 0) === q.marks, {
    message: 'rubric mark_values must sum to marks',
  })
  .refine((q) => new Set(q.rubric.map((r) => r.code)).size === q.rubric.length, {
    message: 'rubric codes must be unique',
  })
  .superRefine((q, ctx) => {
    checkVisualConsistency(q, ctx);
    checkPartLabels(q.parts, ctx);
    if (q.parts.reduce((s, p) => s + p.marks, 0) !== q.marks) {
      ctx.addIssue({
        code: 'custom',
        path: ['parts'],
        message: 'part marks must sum to marks',
      });
    }
    const labels = new Set(q.parts.map((p) => p.label));
    for (const [i, r] of q.rubric.entries()) {
      if (!labels.has(r.part_label)) {
        ctx.addIssue({
          code: 'custom',
          path: ['rubric', i, 'part_label'],
          message: `part_label '${r.part_label}' is not one of the question's parts`,
        });
      }
    }
    for (const [i, part] of q.parts.entries()) {
      if (part.response_mode === 'construct') {
        ctx.addIssue({
          code: 'custom',
          path: ['parts', i, 'response_mode'],
          message: 'construct parts are out of scope and must not be generated',
        });
      }
    }
    const derived = q.parts.map((p) => p.answer).join('; ');
    if (q.final_answer !== derived) {
      ctx.addIssue({
        code: 'custom',
        path: ['final_answer'],
        message: 'final_answer must be the "; "-joined part answers',
      });
    }
  });

export const QuestionDraftZ = z.union([McqQuestionZ, StructuredQuestionZ]);

export type QuestionDraft = z.infer<typeof QuestionDraftZ>;
export type McqDraft = z.infer<typeof McqQuestionZ>;
export type StructuredDraft = z.infer<typeof StructuredQuestionZ>;

// Derive final_answer from parts — generation uses this so the stored value
// can never drift from the parts.
export function deriveFinalAnswer(parts: { answer: string }[]): string {
  return parts.map((p) => p.answer).join('; ');
}
