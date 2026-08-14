import { describe, expect, it } from 'vitest';
import { pieChart, PieChartParamsZ } from '@/lib/visuals/templates/pieChart';

// ORIGINAL fixture data only.
const params = PieChartParamsZ.parse({
  title: 'How Keisha spends a school day',
  mode: 'degrees',
  sectors: [
    { label: 'Sleep', value: 135 },
    { label: 'School', value: 105 },
    { label: 'Homework', value: 45 },
    { label: 'Recreation', value: 75 },
  ],
});

describe('pieChart template', () => {
  it('renders deterministic SVG (snapshot)', () => {
    const svg = pieChart.render(params);
    expect(svg).toContain('<svg');
    expect((svg.match(/<path/g) || []).length).toBe(4);
    expect(svg).toContain('pieHatch');
    expect(svg).toMatchSnapshot();
  });

  it('describe() lists every sector label and value for the solver', () => {
    const d = pieChart.describe(params);
    for (const s of ['Sleep: 135°', 'School: 105°', 'Homework: 45°', 'Recreation: 75°']) {
      expect(d).toContain(s);
    }
  });

  it('verify passes on consistent params', () => {
    expect(pieChart.verify(params, { stem: 'x', partPrompts: [] })).toEqual([]);
    const percent = PieChartParamsZ.parse({
      mode: 'percent',
      sectors: [
        { label: 'Bus', value: 40 },
        { label: 'Walk', value: 35 },
        { label: 'Car', value: 25 },
      ],
    });
    expect(pieChart.verify(percent, { stem: 'x', partPrompts: [] })).toEqual([]);
  });

  it('verify rejects angles not summing to 360', () => {
    const bad = { ...params, sectors: [...params.sectors.slice(0, 3), { label: 'Recreation', value: 60 }] };
    expect(pieChart.verify(bad, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
  });

  it('verify rejects percentages not summing to 100 and duplicate labels', () => {
    const badPercent = PieChartParamsZ.parse({
      mode: 'percent',
      sectors: [
        { label: 'Bus', value: 40 },
        { label: 'Walk', value: 35 },
      ],
    });
    expect(pieChart.verify(badPercent, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
    const dup = { ...params, sectors: [params.sectors[0], { ...params.sectors[0], value: 225 }] };
    expect(pieChart.verify(dup, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
  });
});
