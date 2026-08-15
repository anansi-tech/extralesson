import { describe, expect, it } from 'vitest';
import {
  parseSectorValue,
  pieChart,
  PieChartParamsZ,
  solveUnknown,
} from '@/lib/visuals/templates/pieChart';

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

// ---- algebraic sector values: "the angles are x, 2x, 3x and 90°; find x"
// (ORIGINAL fixture data only) ----

const ctx = { stem: 'x', partPrompts: [] };

describe('pieChart — parseSectorValue', () => {
  it('parses plain numbers and numeric strings as constants', () => {
    expect(parseSectorValue(90)).toEqual({ coefficient: 0, constant: 90, unknown: null });
    expect(parseSectorValue('90')).toEqual({ coefficient: 0, constant: 90, unknown: null });
  });

  it('parses linear expressions in one unknown', () => {
    expect(parseSectorValue('x')).toEqual({ coefficient: 1, constant: 0, unknown: 'x' });
    expect(parseSectorValue('2x')).toEqual({ coefficient: 2, constant: 0, unknown: 'x' });
    expect(parseSectorValue('3x')).toEqual({ coefficient: 3, constant: 0, unknown: 'x' });
    expect(parseSectorValue('x + 10')).toEqual({ coefficient: 1, constant: 10, unknown: 'x' });
    expect(parseSectorValue('2x-5')).toEqual({ coefficient: 2, constant: -5, unknown: 'x' });
    expect(parseSectorValue('-x + 40')).toEqual({ coefficient: -1, constant: 40, unknown: 'x' });
    expect(parseSectorValue('  4 y  ')).toEqual({ coefficient: 4, constant: 0, unknown: 'y' });
  });

  it('rejects anything that is not a simple linear expression in one unknown', () => {
    for (const bad of ['', 'x^2', '2xy', 'x + y', '3 * x', 'ten', 'x/2']) {
      expect(parseSectorValue(bad), bad).toBeNull();
    }
  });

  it('the schema rejects an unparseable expression string', () => {
    const parse = PieChartParamsZ.safeParse({
      mode: 'degrees',
      sectors: [
        { label: 'A', value: 'x^2' },
        { label: 'B', value: 180 },
      ],
    });
    expect(parse.success).toBe(false);
  });
});

describe('pieChart — symbolic sectors', () => {
  // x + 2x + 3x + 90 = 360  =>  6x = 270  =>  x = 45.
  const symbolic = PieChartParamsZ.parse({
    title: 'Fruit picked at the co-op',
    mode: 'degrees',
    sectors: [
      { label: 'Mango', value: 'x' },
      { label: 'Guava', value: '2x' },
      { label: 'Soursop', value: '3x' },
      { label: 'Cherry', value: 90 },
    ],
  });

  it('solves the sum equation for the unknown', () => {
    expect(solveUnknown(symbolic)).toBe(45);
  });

  it('renders sectors to scale but labels them with the original expression', () => {
    const svg = pieChart.render(symbolic);
    expect((svg.match(/<path/g) ?? []).length).toBe(4);
    // Labelled with what the student sees, never the solved angle.
    expect(svg).toContain('>2x°<');
    expect(svg).toContain('>3x°<');
    expect(svg).not.toContain('>135°<');
    // Drawn to scale: Cherry (90°) and Guava (2x = 90°) are quarter sectors,
    // so no sector needs the large-arc flag and Soursop (135°) does not either.
    expect(svg).not.toContain('A 140 140 0 1 1');
    expect(svg).toMatchSnapshot();
  });

  it('falls back to equal sectors when the unknown has no solution', () => {
    const unsolvable = PieChartParamsZ.parse({
      mode: 'degrees',
      sectors: [
        { label: 'A', value: 'x' },
        { label: 'B', value: '-x' },
      ],
    });
    const svg = pieChart.render(unsolvable);
    expect((svg.match(/<path/g) ?? []).length).toBe(2);
  });

  it('describe() gives the expressions, the total, and the resolved angles', () => {
    const d = pieChart.describe(symbolic);
    expect(d).toContain('Mango: x°');
    expect(d).toContain('Guava: 2x°');
    expect(d).toContain('Cherry: 90°');
    expect(d).toContain('total 360°');
    expect(d).toContain('x = 45');
    expect(d).toContain('Soursop: 135°');
  });

  it('verify accepts a solvable symbolic chart in degrees and percent mode', () => {
    expect(pieChart.verify(symbolic, ctx)).toEqual([]);
    // 2y + (y + 10) + 30 = 100  =>  3y = 60  =>  y = 20.
    const percent = PieChartParamsZ.parse({
      mode: 'percent',
      sectors: [
        { label: 'Walk', value: '2y' },
        { label: 'Bicycle', value: 'y + 10' },
        { label: 'Bus', value: 30 },
      ],
    });
    expect(pieChart.verify(percent, ctx)).toEqual([]);
  });

  it('verify rejects a system with no positive solution', () => {
    const bad = PieChartParamsZ.parse({
      mode: 'degrees',
      sectors: [
        { label: 'A', value: 'x + 200' },
        { label: 'B', value: 'x + 200' },
      ],
    });
    expect(pieChart.verify(bad, ctx).join(' ')).toContain('cannot sum to 360 for any positive x');
  });

  it('verify rejects a solution that makes a sector zero or negative', () => {
    const bad = PieChartParamsZ.parse({
      mode: 'degrees',
      sectors: [
        { label: 'A', value: 'x' },
        { label: 'B', value: '2x - 300' },
        { label: 'C', value: 300 },
      ],
    });
    // x + 2x - 300 + 300 = 360  =>  x = 120, so B = 2(120) - 300 = -60.
    const issues = pieChart.verify(bad, ctx);
    expect(issues.join(' ')).toContain('"B" resolves to -60');
  });

  it('verify rejects an unknown that cancels out of the total', () => {
    const bad = PieChartParamsZ.parse({
      mode: 'degrees',
      sectors: [
        { label: 'A', value: 'x + 180' },
        { label: 'B', value: '-x + 180' },
      ],
    });
    expect(pieChart.verify(bad, ctx).join(' ')).toContain('cancels out of the total');
  });

  it('verify rejects two different unknowns', () => {
    const bad = PieChartParamsZ.parse({
      mode: 'degrees',
      sectors: [
        { label: 'A', value: 'x' },
        { label: 'B', value: '3y' },
      ],
    });
    expect(pieChart.verify(bad, ctx).join(' ')).toContain('more than one unknown');
  });

  it('verify rejects symbolic values in count mode', () => {
    const bad = PieChartParamsZ.parse({
      mode: 'count',
      sectors: [
        { label: 'A', value: '2x' },
        { label: 'B', value: 15 },
      ],
    });
    expect(pieChart.verify(bad, ctx).join(' ')).toContain('not allowed in count mode');
  });

  it('numeric strings still obey the exact-sum rules', () => {
    const ok = PieChartParamsZ.parse({
      mode: 'degrees',
      sectors: [
        { label: 'A', value: '120' },
        { label: 'B', value: 240 },
      ],
    });
    expect(pieChart.verify(ok, ctx)).toEqual([]);
    const bad = PieChartParamsZ.parse({
      mode: 'degrees',
      sectors: [
        { label: 'A', value: '120' },
        { label: 'B', value: 200 },
      ],
    });
    expect(pieChart.verify(bad, ctx).join(' ')).toContain('expected 360');
  });
});
