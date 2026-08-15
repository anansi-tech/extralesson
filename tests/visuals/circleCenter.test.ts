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

// R1.6 §6 — tangents drawn from a point outside the circle (two of the three
// papers correlated use this configuration).
describe('circleCenter — external point (R1.6 §6)', () => {
  const ctx = { stem: 'VS and VT are tangents to the circle, centre O.', partPrompts: ['Find angle SVT.'] };
  const external = CircleCenterParamsZ.parse({
    points: [
      { label: 'S', bearing: 120, radius: true },
      { label: 'T', bearing: 240, radius: true },
    ],
    externalPoint: { label: 'V', tangentTo: ['S', 'T'] },
  });

  it('draws a tangent segment to each tangency point and labels the meeting point', () => {
    const svg = circleCenter.render(external);
    expect(svg).toContain('>V<');
    // two tangent segments plus the two radii
    expect(svg.match(/<line /g)!.length).toBeGreaterThanOrEqual(4);
  });

  it('places the meeting point outside the circle, on the bisector of the two radii', () => {
    const svg = circleCenter.render(external);
    const label = svg.match(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>V</);
    expect(label).not.toBeNull();
    const [x, y] = [Number(label![1]), Number(label![2])];
    // centre (320, 210), radius 158: tangents at 120° and 240° meet straight
    // below the centre, at twice the radius.
    expect(Math.abs(x - 320)).toBeLessThan(2);
    expect(y).toBeGreaterThan(210 + 158);
  });

  it('tells the solver the two facts the figure encodes', () => {
    const text = circleCenter.describe(external);
    expect(text).toContain('meet at V');
    expect(text).toContain('90°');
    expect(text).toContain('VS = VT');
  });

  it('rejects tangents that never meet', () => {
    const parallel = CircleCenterParamsZ.parse({
      points: [
        { label: 'S', bearing: 30 },
        { label: 'T', bearing: 210 },
      ],
      externalPoint: { label: 'V', tangentTo: ['S', 'T'] },
    });
    expect(circleCenter.verify(parallel, ctx).join(' ')).toContain('parallel');
    expect(circleCenter.render(parallel)).not.toContain('>V<');
  });

  it('rejects an external point that steals a label from the circle', () => {
    const clash = CircleCenterParamsZ.parse({
      points: [
        { label: 'S', bearing: 120 },
        { label: 'T', bearing: 240 },
      ],
      externalPoint: { label: 'S', tangentTo: ['S', 'T'] },
    });
    expect(circleCenter.verify(clash, ctx).join(' ')).toContain('reuses a label');
  });

  it('lets an angle be marked at the external point', () => {
    const withAngle = CircleCenterParamsZ.parse({
      points: [
        { label: 'S', bearing: 120 },
        { label: 'T', bearing: 240 },
      ],
      externalPoint: { label: 'V', tangentTo: ['S', 'T'] },
      angles: [{ vertex: 'V', arc: ['S', 'T'], variable: 'y°' }],
    });
    expect(circleCenter.verify(withAngle, ctx)).toEqual([]);
    expect(circleCenter.render(withAngle)).toContain('y°');
  });

  it('still renders the alternate-segment configuration: tangent plus chord', () => {
    const alt = CircleCenterParamsZ.parse({
      points: [
        { label: 'A', bearing: 0 },
        { label: 'B', bearing: 100 },
        { label: 'C', bearing: 220 },
      ],
      tangentAt: 'A',
      chords: [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
        { from: 'A', to: 'C' },
      ],
      angles: [{ vertex: 'C', arc: ['A', 'B'], variable: 'x°' }],
    });
    expect(circleCenter.verify(alt, ctx)).toEqual([]);
    expect(circleCenter.describe(alt)).toContain('A tangent touches the circle at A.');
  });
});
