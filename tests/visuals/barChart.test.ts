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

// R1.8 §4.2 — 2023 prints a bar chart with two categories drawn and three
// empty, and asks the candidate to complete it from a ratio. The completion is
// drawing and stays out of scope; the modal category, the probability and the
// pie-chart sector angle that follow are all assessable and were unreachable.
describe('barChart — the half-finished chart', () => {
  const partial = BarChartParamsZ.parse({
    y_step: 4,
    y_label: 'Number of girls',
    x_label: 'Favourite sport',
    bars: [
      { label: 'Swimming', value: null },
      { label: 'Tennis', value: null },
      { label: 'Track', value: 12 },
      { label: 'Cricket', value: 17 },
      { label: 'Football', value: null },
    ],
  });

  it('draws only the bars that exist, keeping every category label', () => {
    const svg = barChart.render(partial);
    expect((svg.match(/<rect /g) ?? []).length).toBe(2);
    for (const label of ['Swimming', 'Tennis', 'Track', 'Cricket', 'Football']) {
      expect(svg, label).toContain(label);
    }
  });

  it('scales the axis by what is drawn', () => {
    expect(barChart.render(partial)).not.toContain('NaN');
  });

  it('tells the solver which categories have no bar', () => {
    const d = barChart.describe(partial);
    expect(d).toContain('Swimming: no bar drawn');
    expect(d).toContain('Track: 12');
    expect(d).toContain('3 categories are shown with no bar');
  });

  it('refuses a chart with nothing drawn at all', () => {
    const empty = BarChartParamsZ.parse({
      y_step: 4,
      bars: [
        { label: 'A', value: null },
        { label: 'B', value: null },
      ],
    });
    expect(barChart.verify(empty, { stem: '', partPrompts: [] }).join(' ')).toContain('no bar is drawn');
  });
});
