import { describe, expect, it } from 'vitest';
import { histogram, HistogramParamsZ } from '@/lib/visuals/templates/histogram';

// ORIGINAL fixture data only.
const params = HistogramParamsZ.parse({
  title: 'Masses of parcels at a post office',
  x_label: 'Mass (kg)',
  y_label: 'Frequency',
  y_step: 2,
  boundaries: [0, 5, 10, 15, 20, 25],
  frequencies: [3, 7, 12, 8, 4],
});

describe('histogram template', () => {
  it('renders deterministic SVG with contiguous bars (snapshot)', () => {
    const svg = histogram.render(params);
    expect(svg).toContain('<svg');
    expect((svg.match(/<rect/g) || []).length).toBe(5);
    // adjacent bars share a boundary: the x of bar i+1 equals x + width of bar i
    expect(svg).toMatchSnapshot();
  });

  it('describe() lists every class interval and frequency for the solver', () => {
    const d = histogram.describe(params);
    for (const s of ['0–5: 3', '5–10: 7', '10–15: 12', '15–20: 8', '20–25: 4']) {
      expect(d).toContain(s);
    }
  });

  it('verify passes on consistent params', () => {
    expect(histogram.verify(params, { stem: 'x', partPrompts: [] })).toEqual([]);
  });

  it('verify rejects non-ascending boundaries', () => {
    const bad = { ...params, boundaries: [0, 5, 5, 15, 20, 25] };
    expect(histogram.verify(bad, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
  });

  it('verify rejects boundary/frequency count mismatch and negative frequencies', () => {
    const mismatch = { ...params, frequencies: [3, 7, 12, 8] };
    expect(histogram.verify(mismatch, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
    const negative = { ...params, frequencies: [3, -7, 12, 8, 4] };
    expect(histogram.verify(negative, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
  });
});
