import { describe, expect, it } from 'vitest';
import { barChart, BarChartParamsZ } from '@/lib/visuals/templates/barChart';

// ORIGINAL fixture data only.
const params = BarChartParamsZ.parse({
  title: 'Fruit sold at a market stall',
  y_label: 'Number of fruit',
  y_step: 5,
  bars: [
    { label: 'Mango', value: 20 },
    { label: 'Banana', value: 35 },
    { label: 'Guava', value: 15 },
    { label: 'Plum', value: 10 },
  ],
});

describe('barChart template', () => {
  it('renders deterministic SVG (snapshot)', () => {
    const svg = barChart.render(params);
    expect(svg).toContain('<svg');
    expect((svg.match(/<rect/g) || []).length).toBe(4);
    expect(svg).toMatchSnapshot();
  });

  it('describe() lists every bar value for the solver', () => {
    const d = barChart.describe(params);
    for (const s of ['Mango: 20', 'Banana: 35', 'Guava: 15', 'Plum: 10']) expect(d).toContain(s);
  });

  it('verify passes on consistent params', () => {
    expect(barChart.verify(params, { stem: 'x', partPrompts: [] })).toEqual([]);
  });

  it('verify rejects duplicate labels and unreadable scales', () => {
    const dup = { ...params, bars: [params.bars[0], params.bars[0]] };
    expect(barChart.verify(dup, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
    const tiny = { ...params, y_step: 0.5 };
    expect(barChart.verify(tiny, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
  });
});
