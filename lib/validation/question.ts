import { z } from 'zod';
import type { Representation, TemplateName } from '@/lib/types';

// Boundary validation for questions (R1.5 §2). Every question write —
// generation pipeline output, admin edits — passes through here.

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
  'dataTable',
]);

// Which templates satisfy which representation (R1.5 §2: visual must be
// type-consistent). Matrices are NOT visuals — KaTeX notation in stem/parts.
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
    part_label: z.string().regex(/^[a-f]$/),
  })
  .refine((r) => r.code.replace(/\d+$/, '') === r.profile, {
    message: 'rubric code prefix must match profile',
  });

export const MisconceptionZ = z.object({
  trigger: z.string().min(1),
  name: z.string().min(1),
  remediation: z.string().min(1),
});

export const PartZ = z.object({
  label: z.string().regex(/^[a-f]$/),
  prompt: z.string().min(1),
  marks: z.number().int().min(1),
  answer: z.string().min(1), // values-only convention
});

const PART_LABELS = ['a', 'b', 'c', 'd', 'e', 'f'];

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
});

const moduleAgrees = (q: { module: number; objective_ids: string[] }) =>
  q.objective_ids.every((id) => id.startsWith(`M${q.module}.`));

function checkVisualConsistency(
  q: { representation: Representation; visual?: { template: TemplateName } },
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
  if (!TEMPLATES_BY_REPRESENTATION[q.representation].includes(q.visual.template)) {
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
  parts: z.array(PartZ).min(1).max(6), // flat labels 'a'..'f'; no nesting
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
