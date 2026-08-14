import { z } from 'zod';

const LabelZ = z.string().min(1).max(40);
const NumericZ = z.number().finite().min(-1_000).max(1_000);

export const RenderableVisualTypeZ = z.enum([
  'geometry-figure',
  'measurement-figure',
  'coordinate-grid',
  'function-graph',
  'statistical-chart',
  'data-table',
  'number-line',
  'set-diagram',
  'transformation-grid',
  'vector-diagram',
  'bearing-diagram',
  'matrix-diagram',
  'mapping-diagram',
]);

const PointZ = z.object({
  x: NumericZ,
  y: NumericZ,
  label: LabelZ.optional(),
}).strict();

const PlotSeriesZ = z.object({
  kind: z.enum(['polyline', 'points', 'polygon', 'vector']),
  points: z.array(PointZ).min(1).max(80),
  label: LabelZ.optional(),
  style: z.enum(['solid', 'dashed']).default('solid'),
}).strict().superRefine((series, context) => {
  const minimum = series.kind === 'points' ? 1 : series.kind === 'vector' ? 2 : 2;
  if (series.points.length < minimum) {
    context.addIssue({ code: 'custom', message: `${series.kind} needs at least ${minimum} points` });
  }
  if (series.kind === 'vector' && series.points.length !== 2) {
    context.addIssue({ code: 'custom', message: 'a vector must have exactly two points' });
  }
});

const PlotVisualZ = z.object({
  format: z.literal('plot'),
  visual_type: z.enum(['coordinate-grid', 'function-graph', 'transformation-grid', 'vector-diagram']),
  alt_text: z.string().min(10).max(240),
  // Homogeneous fixed-length arrays produce a strict-output-compatible JSON
  // Schema, unlike tuple schemas (prefixItems) which the model API rejects.
  x_range: z.array(NumericZ).length(2),
  y_range: z.array(NumericZ).length(2),
  x_step: z.number().finite().positive().max(1_000),
  y_step: z.number().finite().positive().max(1_000),
  x_label: LabelZ.optional(),
  y_label: LabelZ.optional(),
  series: z.array(PlotSeriesZ).min(1).max(10),
}).strict().refine((visual) => visual.x_range[0] < visual.x_range[1], {
  message: 'x_range must be ascending',
  path: ['x_range'],
}).refine((visual) => visual.y_range[0] < visual.y_range[1], {
  message: 'y_range must be ascending',
  path: ['y_range'],
}).superRefine((visual, context) => {
  for (const [seriesIndex, series] of visual.series.entries()) {
    for (const [pointIndex, point] of series.points.entries()) {
      if (
        point.x < visual.x_range[0] || point.x > visual.x_range[1] ||
        point.y < visual.y_range[0] || point.y > visual.y_range[1]
      ) {
        context.addIssue({
          code: 'custom',
          message: 'plot point must fall inside both axis ranges',
          path: ['series', seriesIndex, 'points', pointIndex],
        });
      }
    }
  }
});

const DiagramPointZ = z.object({
  id: z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,15}$/),
  x: z.number().finite().min(0).max(100),
  y: z.number().finite().min(0).max(100),
  label: LabelZ.optional(),
}).strict();

const DiagramVisualZ = z.object({
  format: z.literal('diagram'),
  visual_type: z.enum(['geometry-figure', 'measurement-figure', 'bearing-diagram']),
  alt_text: z.string().min(10).max(240),
  points: z.array(DiagramPointZ).min(2).max(30),
  segments: z.array(z.object({
    from: z.string().min(1),
    to: z.string().min(1),
    label: LabelZ.optional(),
    style: z.enum(['solid', 'dashed']).default('solid'),
  }).strict()).max(50),
  circles: z.array(z.object({
    center: z.string().min(1),
    radius: z.number().finite().positive().max(100),
    label: LabelZ.optional(),
  }).strict()).max(8).default([]),
}).strict().superRefine((visual, context) => {
  const ids = new Set(visual.points.map((point) => point.id));
  if (ids.size !== visual.points.length) {
    context.addIssue({ code: 'custom', message: 'diagram point ids must be unique', path: ['points'] });
  }
  for (const [index, segment] of visual.segments.entries()) {
    if (!ids.has(segment.from) || !ids.has(segment.to)) {
      context.addIssue({ code: 'custom', message: 'segment endpoints must reference points', path: ['segments', index] });
    }
  }
  for (const [index, circle] of visual.circles.entries()) {
    if (!ids.has(circle.center)) {
      context.addIssue({ code: 'custom', message: 'circle center must reference a point', path: ['circles', index] });
    }
  }
});

const ChartVisualZ = z.object({
  format: z.literal('chart'),
  visual_type: z.literal('statistical-chart'),
  alt_text: z.string().min(10).max(240),
  chart_type: z.enum(['bar', 'line', 'histogram', 'pie']),
  labels: z.array(LabelZ).min(2).max(20),
  values: z.array(z.number().finite().min(-1_000_000).max(1_000_000)).min(2).max(20),
  x_label: LabelZ.optional(),
  y_label: LabelZ.optional(),
}).strict().superRefine((visual, context) => {
  if (visual.labels.length !== visual.values.length) {
    context.addIssue({ code: 'custom', message: 'chart labels and values must have equal length' });
  }
  if (visual.chart_type === 'pie' && visual.values.some((value) => value < 0)) {
    context.addIssue({ code: 'custom', message: 'pie values cannot be negative', path: ['values'] });
  }
  if (visual.chart_type === 'pie' && visual.values.reduce((sum, value) => sum + value, 0) <= 0) {
    context.addIssue({ code: 'custom', message: 'pie values must have a positive total', path: ['values'] });
  }
});

