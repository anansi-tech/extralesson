import { describe, expect, it } from 'vitest';
import { bearingDiagram, BearingDiagramParamsZ } from '@/lib/visuals/templates/bearingDiagram';

// ORIGINAL fixture data only (R1.5 ground truth — no CXC content anywhere).
const params = BearingDiagramParamsZ.parse({
  points: [{ label: 'L' }, { label: 'M' }, { label: 'P' }],
  unit: 'km',
  legs: [
    { from: 0, to: 1, bearing: 65, distance: 40 },
    { from: 1, to: 2, bearing: 148, distance: 32 },
    { from: 2, to: 0, bearing: 295, bearingLabel: 'y' },
  ],
});

const context = {
  stem: 'A boat sails 40 km from L to M on a bearing of 065°, then 32 km from M to P on a bearing of 148°.',
  partPrompts: ['Calculate the bearing y of L from P.'],
};

describe('bearingDiagram template', () => {
  it('renders deterministic SVG (snapshot)', () => {
    const svg = bearingDiagram.render(params);
    expect(svg).toContain('<svg');
    expect(svg).toMatchSnapshot();
  });

  it('describe() carries everything needed to solve', () => {
    const d = bearingDiagram.describe(params);
    expect(d).toContain('north lines');
    expect(d).toContain('M lies on a bearing of 065° from L');
    expect(d).toContain('40 km');
    expect(d).toContain('P lies on a bearing of 148° from M');
    expect(d).toContain('32 km');
    expect(d).toContain('bearing of y from P');
  });

  it('verify passes on consistent params', () => {
    expect(bearingDiagram.verify(params, context)).toEqual([]);
  });

  it('verify rejects a wrong return bearing between the same two points', () => {
    const bad = BearingDiagramParamsZ.parse({
      points: [{ label: 'L' }, { label: 'M' }],
      legs: [
        { from: 0, to: 1, bearing: 65, distance: 40 },
        { from: 1, to: 0, bearing: 240 },
      ],
    });
    const ctx = {
      stem: 'M is 40 km from L on a bearing of 065°. The bearing of L from M is marked 240°.',
      partPrompts: [],
    };
    const issues = bearingDiagram.verify(bad, ctx);
    expect(issues.some((i) => i.includes('return bearing 240° should be 245°'))).toBe(true);
  });

  it('accepts a correct return bearing', () => {
    const good = BearingDiagramParamsZ.parse({
      points: [{ label: 'L' }, { label: 'M' }],
      legs: [
        { from: 0, to: 1, bearing: 65, distance: 40 },
        { from: 1, to: 0, bearing: 245 },
      ],
    });
    const ctx = {
      stem: 'M is 40 km from L on a bearing of 065°. The bearing of L from M is 245°.',
      partPrompts: [],
    };
    expect(bearingDiagram.verify(good, ctx)).toEqual([]);
  });

  it('verify rejects a numeric distance never stated in the text', () => {
    const bad = BearingDiagramParamsZ.parse({
      points: [{ label: 'L' }, { label: 'M' }],
      legs: [{ from: 0, to: 1, bearing: 65, distance: 55 }],
    });
    const issues = bearingDiagram.verify(bad, context);
    expect(issues.some((i) => i.includes('distance 55') && i.includes('never appears'))).toBe(true);
  });

  it('verify rejects a marked numeric bearing never stated in the text', () => {
    const bad = BearingDiagramParamsZ.parse({
      points: [{ label: 'L' }, { label: 'M' }],
      legs: [{ from: 0, to: 1, bearing: 112, distance: 40 }],
    });
    const issues = bearingDiagram.verify(bad, context);
    expect(issues.some((i) => i.includes('bearing 112°') && i.includes('never appears'))).toBe(true);
  });
});
