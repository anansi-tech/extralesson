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

// ---- quadratic curves (syllabus: draw the graph of a quadratic function,
// turning points, roots) — ORIGINAL fixture data only ----

describe('coordinateGrid — quadratic curves', () => {
  const upward = CoordinateGridParamsZ.parse({
    x_range: [-3, 5],
    y_range: [-5, 6],
    curves: [{ a: 1, b: -2, c: -3, label: 'y = x^2 - 2x - 3' }],
  });

  const downward = CoordinateGridParamsZ.parse({
    x_range: [-4, 4],
    y_range: [-6, 5],
    curves: [{ a: -1, b: 0, c: 4, label: 'y = -x^2 + 4' }],
  });

  // The linear-quadratic simultaneous archetype: y = x^2 - 2x - 3 meets
  // y = x - 3 where x^2 - 3x = 0, i.e. at (0, -3) and (3, 0).
  const withLine = CoordinateGridParamsZ.parse({
    x_range: [-3, 5],
    y_range: [-5, 6],
    curves: [{ a: 1, b: -2, c: -3, label: 'y = x^2 - 2x - 3' }],
    lines: [{ m: 1, c: -3, label: 'y = x - 3' }],
    points: [
      { x: 0, y: -3, label: 'A' },
      { x: 3, y: 0, label: 'B' },
    ],
  });

  const turningPoint = CoordinateGridParamsZ.parse({
    x_range: [-2, 6],
    y_range: [-6, 6],
    curves: [{ a: 1, b: -4, c: 0, domain: [-1, 5] }],
    points: [{ x: 2, y: -4, label: 'T' }],
  });

  const plain = { stem: 'The graph shows a curve.', partPrompts: [] };

  it('renders an upward parabola (snapshot)', () => {
    const svg = coordinateGrid.render(upward);
    expect(svg).toContain('<svg');
    expect((svg.match(/<polyline/g) ?? []).length).toBe(1);
    expect(svg).toMatchSnapshot();
  });

  it('renders a downward parabola (snapshot)', () => {
    const svg = coordinateGrid.render(downward);
    expect((svg.match(/<polyline/g) ?? []).length).toBe(1);
    expect(svg).toMatchSnapshot();
  });

  it('renders a curve and line together for the simultaneous archetype (snapshot)', () => {
    const svg = coordinateGrid.render(withLine);
    expect((svg.match(/<polyline/g) ?? []).length).toBe(1); // the curve
    expect((svg.match(/<line /g) ?? []).length).toBeGreaterThan(0); // grid + the line
    expect((svg.match(/<circle/g) ?? []).length).toBe(2); // both intersections
    expect(svg).toMatchSnapshot();
  });

  it('renders a labeled turning point over a domain-restricted curve (snapshot)', () => {
    const svg = coordinateGrid.render(turningPoint);
    expect(svg).toContain('T');
    expect(svg).toMatchSnapshot();
  });

  it('clips a curve that leaves and re-enters the window', () => {
    // y = -x^2 + 10 peaks at (0, 10), above the window, so only the two
    // flanks are visible: the path must break rather than draw across the top.
    const overTop = CoordinateGridParamsZ.parse({
      x_range: [-4, 4],
      y_range: [-5, 5],
      curves: [{ a: -1, b: 0, c: 10 }],
    });
    const runs = (coordinateGrid.render(overTop).match(/<polyline/g) ?? []).length;
    expect(runs).toBe(2);
  });

  it('describe() gives the solver the equation, not the answers it must find', () => {
    const d = coordinateGrid.describe(upward);
    expect(d).toContain('y = x^2 - 2x - 3');
    expect(d).toContain('opening upward');
    expect(coordinateGrid.describe(downward)).toContain('opening downward');
    expect(coordinateGrid.describe(turningPoint)).toContain('-1 <= x <= 5');
  });

  it('verify passes on consistent curves', () => {
    for (const p of [upward, downward, withLine, turningPoint]) {
      expect(coordinateGrid.verify(p, plain)).toEqual([]);
    }
  });

  it('verify rejects a curve label that contradicts a, b and c', () => {
    const bad = CoordinateGridParamsZ.parse({
      x_range: [-3, 5],
      y_range: [-5, 6],
      curves: [{ a: 1, b: -2, c: -3, label: 'y = x^2 + 2x - 3' }],
    });
    expect(coordinateGrid.verify(bad, plain).join(' ')).toContain('does not match the drawn curve');
  });

  it('verify rejects a = 0, which is a straight line', () => {
    const bad = CoordinateGridParamsZ.parse({
      x_range: [-3, 5],
      y_range: [-5, 6],
      curves: [{ a: 0, b: 2, c: 1 }],
    });
    expect(coordinateGrid.verify(bad, plain).join(' ')).toContain('a = 0');
  });
});

