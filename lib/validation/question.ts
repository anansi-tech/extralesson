import { z } from 'zod';
import { CONTEXT_CATEGORIES } from '@/lib/generation/contexts';
import { isPositionalLabel, SLOT_LABEL_RE, SLOT_REF_RE } from '@/lib/notation';
import { figureGivesAnswer } from '@/lib/targets/construct';
import {
  answerIssues,
  clozeIssues,
  delimiterIssues,
  labelIssues,
} from './renderable';
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
  'quadrilateralLabeled',
  'compoundTriangle',
  'coordinateGrid',
  'travelGraph',
  'barChart',
  'pieChart',
  'histogram',
  'cumulativeFrequency',
  'vennDiagram',
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
      'quadrilateralLabeled',
      'compoundTriangle',
      'compositeShape',
      'patternFigure',
      'numberLine',
      'bearingDiagram',
      'vectorFigure',
    ],
    graph: ['coordinateGrid', 'travelGraph', 'cumulativeFrequency'],
    chart: ['barChart', 'pieChart', 'histogram'],
    table: ['dataTable'],
    venn: ['vennDiagram'],
  };

export const VisualZ = z.object({
  template: TemplateNameZ,
  // Per-template param schemas live in lib/visuals/ and are enforced by the
  // visual-verify gate; here we require a params object to exist.
  params: z.record(z.unknown()),
});

export const RubricItemZ = z
  .preprocess(
    (raw) => {
      if (!raw || typeof raw !== 'object') return raw;
      const r = raw as Record<string, unknown>;
      // part_label is derived from the slot the row is earned by, and kept,
      // because the review card, the matrices and the grader all read it.
      const part_label = r.part_label ?? String(r.slot_ref ?? '').split('.')[0];
      return { ...r, part_label };
    },
    z.object({
      code: z.string().regex(/^(CK|AK|R)\d+$/, 'rubric code must be CK/AK/R + number'),
      profile: z.enum(['CK', 'AK', 'R']),
      criterion: z.string().min(1),
      mark_value: z.number().int().min(1),
      // R1.8 Part 1: rows are earned by a slot. part_label is derived from it
      // and kept, because the review card, the matrices and the grader all read
      // it and none of them need to know about slots.
      slot_ref: z.string().regex(SLOT_REF_RE),
      part_label: z.string().regex(/^[a-j]$/),
      for_format: optional(z.boolean()),
    }),
  )
  .refine((r) => r.code.replace(/\d+$/, '') === r.profile, {
    message: 'rubric code prefix must match profile',
  });

export const MisconceptionZ = z.object({
  trigger: z.string().min(1),
  name: z.string().min(1),
  remediation: z.string().min(1),
});


/**
 * The slots a figure labels in place. Only `dataTable` references slots — its
 * completable cells name the slot that fills each gap, and the renderer prints
 * that key inside the gap.
 */
export function slotRefsNamedByVisual(visual: unknown): Set<string> {
  const refs = new Set<string>();
  const v = visual as { template?: string; params?: { rows?: unknown[][] } } | undefined;
  if (v?.template !== 'dataTable') return refs;
  for (const row of v.params?.rows ?? []) {
    for (const cell of row ?? []) {
      const slots = (cell as { slots?: unknown })?.slots;
      if (Array.isArray(slots)) for (const ref of slots) if (typeof ref === 'string') refs.add(ref);
    }
  }
  return refs;
}

/**
 * Wording that promises a figure on the page.
 *
 * The first version required the noun to follow "the" directly, so it read
 * "the grid below" and missed "the coordinate grid below" — and matched
 * "use the grid" but not "use the information and the graph". Five approved
 * questions sat behind that gap. Adjectives are allowed between the article
 * and the noun now, which is how people actually write.
 */
const SHOWN_FIGURE =
  /\b(?:use\s+the\s+[a-z' ]{0,24}?(?:grid|graph|diagram|figure|sketch)|the\s+[a-z' ]{0,24}?(?:grid|graph|diagram|figure|sketch)\s+(?:shows?|below|above|provided|is\s+for|represents)|shown\s+below|below\s+shows|as\s+shown)/i;

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

