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
}

export const CONSTRUCT_FAMILIES: ConstructFamily[] = [
  {
    template: 'coordinateGrid',
    demand:
      'draw the graph of a linear or quadratic function over a stated domain, using a stated scale, and where the question goes on to it, a second straight line on the same axes whose intersection solves a pair of equations graphically',
    acts: [
      'Axes drawn to the scale the question states, and long enough for the whole domain',
      'Every point from the table plotted, and none outside the domain',
      'A smooth curve through the plotted points — not straight segments joining them',
      'Intercepts, the turning point and any line you were asked to add clearly labelled',
    ],
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
  },
  {
    template: 'patternFigure',
    demand: 'draw the next figure in a sequence of figures',
    acts: [
      'The figure drawn is the next one in the sequence, not a repeat of the last one shown',
      'The number of elements matches the pattern the earlier figures set',
      'The arrangement follows the same rule as the figures given',
    ],
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
