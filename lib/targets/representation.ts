import type { Representation, TemplateName } from '@/lib/types';

// Per-topic representation targets (R1.5 §4), transcribed from the corpus
// aggregates in design/research/question-corpus-classification.json. Corpus
// categories are mapped onto the schema's Representation enum; the residual
// share (unlisted categories) goes to prose except for topics the spec marks
// "always visual" / "visuals ~96", where it goes to the listed visual
// categories. Template hints steer the model toward the right template within
// a representation.

export interface RepresentationTarget {
  representation: Representation;
  share: number; // percent, sums to 100 per topic
  template_hints: TemplateName[];
}

export const REPRESENTATION_TARGETS: Record<string, RepresentationTarget[]> = {
  // M1.1 NT&C (n=29): prose 37 / pattern-figure 31 / table 13, residual→prose
  'M1-NTC': [
    { representation: 'prose', share: 56, template_hints: [] },
    { representation: 'diagram', share: 31, template_hints: ['patternFigure'] },
    { representation: 'table', share: 13, template_hints: ['dataTable'] },
  ],
  // M1.2 Consumer (n=11): prose 63 / table 27, residual→prose
  'M1-CONS': [
    { representation: 'prose', share: 73, template_hints: [] },
    { representation: 'table', share: 27, template_hints: ['dataTable'] },
  ],
  // M1.3 Sets (n=3, low-n): venn-dominant (documented judgment on low n)
  'M1-SETS': [
    { representation: 'venn', share: 70, template_hints: ['vennDiagram'] },
    { representation: 'prose', share: 30, template_hints: [] },
  ],
  // M1.4 Measurement (n=26): visuals ~96 (measurement 42 / geometry 34 / graph 15)
  'M1-MEAS': [
    {
      representation: 'diagram',
      share: 81,
      template_hints: ['compositeShape', 'triangleLabeled', 'quadrilateralLabeled', 'polygonMarkedAngle', 'circleCenter'],
    },
    { representation: 'graph', share: 15, template_hints: ['travelGraph', 'coordinateGrid'] },
    { representation: 'prose', share: 4, template_hints: [] },
  ],
  // M1.5 Algebra 1 (n=27): pattern-figure 40 / prose 22 / table 14 / number-line 11
  'M1-ALG1': [
    { representation: 'diagram', share: 51, template_hints: ['patternFigure', 'numberLine'] },
    { representation: 'prose', share: 35, template_hints: [] },
    { representation: 'table', share: 14, template_hints: ['dataTable'] },
  ],
  // M1.6 Graphs (n=6): always visual (grid 66 / graph 33)
  'M1-GRAPHS': [
    { representation: 'graph', share: 100, template_hints: ['coordinateGrid', 'travelGraph'] },
  ],
  // M2.1 Stats 1 (n=7): always visual (table 57 / chart 42)
  'M2-STAT1': [
    { representation: 'table', share: 58, template_hints: ['dataTable'] },
    { representation: 'chart', share: 42, template_hints: ['barChart', 'pieChart', 'histogram'] },
  ],
  // M2.2 Algebra 2 (n=17): prose 41 / figure 23 / number-line 11 / graph 11
  'M2-ALG2': [
    { representation: 'prose', share: 55, template_hints: [] },
    { representation: 'diagram', share: 34, template_hints: ['patternFigure', 'numberLine'] },
    { representation: 'graph', share: 11, template_hints: ['coordinateGrid'] },
  ],
  // M2.3 RFG 1 (n=25): graph 40 / grid 32 / prose 12, residual→graph
  'M2-RFG1': [
    { representation: 'graph', share: 88, template_hints: ['coordinateGrid', 'travelGraph'] },
    { representation: 'prose', share: 12, template_hints: [] },
  ],
  // M2.4 Geo&Trig 1 (n=29): figure 79
  'M2-GEO1': [
    {
      representation: 'diagram',
      share: 79,
      template_hints: ['triangleLabeled', 'compoundTriangle', 'parallelTransversal', 'quadrilateralLabeled', 'polygonMarkedAngle', 'circleCenter', 'compositeShape'],
    },
    { representation: 'prose', share: 21, template_hints: [] },
  ],
  // M2.5 V&M 1 (n=7): mostly prose-notation + occasional vector figure
  'M2-VM1': [
    { representation: 'prose', share: 80, template_hints: [] },
    { representation: 'graph', share: 20, template_hints: ['coordinateGrid'] },
  ],
  // M3.1 Stats 2 (n=11): always visual (table 63 / chart 36)
  'M3-STAT2': [
    { representation: 'table', share: 64, template_hints: ['dataTable'] },
    {
      representation: 'chart',
      share: 36,
      template_hints: ['histogram', 'cumulativeFrequency', 'pieChart'],
    },
  ],
  // M3.2 RFG 2 (n=13): grid 38 / graph 38 / prose 15, residual→graph
  'M3-RFG2': [
    {
      representation: 'graph',
      share: 85,
      template_hints: ['coordinateGrid', 'travelGraph', 'cumulativeFrequency'],
    },
    { representation: 'prose', share: 15, template_hints: [] },
  ],
  // M3.3 Geo&Trig 2 (n=26): figure 61 / transformation 15 / bearing 7, residual→diagram
  'M3-GEO2': [
    {
      representation: 'diagram',
      share: 85,
      template_hints: ['triangleLabeled', 'circleCenter', 'bearingDiagram', 'compositeShape', 'coordinateGrid'],
    },
    { representation: 'graph', share: 15, template_hints: ['coordinateGrid'] },
  ],
  // M3.4 V&M 2 (n=15): prose-notation / vector figure / grid
  'M3-VM2': [
    { representation: 'prose', share: 50, template_hints: [] },
    { representation: 'graph', share: 50, template_hints: ['coordinateGrid'] },
  ],
};

