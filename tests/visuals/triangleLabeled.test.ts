import { describe, expect, it } from 'vitest';
import { triangleLabeled, TriangleLabeledParamsZ } from '@/lib/visuals/templates/triangleLabeled';

// ORIGINAL fixture data only (R1.5 ground truth — no CXC content anywhere).
const params = TriangleLabeledParamsZ.parse({
  labels: ['A', 'B', 'C'],
  angles: [
    { vertex: 0, value: 52 },
    { vertex: 1, variable: 'x°' },
  ],
  sides: [{ side: 0, value: 9, unit: 'cm' }],
  rightAngleAt: 2,
});

const context = {
  stem: 'In triangle ABC, angle A = 52°, AB = 9 cm and angle ACB is a right angle.',
  partPrompts: ['Calculate the value of x.'],
};

describe('triangleLabeled template', () => {
  it('renders deterministic SVG (snapshot)', () => {
    const svg = triangleLabeled.render(params);
    expect(svg).toContain('<svg');
    expect(svg).toMatchSnapshot();
  });

  it('describe() carries everything needed to solve', () => {
    const d = triangleLabeled.describe(params);
    expect(d).toContain('Triangle ABC');
    expect(d).toContain('52°');
    expect(d).toContain('x°');
    expect(d).toContain('9 cm');
    expect(d).toContain('right angle at C');
  });

  it('verify passes on consistent params', () => {
    expect(triangleLabeled.verify(params, context)).toEqual([]);
  });

  it('verify rejects three numeric angles that do not sum to 180', () => {
    const bad = TriangleLabeledParamsZ.parse({
      angles: [
        { vertex: 0, value: 60 },
        { vertex: 1, value: 70 },
        { vertex: 2, value: 60 },
      ],
    });
    const ctx = { stem: 'Angles of 60°, 70° and 60° are shown.', partPrompts: [] };
    const issues = triangleLabeled.verify(bad, ctx);
    expect(issues.some((i) => i.includes('sum to 190'))).toBe(true);
  });

  it('verify rejects partial numeric angles summing past 180', () => {
    const bad = TriangleLabeledParamsZ.parse({
      angles: [
        { vertex: 0, value: 130 },
        { vertex: 1, value: 70 },
      ],
    });
    const ctx = { stem: 'Angles of 130° and 70° are shown.', partPrompts: [] };
    const issues = triangleLabeled.verify(bad, ctx);
    expect(issues.some((i) => i.includes('exceeds 180'))).toBe(true);
  });

  it('verify rejects an angle value of 180° or more', () => {
    const bad = TriangleLabeledParamsZ.parse({ angles: [{ vertex: 0, value: 185 }] });
    const ctx = { stem: 'An angle of 185° is shown.', partPrompts: [] };
    const issues = triangleLabeled.verify(bad, ctx);
    expect(issues.some((i) => i.includes('strictly between'))).toBe(true);
  });

  it('verify rejects a numeric angle never stated in the text', () => {
    const bad = TriangleLabeledParamsZ.parse({ angles: [{ vertex: 0, value: 47 }] });
    const issues = triangleLabeled.verify(bad, context);
    expect(issues.some((i) => i.includes('never appears'))).toBe(true);
  });

  it('verify rejects a numeric side length never stated in the text', () => {
    const bad = TriangleLabeledParamsZ.parse({ sides: [{ side: 1, value: 14, unit: 'cm' }] });
    const issues = triangleLabeled.verify(bad, context);
    expect(issues.some((i) => i.includes('never appears'))).toBe(true);
  });
});

// ---- non-right triangles: the cosine-rule and sine-rule configurations that
// appear in every paper (ORIGINAL fixture data only) ----

// The triangle polygon is the first <polygon> the renderer emits; the
// right-angle mark is a <polyline>, so this is the triangle itself.
function trianglePoints(svg: string): [number, number][] {
  const m = svg.match(/<polygon points="([^"]+)"/);
  if (!m) throw new Error('no triangle polygon rendered');
  return m[1].split(' ').map((pair) => {
    const [x, y] = pair.split(',').map(Number);
    return [x, y] as [number, number];
  });
}

function sideLengths(v: [number, number][]): number[] {
  return [0, 1, 2].map((i) => Math.hypot(v[(i + 1) % 3][0] - v[i][0], v[(i + 1) % 3][1] - v[i][1]));
}

