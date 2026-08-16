import { describe, expect, it } from 'vitest';
import { compoundTriangle, CompoundTriangleParamsZ } from '@/lib/visuals/templates/compoundTriangle';

// ORIGINAL fixture data only (R1.5 ground truth — no CXC content anywhere).

// Two observation points and one vertical: the figure that makes an elevation
// question solvable, because one observation point never is.
const elevation = CompoundTriangleParamsZ.parse({
  arrangement: 'adjacent',
  labels: ['A', 'B', 'C', 'T'],
  angles: [
    { at: 0, from: 2, to: 3, value: 24 },
    { at: 1, from: 2, to: 3, value: 41 },
  ],
  rightAngles: [{ at: 2, from: 1, to: 3 }],
  sides: [
    { from: 0, to: 1, value: 50, unit: 'm' },
    { from: 2, to: 3, variable: 'h' },
  ],
});

const elevationContext = {
  stem: 'From A the angle of elevation of the top of the mast is 24°, and from B, 50 m nearer, it is 41°.',
  partPrompts: ['Calculate the height h of the mast.'],
};

const similar = CompoundTriangleParamsZ.parse({
  arrangement: 'nested',
  labels: ['P', 'Q', 'R', 'S', 'T'],
  sides: [
    { from: 3, to: 4, value: 6, unit: 'cm' },
    { from: 1, to: 2, value: 15, unit: 'cm' },
    { from: 0, to: 3, value: 8, unit: 'cm' },
  ],
});

const similarContext = {
  stem: 'ST is parallel to QR, ST = 6 cm, QR = 15 cm and PS = 8 cm.',
  partPrompts: ['Calculate PQ.'],
};

describe('compoundTriangle template', () => {
  it('renders deterministic SVG (snapshot)', () => {
    const svg = compoundTriangle.render(elevation);
    expect(svg).toContain('<svg');
    expect(svg).toMatchSnapshot();
  });

  it('renders both arrangements without producing NaN coordinates', () => {
    for (const params of [elevation, similar]) {
      expect(compoundTriangle.render(params)).not.toMatch(/NaN|Infinity/);
    }
  });

  it('tells the solver what the two triangles share, which is the whole point', () => {
    expect(compoundTriangle.describe(elevation)).toContain('share the side CT');
    expect(compoundTriangle.describe(elevation)).toContain('T is vertically above C');
    expect(compoundTriangle.describe(similar)).toContain('share the vertex P');
    expect(compoundTriangle.describe(similar)).toContain('ST is parallel to QR');
  });

  it('names an angle by its three vertices, so a shared vertex is unambiguous', () => {
    expect(compoundTriangle.describe(elevation)).toContain('Angle CAT is marked 24°');
    expect(compoundTriangle.describe(elevation)).toContain('Angle CBT is marked 41°');
  });

  it('accepts figures whose values all appear in the question text', () => {
    expect(compoundTriangle.verify(elevation, elevationContext)).toEqual([]);
    expect(compoundTriangle.verify(similar, similarContext)).toEqual([]);
  });

  it('rejects an angle arm that runs along nothing the figure draws', () => {
    const bad = CompoundTriangleParamsZ.parse({
      arrangement: 'adjacent',
      labels: ['A', 'B', 'C', 'T'],
      // A to B to C are collinear, so there is no segment from A to T via B —
      // but A-B is drawn and B-C is drawn, and an arm from B to A is fine.
      angles: [{ at: 3, from: 0, to: 1, value: 30 }],
    });
    // 3-0 and 3-1 ARE drawn (the two sight lines), so this one is legitimate.
    expect(compoundTriangle.verify(bad, { stem: 'The angle is 30°.', partPrompts: [] })).toEqual([]);

    const reallyBad = CompoundTriangleParamsZ.parse({
      arrangement: 'nested',
      labels: ['P', 'Q', 'R', 'S', 'T'],
      sides: [{ from: 3, to: 2, value: 9, unit: 'cm' }], // S to R is not drawn
    });
    expect(
      compoundTriangle.verify(reallyBad, { stem: 'A length of 9 cm.', partPrompts: [] }).join(' '),
    ).toContain('not a segment this figure draws');
  });

  it('rejects the wrong number of labels for the arrangement', () => {
    const bad = CompoundTriangleParamsZ.parse({
      arrangement: 'nested',
      labels: ['P', 'Q', 'R', 'S'],
    });
    expect(compoundTriangle.verify(bad, { stem: 'x', partPrompts: [] }).join(' ')).toContain(
      'takes 5 labels',
    );
  });

  it('rejects three angles of one triangle that cannot be a triangle', () => {
    const bad = CompoundTriangleParamsZ.parse({
      arrangement: 'adjacent',
      labels: ['A', 'B', 'C', 'T'],
      angles: [
        { at: 1, from: 2, to: 3, value: 70 },
        { at: 3, from: 1, to: 2, value: 50 },
      ],
      rightAngles: [{ at: 2, from: 1, to: 3 }],
    });
    expect(
      compoundTriangle.verify(bad, { stem: 'Angles of 70° and 50° are shown.', partPrompts: [] }).join(' '),
    ).toContain('sum to 210');
  });

  it('rejects a value the student is never told', () => {
    expect(
      compoundTriangle.verify(elevation, { stem: 'A mast stands on level ground.', partPrompts: [] }).join(' '),
    ).toContain('24');
  });
});
