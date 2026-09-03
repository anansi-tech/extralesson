import type { TemplateName } from '@/lib/types';
import type { VerifyContext, VisualTemplate } from './types';
import { zodDoc } from './zod-doc';
import { barChart } from './templates/barChart';
import { bearingDiagram } from './templates/bearingDiagram';
import { circleCenter } from './templates/circleCenter';
import { compositeShape } from './templates/compositeShape';
import { compoundTriangle } from './templates/compoundTriangle';
import { coordinateGrid } from './templates/coordinateGrid';
import { cumulativeFrequency } from './templates/cumulativeFrequency';
import { dataTable } from './templates/dataTable';
import { histogram } from './templates/histogram';
import { numberLine } from './templates/numberLine';
import { parallelTransversal } from './templates/parallelTransversal';
import { patternFigure } from './templates/patternFigure';
import { pieChart } from './templates/pieChart';
import { polygonMarkedAngle } from './templates/polygonMarkedAngle';
import { quadrilateralLabeled } from './templates/quadrilateralLabeled';
import { travelGraph } from './templates/travelGraph';
import { triangleLabeled } from './templates/triangleLabeled';
import { vectorFigure } from './templates/vectorFigure';
import { vennDiagram } from './templates/vennDiagram';

// ROUND_1_5 §3 — the 15 SVG templates + dataTable (semantic HTML).
export const TEMPLATES: Record<TemplateName, VisualTemplate<never>> = {
  triangleLabeled,
  compoundTriangle,
  circleCenter,
  parallelTransversal,
  polygonMarkedAngle,
  quadrilateralLabeled,
  coordinateGrid,
  travelGraph,
  barChart,
  pieChart,
  histogram,
  cumulativeFrequency,
  vennDiagram,
  compositeShape,
  patternFigure,
  numberLine,
  bearingDiagram,
  vectorFigure,
  dataTable,
} as Record<TemplateName, VisualTemplate<never>>;

export interface StoredVisual {
  template: TemplateName;
  params: unknown;
}

export function paramsDocFor(names: TemplateName[]): string {
  return names
    .map((n) => {
      const t = TEMPLATES[n];
      const positional = t.placesOwnPoints
        ? '\n    · this template PLACES ITS OWN POINTS: label order decides where each one is drawn. Use it only for a question that states no positions — angles, side lengths and relationships. A question naming coordinates needs coordinateGrid with a "named" block.'
        : '';
      const rules = positional + (t.rules ?? []).map((r) => `\n    · ${r}`).join('');
      return `- ${n} params: ${zodDoc(t.paramsSchema)}${rules ? `\n  ${n} rules (violations auto-reject the draft):${rules}` : ''}`;
    })
    .join('\n');
}

// Figures that ARE to scale: anything plotted against axes or drawn in
// proportion. Everything else is a schematic — the shape is indicative and only
// the labels are data.
const DRAWN_TO_SCALE = new Set<TemplateName>([
  'coordinateGrid',
  'travelGraph',
  'barChart',
  'histogram',
  'cumulativeFrequency',
  'pieChart',
  'numberLine',
  'dataTable',
]);

/**
 * "Not drawn to scale" under every schematic figure: CXC prints it in every
 * paper's instructions, and our sketch templates place their own vertices, so
 * nothing may be measured off them.
 */
export function renderVisual(visual: StoredVisual, context?: VerifyContext): string {
  const t = TEMPLATES[visual.template];
  const params = t.paramsSchema.parse(visual.params);
  const svg = t.render(params as never, context);
  // A coordinateGrid in sketch mode has no axes to be read against, so it
  // carries the caption like any other schematic.
  const isSketch =
    visual.template === 'coordinateGrid' &&
    (visual.params as { named?: { sketch?: boolean } })?.named?.sketch !== false &&
    Boolean((visual.params as { named?: unknown })?.named);
  if (DRAWN_TO_SCALE.has(visual.template) && !isSketch) return svg;
  return `${svg}<p class="figure-note">Not drawn to scale</p>`;
}

/**
 * The GIVEN data of a question whose one visual slot is already spoken for: an
 * ogive asks for the curve, so the curve is withheld (see figureGivesAnswer)
 * and the table it is drawn from has nowhere else to live.
 */
export function renderStimulusTable(params: unknown, context?: VerifyContext): string {
  return renderVisual({ template: 'dataTable', params: params as never }, context);
}

export function describeStimulusTable(params: unknown, context?: VerifyContext): string {
  return describeVisual({ template: 'dataTable', params: params as never }, context);
}

export function describeVisual(visual: StoredVisual, context?: VerifyContext): string {
  const t = TEMPLATES[visual.template];
  const params = t.paramsSchema.parse(visual.params);
  return t.describe(params as never, context);
}

export type { VerifyContext };