describe('coordinateGrid — features stated in the question must be true', () => {
  // y = x^2 - 2x - 3: roots -1 and 3, turning point (1, -4), y-intercept -3,
  // axis of symmetry x = 1.
  const p = CoordinateGridParamsZ.parse({
    x_range: [-3, 5],
    y_range: [-5, 6],
    curves: [{ a: 1, b: -2, c: -3 }],
  });
  const check = (stem: string) => coordinateGrid.verify(p, { stem, partPrompts: [] }).join(' ');

  it('accepts correctly stated features', () => {
    expect(check('The curve cuts the x-axis at x = -1 and x = 3.')).toBe('');
    expect(check('The turning point is (1, -4).')).toBe('');
    expect(check('The minimum point at (1, -4) is shown.')).toBe('');
    expect(check('Its axis of symmetry is x = 1.')).toBe('');
    expect(check('The y-intercept is -3.')).toBe('');
    expect(check('The curve crosses the y-axis at (0, -3).')).toBe('');
  });

  it('rejects contradicted features', () => {
    expect(check('The curve cuts the x-axis at x = -1 and x = 4.')).toContain('roots');
    expect(check('The turning point is (2, -4).')).toContain('turning point');
    expect(check('Its axis of symmetry is x = 2.')).toContain('axis of symmetry');
    expect(check('The y-intercept is 5.')).toContain('y-intercept');
  });

  it('says nothing when the question only asks for a feature', () => {
    expect(check('Find the turning point and state the roots of the curve.')).toBe('');
    expect(check('Write down the y-intercept and the axis of symmetry.')).toBe('');
  });

  it('tolerates a feature quoted to one decimal place', () => {
    // y = 2x^2 - 3x - 5 has its turning point at (0.75, -6.125).
    const rounded = CoordinateGridParamsZ.parse({
      x_range: [-3, 5],
      y_range: [-8, 6],
      curves: [{ a: 2, b: -3, c: -5 }],
    });
    expect(
      coordinateGrid.verify(rounded, {
        stem: 'The minimum point is (0.8, -6.1).',
        partPrompts: [],
      }),
    ).toEqual([]);
  });
});

// ---- shaded regions for systems of linear inequalities (ORIGINAL fixture
// data only) ----