// Archetype targets (R1.5 §4). Structured shares are spec-stated; the MCQ
// split is a documented assumption from the corpus aggregate (single-part
// questions skew to direct procedures; concept-recognition folds into
// direct-procedure since the R1.5 enum dropped it).
export const STRUCTURED_ARCHETYPE_TARGETS: Record<string, number> = {
  'multi-step-application': 67,
  justification: 11,
  interpretation: 11,
  'reverse-reasoning': 9,
  'direct-procedure': 2,
};

export const MCQ_ARCHETYPE_TARGETS: Record<string, number> = {
  'direct-procedure': 45,
  'multi-step-application': 25,
  interpretation: 20,
  'reverse-reasoning': 10,
};

// 37% of MCQs carry a visual (R1.5 §4), biased to these topics.
export const MCQ_VISUAL_SHARE = 0.37;
export const MCQ_VISUAL_BIAS_TOPICS = new Set([
  'M1-SETS',
  'M1-MEAS',
  'M1-GRAPHS',
  'M2-STAT1',
  'M2-RFG1',
  'M2-GEO1',
  'M3-STAT2',
  'M3-RFG2',
  'M3-GEO2',
]);


// Objectives whose work lives on a coordinate plane: an object and its image, a
// translation vector, a described transformation. A labelled sketch cannot
// place those points, and a question that states them needs a grid — so the
// representation search weights 'graph' up for these rather than forbidding
// anything, which would only teach the model to avoid the shapes.
export const GRID_BIASED_OBJECTIVES = new Set([
  'M3.3.2', // translations as vectors
  'M3.3.3', // image of an object, or the object given the image
  'M3.3.4', // relationship between object and image
  'M3.3.5', // describe a transformation from object and image
  'M3.3.6', // combination of transformations
]);

// Enough to lead a diagram-heavy topic on an empty bank (M3-GEO2 is 85/15), and
// no more: every plotted question raises the graph actual, so the lead erodes
// and a real surplus hands the next recipe back to the sketches.
export const GRID_BIAS = 80;