describe('triangleLabeled — cosine rule (two sides and the included angle)', () => {
  // Side 0 is AB and side 1 is BC, so the angle at B (vertex 1) is included.
  const cosineRule = TriangleLabeledParamsZ.parse({
    labels: ['P', 'Q', 'R'],
    sides: [
      { side: 0, value: 11, unit: 'cm' },
      { side: 1, value: 17, unit: 'cm' },
    ],
    angles: [{ vertex: 1, value: 58 }],
  });

  const ctx = {
    stem: 'In triangle PQR, PQ = 11 cm, QR = 17 cm and angle PQR = 58°.',
    partPrompts: ['Calculate the length of PR.'],
  };

  it('places a genuine scalene triangle with no right angle (snapshot)', () => {
    const svg = triangleLabeled.render(cosineRule);
    const v = trianglePoints(svg);
    expect(v).toHaveLength(3);
    const [s0, s1, s2] = sideLengths(v);
    // Non-degenerate: real area.
    const area = Math.abs(
      (v[1][0] - v[0][0]) * (v[2][1] - v[0][1]) - (v[2][0] - v[0][0]) * (v[1][1] - v[0][1]),
    ) / 2;
    expect(area).toBeGreaterThan(1000);
    // Scalene: the template splits the two unknown angles 58/42, never 50/50.
    for (const [a, b] of [[s0, s1], [s1, s2], [s0, s2]]) {
      expect(Math.abs(a - b)).toBeGreaterThan(5);
    }
    // No right-angle mark was asked for, so no polyline is emitted.
    expect(svg).not.toContain('<polyline');
    expect(svg).toMatchSnapshot();
  });

  it('draws the angle arc and both side labels', () => {
    const svg = triangleLabeled.render(cosineRule);
    expect(svg).toContain('58°');
    expect(svg).toContain('11 cm');
    expect(svg).toContain('17 cm');
    expect(svg).toContain('<path'); // the interior angle arc
  });

  it('describe() names the included angle and both sides', () => {
    const d = triangleLabeled.describe(cosineRule);
    expect(d).toContain('Triangle PQR');
    expect(d).toContain('The angle at Q is marked 58°');
    expect(d).toContain('Side PQ is marked 11 cm');
    expect(d).toContain('Side QR is marked 17 cm');
  });

  it('verify accepts it', () => {
    expect(triangleLabeled.verify(cosineRule, ctx)).toEqual([]);
  });
});

describe('triangleLabeled — sine rule (two angles and a side)', () => {
  const sineRule = TriangleLabeledParamsZ.parse({
    labels: ['K', 'L', 'M'],
    angles: [
      { vertex: 0, value: 47 },
      { vertex: 1, value: 63 },
    ],
    sides: [{ side: 0, value: 12, unit: 'cm' }],
  });

  const ctx = {
    stem: 'In triangle KLM, angle K = 47°, angle L = 63° and KL = 12 cm.',
    partPrompts: ['Calculate the length of LM.'],
  };

  it('places the third angle at 180 - 47 - 63 = 70 degrees (snapshot)', () => {
    const svg = triangleLabeled.render(sineRule);
    const v = trianglePoints(svg);
    // Interior angle at each vertex, from the drawn coordinates.
    const angleAt = (i: number) => {
      const a = v[(i + 1) % 3];
      const b = v[(i + 2) % 3];
      const u1 = [a[0] - v[i][0], a[1] - v[i][1]];
      const u2 = [b[0] - v[i][0], b[1] - v[i][1]];
      const cos =
        (u1[0] * u2[0] + u1[1] * u2[1]) / (Math.hypot(...u1) * Math.hypot(...u2));
      return (Math.acos(cos) * 180) / Math.PI;
    };
    expect(angleAt(0)).toBeCloseTo(47, 1);
    expect(angleAt(1)).toBeCloseTo(63, 1);
    expect(angleAt(2)).toBeCloseTo(70, 1);
    expect(svg).toMatchSnapshot();
  });

  it('describe() names both angles and the side between them', () => {
    const d = triangleLabeled.describe(sineRule);
    expect(d).toContain('The angle at K is marked 47°');
    expect(d).toContain('The angle at L is marked 63°');
    expect(d).toContain('Side KL is marked 12 cm');
  });

  it('verify accepts it, and still rejects the same pair summing past 180', () => {
    expect(triangleLabeled.verify(sineRule, ctx)).toEqual([]);
    const bad = TriangleLabeledParamsZ.parse({
      labels: ['K', 'L', 'M'],
      angles: [
        { vertex: 0, value: 147 },
        { vertex: 1, value: 63 },
      ],
    });
    const badCtx = { stem: 'Angles of 147° and 63° are shown.', partPrompts: [] };
    expect(triangleLabeled.verify(bad, badCtx).join(' ')).toContain('exceeds 180');
  });
});

