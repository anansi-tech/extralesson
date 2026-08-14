import { describe, expect, it } from 'vitest';
import { circleCenter, CircleCenterParamsZ } from '@/lib/visuals/templates/circleCenter';

// ORIGINAL fixture data only (R1.5 ground truth — no CXC content anywhere).
const params = CircleCenterParamsZ.parse({
  points: [
    { label: 'P', bearing: 40, radius: true },
    { label: 'Q', bearing: 160, radius: true },
    { label: 'R', bearing: 270 },
  ],
  chords: [
    { from: 'P', to: 'R' },
    { from: 'Q', to: 'R' },
  ],
  angles: [
    { vertex: 'O', arc: ['P', 'Q'], value: 120 },
    { vertex: 'R', arc: ['P', 'Q'], variable: 'x°' },
  ],
});

const context = {
  stem: 'P, Q and R lie on a circle with centre O. Angle POQ = 120°.',
  partPrompts: ['Calculate the value of x.'],
};

describe('circleCenter template', () => {
  it('renders deterministic SVG (snapshot)', () => {
    const svg = circleCenter.render(params);
    expect(svg).toContain('<svg');
    expect(svg).toMatchSnapshot();
  });

  it('describe() carries everything needed to solve', () => {
    const d = circleCenter.describe(params);
    expect(d).toContain('centre O');
    expect(d).toContain('P at 40°');
    expect(d).toContain('Radii drawn: OP, OQ');
    expect(d).toContain('Chord PR');
    expect(d).toContain('120°');
    expect(d).toContain('x°');
    expect(d).toContain('at R on the circumference');
  });

  it('verify passes on consistent params', () => {
    expect(circleCenter.verify(params, context)).toEqual([]);
  });

  it('verify rejects centre angle not twice the circumference angle on the same arc', () => {
    const bad = CircleCenterParamsZ.parse({
      points: params.points,
      angles: [
        { vertex: 'O', arc: ['P', 'Q'], value: 120 },
        { vertex: 'R', arc: ['P', 'Q'], value: 70 },
      ],
    });
    const ctx = { stem: 'Angle POQ = 120° and angle PRQ = 70°.', partPrompts: [] };
    const issues = circleCenter.verify(bad, ctx);
    expect(issues.some((i) => i.includes('twice'))).toBe(true);
  });

  it('verify rejects a numeric angle never stated in the text', () => {
    const bad = CircleCenterParamsZ.parse({
      points: params.points,
      angles: [{ vertex: 'O', arc: ['P', 'Q'], value: 85 }],
    });
    const issues = circleCenter.verify(bad, context);
    expect(issues.some((i) => i.includes('never appears'))).toBe(true);
  });

  it('verify rejects references to unknown point labels', () => {
    const bad = CircleCenterParamsZ.parse({
      points: params.points,
      chords: [{ from: 'P', to: 'Z' }],
    });
    const issues = circleCenter.verify(bad, context);
    expect(issues.some((i) => i.includes('unknown point'))).toBe(true);
  });
});
