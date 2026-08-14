import { describe, expect, it } from 'vitest';
import {
  cumulativeFrequency,
  CumulativeFrequencyParamsZ,
} from '@/lib/visuals/templates/cumulativeFrequency';

// ORIGINAL fixture data only.
const params = CumulativeFrequencyParamsZ.parse({
  title: 'Times taken to solve a puzzle',
  x_label: 'Time (minutes)',
  y_label: 'Cumulative frequency',
  x_step: 10,
  y_step: 10,
  points: [
    { x: 10, cf: 0 },
    { x: 20, cf: 6 },
    { x: 30, cf: 18 },
    { x: 40, cf: 34 },
    { x: 50, cf: 44 },
    { x: 60, cf: 48 },
  ],
  guides: [{ label: 'Median', x: 32, y: 24 }],
});

describe('cumulativeFrequency template', () => {
  it('renders deterministic SVG (snapshot)', () => {
    const svg = cumulativeFrequency.render(params);
    expect(svg).toContain('<svg');
    expect((svg.match(/<polyline/g) || []).length).toBe(1);
    expect((svg.match(/<circle/g) || []).length).toBe(6);
    expect((svg.match(/stroke-dasharray/g) || []).length).toBe(2); // guide lines
    expect(svg).toMatchSnapshot();
  });

  it('describe() lists every plotted point and guide for the solver', () => {
    const d = cumulativeFrequency.describe(params);
    for (const s of ['(10, 0)', '(20, 6)', '(30, 18)', '(40, 34)', '(50, 44)', '(60, 48)']) {
      expect(d).toContain(s);
    }
    expect(d).toContain('Median');
    expect(d).toContain('32');
    expect(d).toContain('24');
  });

  it('verify passes on consistent params', () => {
    expect(cumulativeFrequency.verify(params, { stem: 'x', partPrompts: [] })).toEqual([]);
  });

  it('verify rejects decreasing cumulative frequencies', () => {
    const bad = {
      ...params,
      points: params.points.map((pt) => (pt.x === 40 ? { x: 40, cf: 12 } : pt)),
    };
    expect(cumulativeFrequency.verify(bad, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
  });

  it('verify rejects non-ascending x values and out-of-range guides', () => {
    const badX = {
      ...params,
      points: params.points.map((pt) => (pt.x === 30 ? { x: 20, cf: 18 } : pt)),
    };
    expect(cumulativeFrequency.verify(badX, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
    const badGuide = { ...params, guides: [{ label: 'Median', x: 95, y: 60 }] };
    expect(
      cumulativeFrequency.verify(badGuide, { stem: 'x', partPrompts: [] }).length,
    ).toBeGreaterThanOrEqual(2);
  });
});
