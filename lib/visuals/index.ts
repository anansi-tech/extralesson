import type { TemplateName } from '@/lib/types';
import type { VerifyContext, VisualTemplate } from './types';
import { zodDoc } from './zod-doc';
import { barChart } from './templates/barChart';
import { bearingDiagram } from './templates/bearingDiagram';
import { circleCenter } from './templates/circleCenter';
import { compositeShape } from './templates/compositeShape';
import { coordinateGrid } from './templates/coordinateGrid';
import { cumulativeFrequency } from './templates/cumulativeFrequency';
import { dataTable } from './templates/dataTable';
import { histogram } from './templates/histogram';
import { numberLine } from './templates/numberLine';
import { parallelTransversal } from './templates/parallelTransversal';
import { patternFigure } from './templates/patternFigure';
import { pieChart } from './templates/pieChart';
import { polygonMarkedAngle } from './templates/polygonMarkedAngle';
import { travelGraph } from './templates/travelGraph';
import { triangleLabeled } from './templates/triangleLabeled';
import { vectorFigure } from './templates/vectorFigure';
import { venn2 } from './templates/venn2';

// R1.5 §3 — the 15 SVG templates + dataTable (semantic HTML).
export const TEMPLATES: Record<TemplateName, VisualTemplate<never>> = {
  triangleLabeled,
  circleCenter,
  parallelTransversal,
  polygonMarkedAngle,
  coordinateGrid,
  travelGraph,
  barChart,
  pieChart,
  histogram,
  cumulativeFrequency,
  venn2,
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
      const rules = (t.rules ?? []).map((r) => `\n    · ${r}`).join('');
      return `- ${n} params: ${zodDoc(t.paramsSchema)}${rules ? `\n  ${n} rules (violations auto-reject the draft):${rules}` : ''}`;
    })
    .join('\n');
}

export function renderVisual(visual: StoredVisual): string {
  const t = TEMPLATES[visual.template];
  const params = t.paramsSchema.parse(visual.params);
  return t.render(params as never);
}

export function describeVisual(visual: StoredVisual): string {
  const t = TEMPLATES[visual.template];
  const params = t.paramsSchema.parse(visual.params);
  return t.describe(params as never);
}

export type { VerifyContext };