// R1.6 §6 — non-right triangles for the sine/cosine rule, and the perpendicular
// that answers "the shortest distance from the point to the line".
describe('triangleLabeled — non-right configurations (R1.6 §6)', () => {
  const ctx = {
    stem: 'In triangle PQR, angle Q = 52 degrees, angle R = 47 degrees and QR = 14 m.',
    partPrompts: ['Calculate PQ.', 'Calculate the shortest distance from P to QR.'],
  };

  const scalene = TriangleLabeledParamsZ.parse({
    labels: ['P', 'Q', 'R'],
    angles: [
      { vertex: 1, value: 52 },
      { vertex: 2, value: 47 },
    ],
    sides: [{ side: 1, value: 14, unit: 'm' }],
  });

  it('lays out a triangle with no right angle at all', () => {
    expect(triangleLabeled.verify(scalene, ctx)).toEqual([]);
    const svg = triangleLabeled.render(scalene);
    expect(svg).toContain('52°');
    expect(svg).toContain('47°');
    // no right-angle square is drawn
    expect(svg.match(/<polyline /g) ?? []).toHaveLength(0);
  });

  it('drops a perpendicular from a vertex to the opposite side and marks the foot', () => {
    const withHeight = TriangleLabeledParamsZ.parse({
      ...scalene,
      perpendicularFrom: { vertex: 0, footLabel: 'N', label: 'h' },
    });
    const svg = triangleLabeled.render(withHeight);
    expect(svg).toContain('>N<');
    expect(svg).toContain('>h<');
    expect(svg).toContain('stroke-dasharray'); // the perpendicular is dashed
    expect(svg).toMatch(/<polyline /); // right-angle mark at the foot
  });

  it('states the perpendicular as the shortest distance, which is what the part asks for', () => {
    const withHeight = TriangleLabeledParamsZ.parse({
      ...scalene,
      perpendicularFrom: { vertex: 0, footLabel: 'N' },
    });
    const text = triangleLabeled.describe(withHeight);
    expect(text).toContain('perpendicular is drawn from P to QR');
    expect(text).toContain('shortest distance from P to QR');
  });

  it('rejects a foot that reuses a vertex label', () => {
    const clash = TriangleLabeledParamsZ.parse({
      ...scalene,
      perpendicularFrom: { vertex: 0, footLabel: 'Q' },
    });
    expect(triangleLabeled.verify(clash, ctx).join(' ')).toContain('reuses vertex label');
  });

  it('puts the foot on the opposite side, between its endpoints', () => {
    const withHeight = TriangleLabeledParamsZ.parse({
      ...scalene,
      perpendicularFrom: { vertex: 0, footLabel: 'N' },
    });
    const svg = triangleLabeled.render(withHeight);
    const dashed = svg.match(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"[^>]*stroke-dasharray/);
    expect(dashed).not.toBeNull();
    const footX = Number(dashed![3]);
    expect(footX).toBeGreaterThan(60);
    expect(footX).toBeLessThan(580);
  });
});

// A review card showed an empty box where a triangle should be. The params were
// valid — three vertex labels and one side length, which is exactly what a
// scale-drawing question gives — but with no angles at all the layout read past
// the end of its two-entry share table and every vertex came out NaN.
describe('triangleLabeled — a triangle with no angles still gets drawn', () => {
  it('draws the default scalene triangle when only sides are given', () => {
    const p = TriangleLabeledParamsZ.parse({
      labels: ['A', 'B', 'C'],
      sides: [{ side: 2, value: 4, unit: 'cm' }],
    });
    const svg = triangleLabeled.render(p);
    expect(svg).not.toContain('NaN');
    const poly = svg.match(/<polygon points="([^"]+)"/)![1];
    for (const n of poly.split(/[ ,]/).map(Number)) expect(Number.isFinite(n)).toBe(true);
    expect(svg).toContain('>A<');
    expect(svg).toContain('4 cm');
  });

  it('draws nothing degenerate for any number of supplied angles', () => {
    const cases = [
      {},
      { angles: [{ vertex: 0, value: 90 }] },
      { angles: [{ vertex: 0, value: 50 }, { vertex: 1, value: 60 }] },
      { angles: [{ vertex: 0, value: 50 }, { vertex: 1, value: 60 }, { vertex: 2, value: 70 }] },
      { rightAngleAt: 1 },
      { equalTicks: [{ side: 0, count: 1 }, { side: 1, count: 1 }] },
    ];
    for (const c of cases) {
      const svg = triangleLabeled.render(TriangleLabeledParamsZ.parse(c));
      expect(svg, JSON.stringify(c)).not.toContain('NaN');
    }
  });
});
