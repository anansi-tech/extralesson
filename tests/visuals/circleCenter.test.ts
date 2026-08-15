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

// ---- tangent + alternate-segment configuration (every paper carries one)
// — ORIGINAL fixture data only ----

describe('circleCenter — tangent and alternate segment', () => {
  // Tangent touching at T; chord TB cuts off a segment, and the angle in the
  // alternate segment sits at A. The radius OT is drawn so the
  // tangent-perpendicular-to-radius fact is visible.
  const tangent = CircleCenterParamsZ.parse({
    points: [
      { label: 'T', bearing: 200, radius: true },
      { label: 'B', bearing: 305, radius: true },
      { label: 'A', bearing: 60 },
    ],
    chords: [
      { from: 'T', to: 'B' },
      { from: 'A', to: 'T' },
      { from: 'A', to: 'B' },
    ],
    tangentAt: 'T',
    angles: [
      { vertex: 'O', arc: ['T', 'B'], value: 104 },
      { vertex: 'A', arc: ['T', 'B'], variable: 'y°' },
    ],
  });

  const ctx = {
    stem: 'T, A and B lie on a circle with centre O, and a straight line touches the circle at T. Angle TOB = 104°.',
    partPrompts: ['Calculate the value of y.'],
  };

  it('renders the tangent as a straight line through the touching point (snapshot)', () => {
    const svg = circleCenter.render(tangent);
    expect(svg).toContain('<svg');
    // Circle, centre dot, and one <line> per radius/chord/angle-arm plus the
    // tangent itself: the tangent adds a line beyond the same figure without it.
    const withTangent = (svg.match(/<line /g) ?? []).length;
    const withoutTangent = (
      circleCenter.render({ ...tangent, tangentAt: undefined }).match(/<line /g) ?? []
    ).length;
    expect(withTangent).toBe(withoutTangent + 1);
    expect(svg).toMatchSnapshot();
  });

  it('describe() tells the solver where the tangent touches', () => {
    const d = circleCenter.describe(tangent);
    expect(d).toContain('A tangent touches the circle at T');
    expect(d).toContain('Radii drawn: OT, OB');
    expect(d).toContain('Chord TB');
    expect(d).toContain('at the centre O');
    expect(d).toContain('y°');
  });

  it('verify accepts the tangent configuration', () => {
    expect(circleCenter.verify(tangent, ctx)).toEqual([]);
  });

  it('verify rejects a tangent at an undeclared point', () => {
    const bad = CircleCenterParamsZ.parse({ ...tangent, tangentAt: 'Z' });
    expect(circleCenter.verify(bad, ctx).join(' ')).toContain('unknown point "Z"');
  });

  it('the centre = 2 x circumference check still applies alongside a tangent', () => {
    // 104° at O on arc TB means 52° at A — anything else must be rejected.
    const good = CircleCenterParamsZ.parse({
      ...tangent,
      angles: [
        { vertex: 'O', arc: ['T', 'B'], value: 104 },
        { vertex: 'A', arc: ['T', 'B'], value: 52 },
      ],
    });
    const goodCtx = { stem: 'Angle TOB = 104° and angle TAB = 52°.', partPrompts: [] };
    expect(circleCenter.verify(good, goodCtx)).toEqual([]);

    const bad = CircleCenterParamsZ.parse({
      ...tangent,
      angles: [
        { vertex: 'O', arc: ['T', 'B'], value: 104 },
        { vertex: 'A', arc: ['T', 'B'], value: 60 },
      ],
    });
    const badCtx = { stem: 'Angle TOB = 104° and angle TAB = 60°.', partPrompts: [] };
    expect(circleCenter.verify(bad, badCtx).join(' ')).toContain('twice');
  });

  it('the check is scoped to one arc: angles on different arcs are independent', () => {
    // 104° at O on arc TB and 40° at T on arc AB are unrelated claims.
    const mixed = CircleCenterParamsZ.parse({
      ...tangent,
      angles: [
        { vertex: 'O', arc: ['T', 'B'], value: 104 },
        { vertex: 'T', arc: ['A', 'B'], value: 40 },
      ],
    });
    const mixedCtx = { stem: 'Angle TOB = 104° and angle ATB = 40°.', partPrompts: [] };
    expect(circleCenter.verify(mixed, mixedCtx)).toEqual([]);
  });
});
