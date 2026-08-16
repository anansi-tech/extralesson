import { describe, expect, it } from 'vitest';
import { travelGraph, TravelGraphParamsZ } from '@/lib/visuals/templates/travelGraph';

// ORIGINAL fixture data only (R1.5 ground truth — no CXC content anywhere).
const params = TravelGraphParamsZ.parse({
  mode: 'distance-time',
  t_unit: 's',
  v_label: 'Distance',
  v_unit: 'm',
  points: [
    { t: 0, v: 0 },
    { t: 10, v: 50 },
    { t: 20, v: 50 },
    { t: 30, v: 110 },
  ],
  guides: [{ t: 10, v: 50, label: 'Q' }],
});

const context = {
  stem: 'A cyclist rides at a constant speed of 5 m/s, rests, then rides again.',
  partPrompts: ['For how long did the cyclist rest?'],
};

describe('travelGraph template', () => {
  it('renders deterministic SVG (snapshot)', () => {
    const svg = travelGraph.render(params);
    expect(svg).toContain('<svg');
    expect(svg).toContain('<polyline'); // the journey
    expect(svg).toContain('stroke-dasharray'); // guides
    expect(svg).toContain('Time (s)');
    expect(svg).toContain('Distance (m)');
    expect(svg).toMatchSnapshot();
  });

  it('describe() carries the mode, axes with units, and every point', () => {
    const d = travelGraph.describe(params);
    expect(d).toContain('Distance-time');
    expect(d).toContain('Time (s)');
    expect(d).toContain('Distance (m)');
    expect(d).toContain('(10, 50)');
    expect(d).toContain('(30, 110)');
  });

  it('verify passes when a stated constant speed matches a segment slope', () => {
    expect(travelGraph.verify(params, context)).toEqual([]);
  });

  it('verify rejects t values that are not strictly ascending', () => {
    const bad = {
      ...params,
      points: [
        { t: 0, v: 0 },
        { t: 15, v: 30 },
        { t: 10, v: 60 },
      ],
    };
    const issues = travelGraph.verify(bad, context);
    expect(issues.some((i) => i.includes('strictly ascending'))).toBe(true);
  });

  it('verify rejects a stated constant speed no segment slope matches', () => {
    const badContext = {
      stem: 'The cyclist travels at a constant speed of 12 m/s before resting.',
      partPrompts: [],
    };
    const issues = travelGraph.verify(params, badContext);
    expect(issues.some((i) => i.includes('constant speed'))).toBe(true);
  });

  it('verify rejects negative values', () => {
    const bad = {
      ...params,
      points: [
        { t: 0, v: 0 },
        { t: 5, v: -3 },
        { t: 10, v: 20 },
      ],
    };
    const issues = travelGraph.verify(bad, context);
    expect(issues.some((i) => i.includes('negative'))).toBe(true);
  });
});

// The papers letter the straight sections I, II, III and then ask about one of
// them — "during Stage IV the car travels at ... with acceleration ..." — which
// is a cloze statement over a graph. Without named stages it cannot be posed.
describe('travelGraph — named stages', () => {
  const staged = TravelGraphParamsZ.parse({
    mode: 'speed-time',
    t_label: 'Time',
    t_unit: 'seconds',
    v_label: 'Velocity',
    v_unit: 'm/s',
    points: [
      { t: 0, v: 0 },
      { t: 10, v: 20 },
      { t: 25, v: 20 },
      { t: 40, v: 45 },
      { t: 55, v: 45 },
      { t: 70, v: 0 },
    ],
    stages: ['I', 'II', 'III', 'IV', 'V'],
  });

  it('draws one label per straight section', () => {
    const svg = travelGraph.render(staged);
    for (const name of ['I', 'II', 'III', 'IV', 'V']) {
      expect(svg).toContain(`>${name}<`);
    }
    expect(svg).not.toMatch(/NaN|Infinity/);
  });

  it('tells the solver which points each stage runs between', () => {
    const d = travelGraph.describe(staged);
    expect(d).toContain('III (from (25, 20) to (40, 45))');
    expect(d).toContain('IV (from (40, 45) to (55, 45))');
  });

  it('rejects more stage names than there are sections', () => {
    const bad = TravelGraphParamsZ.parse({
      ...staged,
      points: [
        { t: 0, v: 0 },
        { t: 10, v: 20 },
      ],
      stages: ['I', 'II', 'III'],
    });
    expect(travelGraph.verify(bad, { stem: 'x', partPrompts: [] }).join(' ')).toContain(
      '3 stage name(s) for 1 straight section(s)',
    );
  });

  it('says nothing about stages when none are named', () => {
    const plain = TravelGraphParamsZ.parse({ ...staged, stages: [] });
    expect(travelGraph.describe(plain)).not.toContain('labelled');
  });
});