const TableVisualZ = z.object({
  format: z.literal('table'),
  visual_type: z.literal('data-table'),
  alt_text: z.string().min(10).max(240),
  headers: z.array(LabelZ).min(1).max(10),
  rows: z.array(z.array(z.string().max(60)).max(10)).min(1).max(30),
}).strict().superRefine((visual, context) => {
  for (const [index, row] of visual.rows.entries()) {
    if (row.length !== visual.headers.length) {
      context.addIssue({ code: 'custom', message: 'table row width must match headers', path: ['rows', index] });
    }
  }
});

const NumberLineVisualZ = z.object({
  format: z.literal('number-line'),
  visual_type: z.literal('number-line'),
  alt_text: z.string().min(10).max(240),
  min: NumericZ,
  max: NumericZ,
  step: z.number().finite().positive().max(1_000),
  markers: z.array(z.object({
    value: NumericZ,
    label: LabelZ.optional(),
    style: z.enum(['point', 'open', 'closed']),
  }).strict()).max(20).default([]),
  intervals: z.array(z.object({
    from: NumericZ,
    to: NumericZ,
    from_closed: z.boolean(),
    to_closed: z.boolean(),
  }).strict()).max(6).default([]),
}).strict().superRefine((visual, context) => {
  if (visual.min >= visual.max) context.addIssue({ code: 'custom', message: 'number-line range must be ascending' });
  for (const [index, marker] of visual.markers.entries()) {
    if (marker.value < visual.min || marker.value > visual.max) {
      context.addIssue({ code: 'custom', message: 'marker must fall inside the number-line range', path: ['markers', index] });
    }
  }
  for (const [index, interval] of visual.intervals.entries()) {
    if (interval.from >= interval.to) {
      context.addIssue({ code: 'custom', message: 'interval must be ascending', path: ['intervals', index] });
    }
    if (interval.from < visual.min || interval.to > visual.max) {
      context.addIssue({ code: 'custom', message: 'interval must fall inside the number-line range', path: ['intervals', index] });
    }
  }
});

const SetDiagramVisualZ = z.object({
  format: z.literal('set-diagram'),
  visual_type: z.literal('set-diagram'),
  alt_text: z.string().min(10).max(240),
  universal_label: LabelZ.default('U'),
  sets: z.array(z.object({
    id: z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,15}$/),
    label: LabelZ,
    values: z.array(LabelZ).max(12),
  }).strict()).min(1).max(3),
  outside_values: z.array(LabelZ).max(12).default([]),
}).strict().refine((visual) => new Set(visual.sets.map((set) => set.id)).size === visual.sets.length, {
  message: 'set ids must be unique',
  path: ['sets'],
});

const MatrixVisualZ = z.object({
  format: z.literal('matrix'),
  visual_type: z.literal('matrix-diagram'),
  alt_text: z.string().min(10).max(240),
  matrices: z.array(z.object({
    label: LabelZ.optional(),
    entries: z.array(z.array(z.string().min(1).max(24)).min(1).max(6)).min(1).max(6),
  }).strict().refine(
    (matrix) => new Set(matrix.entries.map((row) => row.length)).size === 1,
    { message: 'matrix rows must have equal length', path: ['entries'] },
  )).min(1).max(4),
  operators: z.array(z.enum(['+', '-', '×', '='])).max(3).default([]),
}).strict().refine(
  (visual) => visual.operators.length === Math.max(0, visual.matrices.length - 1),
  { message: 'matrix operators must connect adjacent matrices', path: ['operators'] },
);

const MappingVisualZ = z.object({
  format: z.literal('mapping'),
  visual_type: z.literal('mapping-diagram'),
  alt_text: z.string().min(10).max(240),
  left_label: LabelZ,
  right_label: LabelZ,
  left_values: z.array(LabelZ).min(1).max(12),
  right_values: z.array(LabelZ).min(1).max(12),
  arrows: z.array(z.object({
    from: z.number().int().nonnegative(),
    to: z.number().int().nonnegative(),
  }).strict()).min(1).max(30),
}).strict().superRefine((visual, context) => {
  for (const [index, arrow] of visual.arrows.entries()) {
    if (arrow.from >= visual.left_values.length || arrow.to >= visual.right_values.length) {
      context.addIssue({ code: 'custom', message: 'mapping arrow index is out of range', path: ['arrows', index] });
    }
  }
});

export const QuestionVisualZ = z.union([
  PlotVisualZ,
  DiagramVisualZ,
  ChartVisualZ,
  TableVisualZ,
  NumberLineVisualZ,
  SetDiagramVisualZ,
  MatrixVisualZ,
  MappingVisualZ,
]);

export type QuestionVisual = z.infer<typeof QuestionVisualZ>;
