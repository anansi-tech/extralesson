import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import QuestionVisualFigure from '@/app/components/question-visual';
import { QuestionVisualZ, type QuestionVisual } from '@/lib/validation/question-visual';

const visuals: QuestionVisual[] = [
  QuestionVisualZ.parse({
    format: 'plot', visual_type: 'function-graph', alt_text: 'A line passing through two labelled points.',
    x_range: [-2, 4], y_range: [-2, 6], x_step: 1, y_step: 1,
    series: [{ kind: 'polyline', points: [{ x: -1, y: 0 }, { x: 3, y: 4 }], label: 'f' }],
  }),
  QuestionVisualZ.parse({
    format: 'diagram', visual_type: 'geometry-figure', alt_text: 'A triangle with three labelled vertices.',
    points: [{ id: 'A', x: 10, y: 80 }, { id: 'B', x: 50, y: 10 }, { id: 'C', x: 90, y: 80 }],
    segments: [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'C', to: 'A' }],
  }),
  QuestionVisualZ.parse({
    format: 'chart', visual_type: 'statistical-chart', alt_text: 'A bar chart showing three frequencies.',
    chart_type: 'bar', labels: ['A', 'B', 'C'], values: [4, 7, 5],
  }),
  QuestionVisualZ.parse({
    format: 'table', visual_type: 'data-table', alt_text: 'A two-column table of values.',
    headers: ['x', 'y'], rows: [['1', '3'], ['2', '5']],
  }),
  QuestionVisualZ.parse({
    format: 'number-line', visual_type: 'number-line', alt_text: 'A number line with one closed interval.',
    min: -3, max: 5, step: 1, intervals: [{ from: -1, to: 3, from_closed: true, to_closed: false }],
  }),
  QuestionVisualZ.parse({
    format: 'set-diagram', visual_type: 'set-diagram', alt_text: 'Two labelled sets inside a universal set.',
    sets: [{ id: 'A', label: 'A', values: ['1', '2'] }, { id: 'B', label: 'B', values: ['2', '3'] }],
  }),
  QuestionVisualZ.parse({
    format: 'matrix', visual_type: 'matrix-diagram', alt_text: 'Two matrices joined by an equals sign.',
    matrices: [{ entries: [['1', '2'], ['3', '4']] }, { entries: [['5'], ['6']] }], operators: ['='],
  }),
  QuestionVisualZ.parse({
    format: 'mapping', visual_type: 'mapping-diagram', alt_text: 'A mapping from two domain values to two range values.',
    left_label: 'Domain', right_label: 'Range', left_values: ['1', '2'], right_values: ['3', '4'],
    arrows: [{ from: 0, to: 1 }, { from: 1, to: 0 }],
  }),
];

describe('question visual boundary and renderer', () => {
  it('accepts every supported rendering format', () => {
    expect(visuals).toHaveLength(8);
    for (const visual of visuals) expect(QuestionVisualZ.safeParse(visual).success).toBe(true);
  });

  it('rejects malformed references and raw executable fields', () => {
    expect(QuestionVisualZ.safeParse({
      format: 'diagram', visual_type: 'geometry-figure', alt_text: 'A malformed geometry diagram.',
      points: [{ id: 'A', x: 10, y: 10 }, { id: 'B', x: 20, y: 20 }],
      segments: [{ from: 'A', to: 'C' }],
    }).success).toBe(false);
    expect(QuestionVisualZ.safeParse({
      ...visuals[0],
      svg: '<svg onload="alert(1)"></svg>',
    }).success).toBe(false);
  });

  it('renders first-party markup and escapes data labels', () => {
    const visual = QuestionVisualZ.parse({
      format: 'table', visual_type: 'data-table', alt_text: 'A table containing an unsafe-looking label.',
      headers: ['Value'], rows: [['<script>alert(1)</script>']],
    });
    const html = renderToStaticMarkup(<QuestionVisualFigure visual={visual} />);
    expect(html).toContain('<table');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>');
  });
});