// R1.8 Part 1 — an answerable slot inside a lettered part.
export const SlotZ = z.object({
  // 'i'..'x' for sub-parts, 'r5.S' for a table cell, and descriptive keys for
  // the several-named-things case — which are as long as the words they name:
  // 'centre', 'modal_class', 'semi_interquartile_range'.
  label: z.string().regex(SLOT_LABEL_RE),
  prompt: optional(z.string().min(1)),
  answer: z.string().min(1), // values-only convention
  // Mark-scheme accept list: alternative correct forms of THIS part's answer
  // (real schemes write "edge (accept: line segment)"). Grading and the solve
  // gate treat any listed form as correct.
  accept: optional(z.array(z.string().min(1)).max(4)),
  // R1.6 §1, moved to the slot in R1.8: a part may mix an auto-marked value
  // with a reason the student self-marks, and only the reason leaves the
  // graded pool.
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
  rubric_codes: z.array(z.string()).default([]),
  // Which earlier slots' results this slot uses, as "part.slot" refs.
  //
  // Declared rather than inferred. Chain depth is the property that makes a
  // paper question hard without making it longer, and reading it out of the
  // wording only works while the wording announces it — which the real papers
  // do not do: "hence" appears once or twice in a whole paper. Measuring
  // prose would have collapsed the moment we stopped mandating the word,
  // while the dependency it stood for was unchanged.
  depends_on: defaulted(z.array(z.string().regex(SLOT_REF_RE)).max(6), []),
  // Which syllabus objective this slot assesses.
  //
  // Integration — one scenario chaining several skills — is the hardest class
  // the papers set, and it has to be counted from something we DECLARE. Real
  // Paper 2 questions demand 2.04 distinct skills on average and 30% demand
  // three or more; ours ran at 0.96 and 6% for difficulty 3, no harder on this
  // axis than difficulty 1. Counting skills out of prose would measure our
  // vocabulary, so each slot names its objective instead.
  objective_id: optional(z.string().regex(OBJECTIVE_ID_RE)),
});

/**
 * A part is an instruction plus the slots it governs. A part written the old
 * way — one answer on the part itself — lifts into a single slot here, so every
 * question already in the bank stays valid and reviewable without being
 * rewritten. That is the whole reason to make this change at 123 approved.
 */
/**
 * A sentence the student completes in place, with {} where each answer goes.
 *
 * The papers set this repeatedly — "The regular octagon has {} lines of
 * symmetry and rotational symmetry of order {}." — and it is a different item
 * from the two questions it would otherwise be split into: the sentence is the
 * context, and reading it as one statement is part of the work. We already had
 * this for a table cell; prose needed it too.
 */
const CLOZE_GAP = '{}';

export function clozeGapCount(statement: string): number {
  return statement.split(CLOZE_GAP).length - 1;
}

export const PartZ = z
  .object({
      label: z.string().regex(/^[a-j]$/),
      prompt: z.string().min(1),
      marks: z.number().int().min(1),
      slots: z.array(SlotZ).min(1).max(8),
      // A statement the student completes in place; {} marks each gap, one per
      // slot, in order. The part's prompt still says what to do ("Complete the
      // statement below"), exactly as the papers print it.
      statement: optional(z.string().min(1).max(300)),
    })
    .superRefine((part, ctx) => {
      if (part.statement === undefined) return;
      const gaps = clozeGapCount(part.statement);
      if (gaps === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['statement'],
          message: 'a statement to complete must contain at least one {} gap',
        });
      } else if (gaps !== part.slots.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['statement'],
          message: `statement has ${gaps} gap(s) for ${part.slots.length} slot(s)`,
        });
      }
    })
    .transform((part) => ({
      ...part,
      slots: part.slots.map((slot) => ({
        ...slot,
        // A slot's mode comes from what IT asks, falling back to the part's
        // instruction when the slot carries no prompt of its own.
        response_mode: modeFromWording(slot.prompt ?? part.prompt, slot.response_mode),
      })),
  }));

const PART_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

/**
 * Every string a student will see has to survive the renderer that shows it.
 * This is the layer the August formatting audit found missing: the defects it
 * catalogued were all storable, so every fix had been a database fix and the
 * next batch reproduced them.
 */