describe('coordinateGrid — shaded inequality regions', () => {
  const plain = { stem: 'The graph shows a shaded region.', partPrompts: [] };

  // y <= 2x + 1  ->  -2x + y <= 1 ; x >= 0 ; y >= 0
  const feasible = CoordinateGridParamsZ.parse({
    x_range: [-2, 8],
    y_range: [-2, 8],
    regions: [
      {
        constraints: [
          { a: -2, b: 1, c: 1, op: 'le' },
          { a: 1, b: 0, c: 0, op: 'ge' },
          { a: 0, b: 1, c: 0, op: 'ge' },
        ],
        label: 'R',
      },
    ],
    lines: [{ m: 2, c: 1, label: 'y = 2x + 1' }],
  });

  it('renders the region as a hatched polygon under the markers (snapshot)', () => {
    const svg = coordinateGrid.render(feasible);
    expect(svg).toContain('regionHatch');
    expect(svg).toContain('fill="url(#regionHatch)"');
    expect(svg).toContain('R');
    // No colour beyond ink/white/hatch.
    expect(svg).not.toMatch(/fill="#(?!1E2430)/);
    // The region is drawn before the boundary line, so markers stay on top.
    expect(svg.indexOf('url(#regionHatch)')).toBeLessThan(svg.lastIndexOf('<line'));
    expect(svg).toMatchSnapshot();
  });

  it('emits no region markup at all when there are no regions', () => {
    const svg = coordinateGrid.render(params);
    expect(svg).not.toContain('regionHatch');
  });

  it('clips the region to the window, giving a bounded polygon', () => {
    const svg = coordinateGrid.render(feasible);
    const hatched = svg.match(/<polygon points="([^"]+)" fill="url\(#regionHatch\)"/);
    expect(hatched).not.toBeNull();
    const vertices = (hatched as RegExpMatchArray)[1].split(' ');
    // x >= 0, y >= 0, y <= 2x + 1 over [-2,8]x[-2,8] is the pentagon
    // (0,0), (8,0), (8,8), (3.5,8), (0,1) — y = 2x + 1 meets the y-axis at 1,
    // above the x-axis, so the left edge is a genuine segment.
    expect(vertices.length).toBe(5);
  });

  it('draws nothing for an empty region but still renders the grid', () => {
    const empty = CoordinateGridParamsZ.parse({
      x_range: [-4, 4],
      y_range: [-4, 4],
      regions: [
        {
          constraints: [
            { a: 1, b: 0, c: 3, op: 'ge' },
            { a: 1, b: 0, c: -3, op: 'le' },
          ],
        },
      ],
    });
    const svg = coordinateGrid.render(empty);
    expect(svg).toContain('<svg');
    expect(svg).not.toContain('fill="url(#regionHatch)"');
  });

  it('describe() states every constraint in readable form', () => {
    const d = coordinateGrid.describe(feasible);
    expect(d).toContain('y <= 2x + 1');
    expect(d).toContain('x >= 0');
    expect(d).toContain('y >= 0');
    expect(d).toContain('labelled "R"');
  });

  it('describe() reverses the inequality when b is negative', () => {
    // -y <= -4  is  y >= 4.
    const flipped = CoordinateGridParamsZ.parse({
      x_range: [-2, 8],
      y_range: [0, 8],
      regions: [{ constraints: [{ a: 0, b: -1, c: -4, op: 'le' }] }],
    });
    expect(coordinateGrid.describe(flipped)).toContain('y >= 4');
  });

  it('verify passes on a satisfiable region', () => {
    expect(coordinateGrid.verify(feasible, plain)).toEqual([]);
  });

  it('verify rejects mutually unsatisfiable constraints', () => {
    const bad = CoordinateGridParamsZ.parse({
      x_range: [-4, 4],
      y_range: [-4, 4],
      regions: [
        {
          constraints: [
            { a: 0, b: 1, c: 3, op: 'ge' },
            { a: 0, b: 1, c: 1, op: 'le' },
          ],
        },
      ],
    });
    expect(coordinateGrid.verify(bad, plain).join(' ')).toContain('not satisfiable together');
  });

  it('verify rejects a region that misses the visible window entirely', () => {
    const bad = CoordinateGridParamsZ.parse({
      x_range: [0, 6],
      y_range: [0, 6],
      regions: [{ constraints: [{ a: 1, b: 0, c: 20, op: 'ge' }] }],
    });
    expect(coordinateGrid.verify(bad, plain).join(' ')).toContain('not satisfiable together');
  });

  it('verify rejects a degenerate constraint with a = 0 and b = 0', () => {
    const bad = CoordinateGridParamsZ.parse({
      x_range: [-4, 4],
      y_range: [-4, 4],
      regions: [{ constraints: [{ a: 0, b: 0, c: 5, op: 'le' }] }],
    });
    expect(coordinateGrid.verify(bad, plain).join(' ')).toContain('a = 0 and b = 0');
  });

  it('accepts two regions and leaves the existing checks intact', () => {
    const two = CoordinateGridParamsZ.parse({
      ...feasible,
      regions: [
        feasible.regions[0],
        { constraints: [{ a: 1, b: 1, c: 6, op: 'le' }], label: 'S' },
      ],
    });
    expect(coordinateGrid.verify(two, plain)).toEqual([]);
    const svg = coordinateGrid.render(two);
    expect((svg.match(/fill="url\(#regionHatch\)"/g) ?? []).length).toBe(2);
  });
});

// A review card showed "f: y = 2x - 3" reading as "y² = 2x³ - 3": the label sat
// at the midpoint of the drawn line, which for a line crossing the window is
// essentially the origin, among the axis tick numerals — and nothing was drawn
// behind the glyphs. The window was 6 units wide by 15 tall, which with equal
// unit scales can only be drawn as a narrow column.
describe('coordinateGrid — labels stay readable, windows stay usable', () => {
  const reviewed = CoordinateGridParamsZ.parse({
    x_range: [-3, 3],
    y_range: [-5, 10],
    lines: [{ m: 2, c: -3, label: 'f: y = 2x - 3' }],
    curves: [{ a: 1, b: 0, c: 1, label: 'g: y = x^2 + 1', domain: [-3, 3] }],
  });
  const svg = coordinateGrid.render(reviewed);
  const labels = [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map(
    (m) => ({ x: Number(m[1]), y: Number(m[2]), t: m[3] }),
  );
  const [cw, ch] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)!.slice(1).map(Number);

  it('paints paper behind every label drawn over the grid', () => {
    expect(svg).toContain('paint-order="stroke fill"');
    // "x^2" is displayed as x², so match the labels as the reader sees them
    const drawn = labels.map((l) => l.t);
    expect(drawn).toContain('f: y = 2x - 3');
    expect(drawn.some((t) => t.startsWith('g: y = x'))).toBe(true);
    expect(svg).toMatch(/<text[^>]*paint-order="stroke fill"[^>]*>f: y = 2x - 3<\/text>/);
  });

  it('keeps function labels away from the crowded middle', () => {
    const axisX = labels.find((l) => l.t === 'x')!;
    const fn = labels.filter((l) => l.t.startsWith('f:') || l.t.startsWith('g:'));
    expect(fn).toHaveLength(2);
    for (const l of fn) {
      // not sitting on the origin, where the tick numerals live
      const nearOrigin = Math.abs(l.x - cw / 2) < 40 && Math.abs(l.y - axisX.y) < 40;
      expect(nearOrigin, `${l.t} sits on the origin`).toBe(false);
    }
  });

  it('keeps every label inside the canvas', () => {
    for (const l of labels) {
      expect(l.x, l.t).toBeGreaterThanOrEqual(0);
      expect(l.x, l.t).toBeLessThanOrEqual(cw);
      expect(l.y, l.t).toBeGreaterThanOrEqual(0);
      expect(l.y, l.t).toBeLessThanOrEqual(ch);
    }
  });

  it('widens a lopsided window instead of drawing a column', () => {
    expect(ch / cw).toBeLessThan(1.6);
    // the plot fills the canvas rather than floating in empty margins
    expect(cw).toBeLessThan(640);
  });

  it('only ever shows more of the plane, never less', () => {
    // every feature of the original window is still on the canvas
    expect(coordinateGrid.describe(reviewed)).toContain('-3 <= x <= 3');
    const tickValues = labels.filter((l) => /^-?\d+$/.test(l.t)).map((l) => Number(l.t));
    for (const v of [-3, 3, -5, 10]) expect(tickValues).toContain(v);
  });

  it('leaves a balanced window alone', () => {
    const square = CoordinateGridParamsZ.parse({
      x_range: [-5, 5],
      y_range: [-5, 5],
      lines: [{ m: 1, c: 0, label: 'y = x' }],
    });
    const s = coordinateGrid.render(square);
    const ticks = [...s.matchAll(/>(-?\d+)<\/text>/g)].map((m) => Number(m[1]));
    expect(Math.min(...ticks)).toBe(-5);
    expect(Math.max(...ticks)).toBe(5);
  });
});
