import type { TemplateName } from '@/lib/types';

// CONSTRUCT-THEN-INTERROGATE, the shape real Paper 2 graph questions take —
// see ROUND_1_9. The construct part is not machine-marked and leaves the graded
// pool; the interrogation parts stay auto-marked, their answers derived from
// the EQUATION and never read off the student's drawing. 15% is measured over
// the 55 questions of the five text-layer Paper 2 papers.
export const CONSTRUCT_SHARE = 0.15;

/**
 * The acts are the SELF-CHECK LIST shown at reveal beside the correct figure.
 * Per-family and fixed, because they are what the mark scheme credits for that
 * kind of drawing — not something a model invents per question.
 */
export interface ConstructFamily {
  template: TemplateName;
  demand: string;
  /** Examiner acts, in the order a student should check them. */
  acts: string[];
  /**
   * Whether the stored figure IS what the student is asked to draw. A graph is,
   * so showing it hands over part (a); a pattern is not — hiding figures 1 to 3
   * leaves the student continuing a sequence they cannot see.
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

export function constructFamily(template: TemplateName | undefined): ConstructFamily | undefined {
  return template ? BY_TEMPLATE.get(template) : undefined;
}

export function isConstructTemplate(template: TemplateName): boolean {
  return BY_TEMPLATE.has(template);
}

export function figureGivesAnswer(template: TemplateName | undefined): boolean {
  return constructFamily(template)?.figureIsAnswer ?? false;
}

// A coordinate grid carries three different drawings and an examiner credits
// different acts for each: a curve on smoothness, a region on its boundaries
// and shading, a straight line on neither. So the acts come from the params the
// question DECLARES, not from the template name, which is one name for three.
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