function checkRenderable(q: Record<string, unknown>, ctx: z.RefinementCtx): void {
  const at = (path: (string | number)[], message: string) =>
    ctx.addIssue({ code: 'custom', path, message });

  const prose: [string[], unknown][] = [
    [['stem'], q.stem],
    [['stimulus'], q.stimulus],
    [['worked_solution'], q.worked_solution],
  ];
  for (const [path, value] of prose) {
    if (typeof value !== 'string') continue;
    for (const issue of delimiterIssues(value)) at(path, issue);
  }

  if (typeof q.final_answer === 'string') {
    for (const issue of answerIssues(q.final_answer)) at(['final_answer'], issue);
  }

  for (const [i, m] of ((q.misconceptions ?? []) as { trigger?: string; remediation?: string }[]).entries()) {
    if (typeof m.remediation === 'string') {
      for (const issue of delimiterIssues(m.remediation)) at(['misconceptions', i, 'remediation'], issue);
    }
    if (typeof m.trigger === 'string') {
      for (const issue of answerIssues(m.trigger)) at(['misconceptions', i, 'trigger'], issue);
    }
  }

  for (const [i, r] of ((q.rubric ?? []) as { criterion?: string }[]).entries()) {
    if (typeof r.criterion === 'string') {
      for (const issue of delimiterIssues(r.criterion)) at(['rubric', i, 'criterion'], issue);
    }
  }

  type P = { prompt?: string; statement?: string; slots?: { prompt?: string; answer?: string; accept?: string[] }[] };
  for (const [i, part] of ((q.parts ?? []) as P[]).entries()) {
    if (typeof part.prompt === 'string') {
      for (const issue of delimiterIssues(part.prompt)) at(['parts', i, 'prompt'], issue);
    }
    if (typeof part.statement === 'string') {
      for (const issue of delimiterIssues(part.statement)) at(['parts', i, 'statement'], issue);
      for (const issue of clozeIssues(part.statement)) at(['parts', i, 'statement'], issue);
    }
    for (const [j, slot] of (part.slots ?? []).entries()) {
      if (typeof slot.prompt === 'string') {
        for (const issue of delimiterIssues(slot.prompt)) at(['parts', i, 'slots', j, 'prompt'], issue);
      }
      if (typeof slot.answer === 'string') {
        for (const issue of answerIssues(slot.answer)) at(['parts', i, 'slots', j, 'answer'], issue);
      }
      for (const [k, a] of (slot.accept ?? []).entries()) {
        for (const issue of answerIssues(a)) at(['parts', i, 'slots', j, 'accept', k], issue);
      }
    }
  }

  // Figure and table labels are drawn as plain text; KaTeX never runs on them.
  const LABEL_KEYS = ['label', 'name', 'caption', 'universe_label', 't_label', 'v_label', 'set_a', 'set_b', 'set_c'];
  const walkLabels = (root: string[], value: unknown, path: (string | number)[]): void => {
    if (typeof value === 'string') {
      const key = String(path[path.length - 1]);
      if (LABEL_KEYS.includes(key) || key === 'headers' || typeof path[path.length - 1] === 'number') {
        for (const issue of labelIssues(value)) at([...root, ...path], issue);
      }
      return;
    }
    if (Array.isArray(value)) {
      const key = String(path[path.length - 1]);
      if (key === 'headers' || key === 'labels') value.forEach((v, i) => walkLabels(root, v, [...path, i]));
      return;
    }
    if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) walkLabels(root, v, [...path, k]);
    }
  };
  walkLabels(['visual', 'params'], (q.visual as { params?: Record<string, unknown> } | undefined)?.params ?? {}, []);
  // The stimulus table is drawn by the same template, so its labels answer to
  // the same rule as any other table's.
  walkLabels(['stimulus_table'], q.stimulus_table ?? {}, []);
}

