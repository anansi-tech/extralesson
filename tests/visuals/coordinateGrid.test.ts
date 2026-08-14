import { describe, expect, it } from 'vitest';
import { coordinateGrid, CoordinateGridParamsZ } from '@/lib/visuals/templates/coordinateGrid';

// ORIGINAL fixture data only (R1.5 ground truth — no CXC content anywhere).
const params = CoordinateGridParamsZ.parse({
  x_range: [-6, 6],
  y_range: [-4, 6],
  points: [{ x: -2, y: 3, label: 'P' }],
  polygons: [
    { vertices: [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 4 }], labels: ['A', 'B', 'C'], dashed: false },
    { vertices: [{ x: 4, y: -1 }, { x: 6, y: -1 }, { x: 4, y: 2 }], labels: ['A′', 'B′', 'C′'], dashed: true },
  ],
  lines: [{ m: 1, c: -2, label: 'y = x - 2' }],
});

const context = {
  stem: 'Triangle ABC is mapped onto triangle A′B′C′ by a translation.',
  partPrompts: ['State the column vector of the translation.'],
};

describe('coordinateGrid template', () => {
  it('renders deterministic SVG (snapshot)', () => {
    const svg = coordinateGrid.render(params);
    expect(svg).toContain('<svg');
    expect(svg).toContain('stroke-dasharray'); // dashed image polygon
    expect((svg.match(/<polygon points=/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(svg).toContain('P');
    expect(svg).toMatchSnapshot();
  });

  it('describe() carries every point, vertex, and line equation', () => {
    const d = coordinateGrid.describe(params);
    expect(d).toContain('(1, 1)');
    expect(d).toContain('(4, -1)');
    expect(d).toContain('A′');
    expect(d).toContain('P');
    expect(d).toContain('y = x - 2');
    expect(d).toContain('dashed');
  });

  it('verify passes on a genuine translation overlay', () => {
    expect(coordinateGrid.verify(params, context)).toEqual([]);
  });

  it('verify passes on a genuine 90° rotation about the origin', () => {
    const rotated = {
      ...params,
      polygons: [
        params.polygons[0],
        {
          // (x, y) -> (-y, x) applied to (1,1), (3,1), (1,4)
          vertices: [{ x: -1, y: 1 }, { x: -1, y: 3 }, { x: -4, y: 1 }],
          labels: ['A′', 'B′', 'C′'],
          dashed: true,
        },
      ],
    };
    expect(coordinateGrid.verify(rotated, context)).toEqual([]);
  });

  it('verify rejects a second polygon that is no standard transformation of the first', () => {
    const bad = {
      ...params,
      polygons: [
        params.polygons[0],
        { vertices: [{ x: 2, y: 5 }, { x: 4, y: 4 }, { x: 0, y: 0 }], dashed: true },
      ],
    };
    const issues = coordinateGrid.verify(bad, context);
    expect(issues.some((i) => i.includes('transformation'))).toBe(true);
  });

  it('verify rejects a point outside the visible range', () => {
    const bad = { ...params, points: [{ x: 9, y: 0 }] };
    const issues = coordinateGrid.verify(bad, context);
    expect(issues.some((i) => i.includes('outside'))).toBe(true);
  });

  it('verify rejects a line label that contradicts m and c', () => {
    const bad = { ...params, lines: [{ m: 2, c: 1, label: 'y = 3x + 1' }] };
    const issues = coordinateGrid.verify(bad, context);
    expect(issues.some((i) => i.includes('does not match'))).toBe(true);
  });
});
