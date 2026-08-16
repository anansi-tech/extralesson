import { describe, expect, it } from 'vitest';
import { coordinateGrid, CoordinateGridParamsZ } from '@/lib/visuals/templates/coordinateGrid';
import { cumulativeFrequency, CumulativeFrequencyParamsZ } from '@/lib/visuals/templates/cumulativeFrequency';
import { travelGraph, TravelGraphParamsZ } from '@/lib/visuals/templates/travelGraph';

// R1.8 §4.1 — every graph figure in the papers carries a fine mesh under its
// unit lines. Reading "how many took at most 32 minutes", or a root at x = 1.5,
// off a grid ruled only in whole units is guesswork rather than mathematics.
describe('the paper mesh', () => {
  it('rules a coordinate grid', () => {
    const svg = coordinateGrid.render(
      CoordinateGridParamsZ.parse({ x_range: [-4, 4], y_range: [-4, 4], lines: [{ m: 1, c: 0 }] }),
    );
    expect(svg).toContain('pattern id="gridMesh"');
    expect(svg).toContain('url(#gridMesh)');
  });

  it('rules a cumulative frequency plot', () => {
    const svg = cumulativeFrequency.render(
      CumulativeFrequencyParamsZ.parse({
        x_step: 10,
        y_step: 20,
        points: [
          { x: 60, cf: 0 },
          { x: 80, cf: 4 },
          { x: 100, cf: 24 },
        ],
      }),
    );
    expect(svg).toContain('pattern id="cfMesh"');
  });

  it('rules a velocity-time graph, which is read for areas and gradients', () => {
    const svg = travelGraph.render(
      TravelGraphParamsZ.parse({
        mode: 'speed-time',
        t_unit: 's',
        v_label: 'Speed',
        v_unit: 'm/s',
        points: [
          { t: 0, v: 0 },
          { t: 60, v: 30 },
          { t: 300, v: 30 },
        ],
      }),
    );
    expect(svg).toContain('pattern id="travelMesh"');
  });

  it('leaves a sketch bare — a schematic has nothing to measure', () => {
    const svg = coordinateGrid.render(
      CoordinateGridParamsZ.parse({ named: { polygons: [{ points: ['A', 'B', 'C'] }] } }),
      { stem: 'Triangle $ABC$ has $A(1,1)$, $B(3,1)$ and $C(2,3)$.', partPrompts: [] },
    );
    expect(svg).not.toContain('gridMesh');
  });
});

describe('plotted points and half-drawn charts', () => {
  it('marks the values a candidate would have plotted on a curve', () => {
    const svg = coordinateGrid.render(
      CoordinateGridParamsZ.parse({
        x_range: [-3, 4],
        y_range: [-5, 10],
        curves: [{ a: 1, b: -1, c: -2, plotted: [-2, -1, 0, 1, 2, 3] }],
      }),
    );
    // six marks, and none of them outside the window
    expect((svg.match(/<circle[^>]*r="2.6"/g) ?? []).length).toBe(6);
  });

  it('draws a cumulative frequency plot as crosses with no curve', () => {
    const params = {
      x_step: 10,
      y_step: 20,
      points: [
        { x: 60, cf: 0 },
        { x: 80, cf: 4 },
        { x: 100, cf: 24 },
      ],
    };
    const drawn = cumulativeFrequency.render(CumulativeFrequencyParamsZ.parse(params));
    const crosses = cumulativeFrequency.render(
      CumulativeFrequencyParamsZ.parse({ ...params, points_only: true }),
    );
    expect(drawn).toContain('<polyline'); // the ogive
    expect(crosses).not.toContain('<polyline'); // the candidate draws it
    expect((crosses.match(/stroke-width="1.4"/g) ?? []).length).toBe(3);
  });

  it('still describes the data to the solver when the curve is absent', () => {
    const d = cumulativeFrequency.describe(
      CumulativeFrequencyParamsZ.parse({
        x_step: 10,
        y_step: 20,
        points_only: true,
        points: [
          { x: 60, cf: 0 },
          { x: 80, cf: 4 },
          { x: 100, cf: 24 },
        ],
      }),
    );
    expect(d).toContain('60');
    expect(d).toContain('80');
  });
});