const QuestionBaseZ = z.object({
  objective_ids: z.array(z.string().regex(OBJECTIVE_ID_RE)).min(1),
  module: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  stimulus: z.string().min(1).optional(), // shared context (KaTeX-safe)
  stem: z.string().min(10),
  visual: VisualZ.optional(),
  // R3 — dataTable params, verified by the visual gate like any other table.
  stimulus_table: z.record(z.unknown()).optional(),
  archetype: ArchetypeZ,
  // R1.8 §2. Declared here because Zod STRIPS what it does not know: the
  // pipeline set shape on the candidate, validation dropped it silently, and
  // every paper-shaped question reached the database as a drill item. Same
  // class as the depends_on bug, pointing the other way.
  shape: defaulted(z.enum(['paper', 'drill']), 'drill'),
  representation: RepresentationZ,
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  marks: z.number().int().min(1),
  worked_solution: z.string().min(1),
  misconceptions: z.array(MisconceptionZ).default([]),
  // R1.8 Part 0: where the question is set, so monotony is measurable.
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

/**
 * A stimulus table is for the question whose visual slot is ALREADY TAKEN. With
 * the slot free, a table belongs in it — that is what the other 80 table
 * questions do — and a second home for the same thing would split the
 * convention and the coverage counts that read it.
 */
function checkStimulusTable(
  q: { visual?: unknown; stimulus_table?: unknown },
  ctx: z.RefinementCtx,
) {
  if (q.stimulus_table && !q.visual) {
    ctx.addIssue({
      code: 'custom',
      path: ['stimulus_table'],
      message: 'stimulus_table is for a question whose visual slot is taken; use visual.dataTable',
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
    checkRenderable(q, ctx);
    checkVisualConsistency(q, ctx);
    checkStimulusTable(q, ctx);
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
    checkRenderable(q, ctx);
    checkVisualConsistency(q, ctx);
    checkStimulusTable(q, ctx);
    checkPartLabels(q.parts, ctx);
    if (q.parts.reduce((s, p) => s + p.marks, 0) !== q.marks) {
      ctx.addIssue({
        code: 'custom',
        path: ['parts'],
        message: 'part marks must sum to marks',
      });
    }
    const slotRefs = new Set(q.parts.flatMap((p) => p.slots.map((s) => `${p.label}.${s.label}`)));
    for (const [i, r] of q.rubric.entries()) {
      if (!slotRefs.has(r.slot_ref)) {
        ctx.addIssue({
          code: 'custom',
          path: ['rubric', i, 'slot_ref'],
          message: `slot_ref '${r.slot_ref}' is not one of the question's slots`,
        });
      }
    }
    // A declared dependency must point at a real slot that comes EARLIER: a
    // chain that runs backwards is not a chain, and one that names a slot the
    // question does not have would inflate the depth we steer generation by.
    const order = q.parts.flatMap((p) => p.slots.map((s) => `${p.label}.${s.label}`));
    for (const [i, part] of q.parts.entries()) {
      for (const [j, slot] of part.slots.entries()) {
        const self = `${part.label}.${slot.label}`;
        for (const ref of slot.depends_on) {
          const at = order.indexOf(ref);
          if (at === -1) {
            ctx.addIssue({
              code: 'custom',
              path: ['parts', i, 'slots', j, 'depends_on'],
              message: `depends_on '${ref}' is not one of the question's slots`,
            });
          } else if (at >= order.indexOf(self)) {
            ctx.addIssue({
              code: 'custom',
              path: ['parts', i, 'slots', j, 'depends_on'],
              message: `depends_on '${ref}' does not come before '${self}'`,
            });
          }
        }
      }
    }
    // CONSTRUCT-THEN-INTERROGATE (R1.9). A construct slot asks the student to
    // draw on graph paper. It is self-marked, so a question made of one is
    // standalone drawing practice with nothing marked and nothing recorded —
    // which is not what the papers set and not what we are adding. What they
    // set is a drawing the REST of the question interrogates, so the shape is
    // the requirement: it opens the question, there is only one, the question
    // carries the figure we will show as the model answer, and auto-marked
    // slots follow it.
    const constructSlots = q.parts.flatMap((part, i) =>
      part.slots.map((slot, j) => ({ slot, i, j, partIndex: i })).filter((x) => x.slot.response_mode === 'construct'),
    );
    if (constructSlots.length > 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['parts', constructSlots[1].i, 'slots', constructSlots[1].j, 'response_mode'],
        message: 'a question may ask for at most one construction',
      });
    }
    if (constructSlots.length === 1) {
      const only = constructSlots[0];
      if (only.partIndex !== 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['parts', only.i, 'slots', only.j, 'response_mode'],
          message: 'the construction must be the first part — the later parts interrogate it',
        });
      }
      if (!q.visual) {
        ctx.addIssue({
          code: 'custom',
          path: ['visual'],
          message: 'a construct question must carry the figure it asks the student to draw',
        });
      }
      // ...and must not talk about it. Where the figure IS the answer it is
      // withheld until the student has committed, so a stem promising "the
      // graph below" points at nothing and contradicts the part asking them to
      // draw it. 35 of 58 construct questions did this before it was gated.
      // A pattern of figures is exempt: those figures are the premise.
      if (figureGivesAnswer((q.visual as { template?: TemplateName } | undefined)?.template)) {
        const said = [q.stimulus ?? '', q.stem].join(' ').match(SHOWN_FIGURE);
        if (said) {
          ctx.addIssue({
            code: 'custom',
            path: ['stem'],
            message: `refers to a figure the student cannot see while answering ("${said[0]}") — the figure is the answer to part (a) and is withheld until they commit`,
          });
        }
      }
      const marked = q.parts.flatMap((part) => part.slots).filter((sl) => (sl.response_mode ?? 'answer') === 'answer');
      if (marked.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['parts'],
          message: 'a construction must be followed by parts we can mark — a drawing alone is not a question',
        });
      }
    }
    for (const [i, part] of q.parts.entries()) {
      // TWO BOXES UNDER ONE INSTRUCTION MUST SAY WHICH IS WHICH.
      //
      // notation.ts already states the contract — the label is a KEY, and the
      // wording the student reads lives in the slot prompt — but nothing
      // enforced it, so parts reached students as an instruction followed by
      // unexplained boxes (i) and (ii). The student then has to infer the order
      // from the wording of the instruction, and a student who infers it the
      // other way round has correct answers marked wrong.
      //
      // A DESCRIPTIVE LABEL IS ITSELF THE WORDING — "centre", "factor",
      // "modal_class" are the paper's own names for the things asked for, and
      // the card shows them beside their box. Only a POSITIONAL label — i, ii,
      // a bare letter or number — names nothing, and a part built out of those
      // needs its prompts.
      //
      // A cloze part is exempt: its gaps sit inside the prose, so their
      // position IS their label.
      //
      // A figure that names the boxes is the third exemption, for the same
      // reason as the statement: a completable table prints each gap with the
      // key of the slot that fills it, so cell (ii) and box (ii) are visibly
      // the same thing and the wording lives in the table.
      const markedSlots = part.slots.filter((sl) => (sl.response_mode ?? 'answer') === 'answer');
      const namedByFigure = slotRefsNamedByVisual(q.visual);
      if (!part.statement && markedSlots.length > 1) {
        for (const [j, slot] of part.slots.entries()) {
          if ((slot.response_mode ?? 'answer') !== 'answer') continue;
          if (!isPositionalLabel(slot.label)) continue;
          if (namedByFigure.has(`${part.label}.${slot.label}`)) continue;
          if ((slot.prompt ?? '').trim() === '') {
            ctx.addIssue({
              code: 'custom',
              path: ['parts', i, 'slots', j, 'prompt'],
              message:
                'a part with more than one answer box must say what each box is for — give every slot a prompt',
            });
          }
        }
      }
      // A DECLARED FORM MUST BE PAID FOR, OR NOT DECLARED.
      //
      // R1.7 §B4 gives the form its own mark, and the generation contract has
      // asked for that row since v37 — but nothing enforced it, so the model
      // complied about half the time on every prompt version since (v46: 2
      // priced against 8 unpriced). 129 of the 256 slots declaring a format had
      // no row paying for it, which meant missing the form cost nothing and
      // still failed the answer: "9 out of 9" printed beside "Not quite".
      //
      // An unpaid format is a wish, in the same sense as any other target the
      // pipeline declares and never consumes. Either a row marks the form or
      // the question does not claim to want one.
      for (const [j, slot] of part.slots.entries()) {
        if ((slot.response_mode ?? 'answer') !== 'answer') continue;
        if (!slot.answer_format) continue;
        const ref = `${part.label}.${slot.label}`;
        if (q.rubric.some((r) => r.slot_ref === ref && r.for_format)) continue;
        ctx.addIssue({
          code: 'custom',
          path: ['parts', i, 'slots', j, 'answer_format'],
          message: `slot ${ref} declares answer_format '${slot.answer_format}' but no rubric row marks the form — add a row with for_format true, or drop the format`,
        });
      }

      const dupes = new Set(part.slots.map((s) => s.label));
      if (dupes.size !== part.slots.length) {
        ctx.addIssue({ code: 'custom', path: ['parts', i, 'slots'], message: 'slot labels must be unique within a part' });
      }
    }
    const derived = q.parts.flatMap((p) => p.slots.map((s) => s.answer)).join('; ');
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
export function deriveFinalAnswer(parts: { slots: { answer: string }[] }[]): string {
  return parts.flatMap((p) => p.slots.map((s) => s.answer)).join('; ');
}
