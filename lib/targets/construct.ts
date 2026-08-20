import type { TemplateName } from '@/lib/types';

// CONSTRUCT-THEN-INTERROGATE — the shape the real Paper 2 uses for its graph
// questions. The question opens by asking the candidate to DRAW something on
// graph paper ("using a scale of 2 cm to 1 unit, draw the graph of
// y = x^2 + x - 2 for -3 <= x <= 2") and the parts that follow interrogate what
// they drew: state the roots, the y-intercept, the minimum, the axis of
// symmetry; draw a second line on the same axes and hence solve the pair.
//
// The construct part is not machine-marked. It leaves the graded pool exactly
// as a show_that or explain slot does, and the interrogation parts stay
// auto-marked — so the student gets the paper's real shape and we mark the
// marks we can mark. Their answers are derived from the EQUATION and checked
// symbolically; nothing is ever read off the student's drawing.
//
// SHARE — measured, not assumed. Five May/June Paper 2 papers carry a usable
// text layer (2016-2019, 2021; the other ten reference papers are image-only).
// Over their 55 questions, 8 set a construct part in one of the four families
// below — 15%. Counting every construct demand, in-family or not, gives 11 of
// 55 (20%): the difference is a histogram and a Venn diagram, which are
// draw-then-read in the papers but which we set as read-only, and which this
// target deliberately does not claim.
//
// Instrument constructions — ruler-and-compasses bisectors, perpendiculars,
// triangle construction — stay out of scope entirely and are not a family here.
export const CONSTRUCT_SHARE = 0.15;

/**
 * What a construct question may ask for, and what an examiner looks for when
 * marking the drawing.
 *
 * The acts are the SELF-CHECK LIST shown at reveal beside the correct figure.
 * They are per-family and fixed, because they are what the mark scheme credits
 * for that kind of drawing — not something a model should be inventing per
 * question, and not something that can be read out of the params.
 */
export interface ConstructFamily {
  template: TemplateName;
  /** What the opening part asks the student to draw. */
  demand: string;
  /** Examiner acts, in the order a student should check them. */
  acts: string[];
  /**
   * Whether the stored figure IS what the student is asked to draw.
   *
   * For a graph it is: the params carry the curve and the line, so showing it
   * hands over part (a) and every read that follows. For a pattern it is NOT —
   * the params carry figures 1 to 3, which are the question's premise, and the
   * figure the student draws is figure 4, which is nowhere in them. Hiding that
   * leaves them asked to continue a sequence they cannot see.
   */
  figureIsAnswer: boolean;
}

export const CONSTRUCT_FAMILIES: ConstructFamily[] = [
  {
    template: 'coordinateGrid',
    demand:
      'draw the graph of a linear or quadratic function over a stated domain, using a stated scale, and where the question goes on to it, a second straight line on the same axes whose intersection solves a pair of equations graphically; or draw and shade the region satisfying a set of inequalities',
    acts: [
      'Axes drawn to the scale the question states, and long enough for the whole domain',
      'Every point from the table plotted, and none outside the domain',
      'A smooth curve through the plotted points — not straight segments joining them',
      'Intercepts, the turning point and any line you were asked to add clearly labelled',
    ],
    figureIsAnswer: true,
  },
  {
    template: 'travelGraph',
    demand:
      'draw a distance-time or speed-time graph from a described journey, using a stated scale',
    acts: [
      'Axes drawn to the scale the question states, with the quantity and its unit on each',
      'Each stage of the journey drawn as a straight segment between the right two times',
      'Rest periods drawn horizontal, and the graph continuous from stage to stage',
      'The end of the journey at the stated total distance or time',
    ],
    figureIsAnswer: true,
  },
  {
    template: 'cumulativeFrequency',
    demand:
      'draw a cumulative frequency curve from a frequency table, using a stated scale, and read quartiles or a median from it',
    acts: [
      'Cumulative frequencies formed by running totals, ending at the total frequency',
      'Each point plotted at the UPPER class boundary, never at the midpoint',
      'A smooth increasing curve through the points, starting at the lower boundary of the first class',
      'The reads you were asked for shown on the curve with dotted lines to the axes',
    ],
    figureIsAnswer: true,
  },
  {
    template: 'patternFigure',
    demand: 'draw the next figure in a sequence of figures',
    acts: [
      'The figure drawn is the next one in the sequence, not a repeat of the last one shown',
      'The number of elements matches the pattern the earlier figures set',
      'The arrangement follows the same rule as the figures given',
    ],
    // The figures shown are the ones GIVEN. The one drawn is the next.
    figureIsAnswer: false,
  },
];

const BY_TEMPLATE = new Map(CONSTRUCT_FAMILIES.map((f) => [f.template, f]));

/** The family a template belongs to, or undefined if it is not a construct family. */
export function constructFamily(template: TemplateName | undefined): ConstructFamily | undefined {
  return template ? BY_TEMPLATE.get(template) : undefined;
}

export function isConstructTemplate(template: TemplateName): boolean {
  return BY_TEMPLATE.has(template);
}

/** Whether showing this question's figure would hand over its answer. */
export function figureGivesAnswer(template: TemplateName | undefined): boolean {
  return constructFamily(template)?.figureIsAnswer ?? false;
}

// A coordinate grid carries three quite different drawings and an examiner
// credits different acts for each: a curve is marked on its smoothness, a
// region on its boundaries and its shading, a straight line on neither. The
// acts therefore come from the params the question DECLARES — `curves`,
// `regions`, `lines` — and not from the template name, which is the same for
// all three. Every other family draws one thing, so its own list stands.
const GRID_ACTS = {
  regions: [
    'Axes drawn to the scale the question states, covering the whole range given',
    'Each boundary line drawn correctly, and drawn solid or broken as its inequality requires',
    'The correct side of every boundary shaded, including $x \\ge 0$ and $y \\ge 0$',
    'The region satisfying ALL the inequalities identified and labelled',
  ],
  lines: [
    'Axes drawn to the scale the question states, covering the whole range given',
    'Each line drawn through points you worked out, not sketched by eye',
    'Every line labelled with its equation',
    'Any intersection the question asks about marked and read off',
  ],
} as const;

/** The self-check list for a question's construction, from its declared visual. */
export function constructActs(visual?: { template: TemplateName; params?: Record<string, unknown> }): string[] {
  const family = constructFamily(visual?.template);
  if (!family) return [];
  if (family.template !== 'coordinateGrid') return family.acts;
  const params = (visual?.params ?? {}) as Record<string, unknown[]>;
  if (Array.isArray(params.curves) && params.curves.length > 0) return family.acts;
  if (Array.isArray(params.regions) && params.regions.length > 0) return [...GRID_ACTS.regions];
  if (Array.isArray(params.lines) && params.lines.length > 0) return [...GRID_ACTS.lines];
  return family.acts;
}
