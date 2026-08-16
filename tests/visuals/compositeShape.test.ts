import { describe, expect, it } from 'vitest';
import { compositeShape, CompositeShapeParamsZ } from '@/lib/visuals/templates/compositeShape';

// ORIGINAL fixture data only (R1.5 ground truth — no CXC content anywhere).
const params = CompositeShapeParamsZ.parse({
  kind: 'rect-plus-semicircle',
  width: 14,
  height: 8,
  unit: 'cm',
});

const context = {
  stem: 'A window is made of a rectangle 14 cm wide and 8 cm high with a semicircle on top.',
  partPrompts: ['Calculate the area of the window.'],
};

describe('compositeShape template', () => {
  it('renders deterministic SVG (snapshot)', () => {
    const svg = compositeShape.render(params);
    expect(svg).toContain('<svg');
    expect(svg).toMatchSnapshot();
  });

  it('renders every kind without error', () => {
    const kinds = [
      { kind: 'rect-minus-rect', outerWidth: 12, outerHeight: 9, innerWidth: 6, innerHeight: 4, unit: 'm' },
      { kind: 'l-shape', width: 10, height: 7, cutWidth: 4, cutHeight: 3, unit: 'cm' },
      { kind: 'cuboid', length: 8, width: 5, height: 3, unit: 'cm' },
      { kind: 'cylinder', radius: 5, height: 12, unit: 'cm' },
      { kind: 'triangular-prism', base: 6, height: 4, length: 10, unit: 'mm' },
    ] as const;
    for (const k of kinds) {
      const svg = compositeShape.render(CompositeShapeParamsZ.parse(k));
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    }
  });

  it('describe() carries everything needed to solve', () => {
    const d = compositeShape.describe(params);
    expect(d).toContain('14 cm');
    expect(d).toContain('8 cm');
    expect(d).toContain('semicircle');
    expect(d).toContain('diameter 14 cm');
    const dCuboid = compositeShape.describe(
      CompositeShapeParamsZ.parse({ kind: 'cuboid', length: 8, width: 5, height: 3, unit: 'cm' }),
    );
    expect(dCuboid).toContain('length 8 cm');
    expect(dCuboid).toContain('width 5 cm');
    expect(dCuboid).toContain('height 3 cm');
  });

  it('verify passes on consistent params', () => {
    expect(compositeShape.verify(params, context)).toEqual([]);
  });

  it('verify rejects an inner rectangle that does not fit inside the outer', () => {
    const bad = CompositeShapeParamsZ.parse({
      kind: 'rect-minus-rect',
      outerWidth: 10,
      outerHeight: 8,
      innerWidth: 12,
      innerHeight: 5,
      unit: 'cm',
    });
    const ctx = {
      stem: 'A frame 10 cm by 8 cm has a hole 12 cm by 5 cm.',
      partPrompts: [],
    };
    const issues = compositeShape.verify(bad, ctx);
    expect(issues.some((i) => i.includes('strictly inside'))).toBe(true);
  });

  it('verify rejects a dimension never stated in the text', () => {
    const bad = CompositeShapeParamsZ.parse({
      kind: 'rect-plus-semicircle',
      width: 14,
      height: 9,
      unit: 'cm',
    });
    const issues = compositeShape.verify(bad, context);
    expect(issues.some((i) => i.includes('never appears'))).toBe(true);
  });
});

// ---- the two configurations every paper carries: a semicircle composite and
// a shaded-region subtraction (ORIGINAL fixture data only) ----

describe('compositeShape — rect-plus-semicircle', () => {
  const shape = CompositeShapeParamsZ.parse({
    kind: 'rect-plus-semicircle',
    width: 20,
    height: 13,
    unit: 'cm',
  });

  const ctx = {
    stem: 'The diagram shows a shape made from a rectangle 20 cm by 13 cm with a semicircle on its top edge.',
    partPrompts: ['Calculate the perimeter of the shape.'],
  };

  it('renders three rectangle sides, a dashed diameter and a semicircular arc', () => {
    const svg = compositeShape.render(shape);
    // The fourth rectangle side is the shared diameter, drawn dashed.
    expect((svg.match(/stroke-dasharray/g) ?? []).length).toBe(1);
    // One arc path — the semicircle — and no full circle.
    expect((svg.match(/<path d="M /g) ?? []).length).toBe(1);
    expect(svg).not.toContain('<circle');
    expect(svg).toContain('20 cm');
    expect(svg).toContain('13 cm');
  });

  it('scales the semicircle radius to half the rectangle width', () => {
    // The arc is drawn with rx = ry = width/2 in the same scale as the
    // rectangle: the arc radius must be exactly half the rectangle span.
    const svg = compositeShape.render(shape);
    const arc = svg.match(/A (\d+(?:\.\d+)?) \1 0 /);
    expect(arc).not.toBeNull();
    const r = Number((arc as RegExpMatchArray)[1]);
    // Every horizontal run in the figure (bottom edge, dashed diameter, width
    // dimension arrow) spans the rectangle width — which must be the diameter.
    const horizontals = [...svg.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="\2"/g)];
    expect(horizontals.length).toBeGreaterThanOrEqual(3);
    for (const h of horizontals) {
      expect(Number(h[3]) - Number(h[1])).toBeCloseTo(2 * r, 1);
    }
  });

  it('describe() states the semicircle sits on the rectangle with that diameter', () => {
    const d = compositeShape.describe(shape);
    expect(d).toContain('rectangle 20 cm wide and 13 cm high');
    expect(d).toContain('semicircle of diameter 20 cm');
  });

  it('verify accepts it', () => {
    expect(compositeShape.verify(shape, ctx)).toEqual([]);
  });
});

describe('compositeShape — rect-minus-rect (shaded region)', () => {
  const shape = CompositeShapeParamsZ.parse({
    kind: 'rect-minus-rect',
    outerWidth: 18,
    outerHeight: 11,
    innerWidth: 9,
    innerHeight: 5,
    unit: 'cm',
  });

  const ctx = {
    stem: 'A concrete slab 18 m by 11 m has a rectangular pool 9 m by 5 m cut from its centre.',
    partPrompts: ['Calculate the area of the remaining slab.'],
  };

  it('renders both rectangles with the inner one centred inside the outer', () => {
    const svg = compositeShape.render(shape);
    const polys = [...svg.matchAll(/<polygon points="([^"]+)" \/>/g)].map((m) =>
      m[1].split(' ').map((pair) => pair.split(',').map(Number) as [number, number]),
    );
    const rects = polys.filter((q) => q.length === 4);
    expect(rects.length).toBe(2);
    const box = (q: [number, number][]) => ({
      x0: Math.min(...q.map((v) => v[0])),
      x1: Math.max(...q.map((v) => v[0])),
      y0: Math.min(...q.map((v) => v[1])),
      y1: Math.max(...q.map((v) => v[1])),
    });
    const [outer, inner] = [box(rects[0]), box(rects[1])];
    expect(inner.x0).toBeGreaterThan(outer.x0);
    expect(inner.x1).toBeLessThan(outer.x1);
    expect(inner.y0).toBeGreaterThan(outer.y0);
    expect(inner.y1).toBeLessThan(outer.y1);
    // Centred: equal margins on both axes.
    expect(inner.x0 - outer.x0).toBeCloseTo(outer.x1 - inner.x1, 1);
    expect(inner.y0 - outer.y0).toBeCloseTo(outer.y1 - inner.y1, 1);
  });

  it('labels all four dimensions', () => {
    const svg = compositeShape.render(shape);
    for (const dim of ['18 cm', '11 cm', '9 cm', '5 cm']) expect(svg).toContain(dim);
  });

  it('describe() states the inner rectangle is removed from the outer', () => {
    const d = compositeShape.describe(shape);
    expect(d).toContain('outer rectangle 18 cm by 11 cm');
    expect(d).toContain('inner rectangle 9 cm by 5 cm removed');
  });

  it('verify accepts it', () => {
    expect(compositeShape.verify(shape, ctx)).toEqual([]);
  });

  it('the inner-fits-inside rule fires on width alone, on height alone, and on equality', () => {
    const violations = [
      { outerWidth: 10, outerHeight: 8, innerWidth: 12, innerHeight: 5 }, // too wide
      { outerWidth: 10, outerHeight: 8, innerWidth: 6, innerHeight: 9 }, // too tall
      { outerWidth: 10, outerHeight: 8, innerWidth: 10, innerHeight: 5 }, // equal width
      { outerWidth: 10, outerHeight: 8, innerWidth: 6, innerHeight: 8 }, // equal height
    ];
    for (const v of violations) {
      const bad = CompositeShapeParamsZ.parse({ kind: 'rect-minus-rect', ...v, unit: 'cm' });
      const stem = `A frame ${v.outerWidth} cm by ${v.outerHeight} cm has a hole ${v.innerWidth} cm by ${v.innerHeight} cm.`;
      const issues = compositeShape.verify(bad, { stem, partPrompts: [] });
      expect(issues.some((i) => i.includes('strictly inside')), JSON.stringify(v)).toBe(true);
    }
  });

  it('the rule does NOT fire when the inner rectangle genuinely fits', () => {
    const ok = CompositeShapeParamsZ.parse({
      kind: 'rect-minus-rect',
      outerWidth: 10,
      outerHeight: 8,
      innerWidth: 9,
      innerHeight: 7,
      unit: 'cm',
    });
    const issues = compositeShape.verify(ok, {
      stem: 'A frame 10 cm by 8 cm has a hole 9 cm by 7 cm.',
      partPrompts: [],
    });
    expect(issues.some((i) => i.includes('strictly inside'))).toBe(false);
  });
});

// R1.6 §6 — "find the area of the shaded region" needs a shaded region.
describe('compositeShape — shaded regions (R1.6 §6)', () => {
  it('hatches only the semicircle on a rectangle-plus-semicircle', () => {
    const plain = CompositeShapeParamsZ.parse({
      kind: 'rect-plus-semicircle',
      width: 8,
      height: 5,
      unit: 'cm',
    });
    const shaded = CompositeShapeParamsZ.parse({ ...plain, shaded: true });
    expect(compositeShape.render(plain)).not.toContain('shapeHatch');
    const svg = compositeShape.render(shaded);
    expect(svg).toContain('pattern id="shapeHatch"');
    expect(svg).toMatch(/<path d="M [\d.]+ [\d.]+ A .* Z" fill="url\(#shapeHatch\)"/);
    expect(compositeShape.describe(shaded)).toContain('The semicircle is shaded.');
  });

  it('hatches the material left between the rectangles, not the hole', () => {
    const shaded = CompositeShapeParamsZ.parse({
      kind: 'rect-minus-rect',
      outerWidth: 12,
      outerHeight: 9,
      innerWidth: 6,
      innerHeight: 4,
      unit: 'm',
      shaded: true,
    });
    const svg = compositeShape.render(shaded);
    // even-odd on a two-subpath outline is what leaves the hole clear
    expect(svg).toContain('fill-rule="evenodd"');
    expect(svg).toContain('fill="url(#shapeHatch)"');
    expect(compositeShape.describe(shaded)).toContain('The region between the two rectangles is shaded.');
  });

  it('defaults to unshaded, so existing questions are untouched', () => {
    const p = CompositeShapeParamsZ.parse({
      kind: 'rect-minus-rect',
      outerWidth: 12,
      outerHeight: 9,
      innerWidth: 6,
      innerHeight: 4,
      unit: 'm',
    });
    expect(p.kind === 'rect-minus-rect' && p.shaded).toBe(false);
    expect(compositeShape.render(p)).not.toContain('shapeHatch');
    expect(compositeShape.describe(p)).not.toContain('shaded');
  });
});

// R1.8 §4.3 and §4.6 — the solids the papers draw and the 2027 sheet supplies.
// R1.6 deferred perspective solids with a non-standard cross-section; a 2024
// question set exactly that, and cone and sphere formulae were added to the
// sheet because they will be examined.
describe('compositeShape — prisms in perspective and round solids', () => {
  const solids = [
    { kind: 'trapezoidal-prism', parallelA: 31.2, parallelB: 18, depth: 8.72, length: 20, unit: 'cm' },
    { kind: 'cone', radius: 7, height: 24, slant: 25, unit: 'cm' },
    { kind: 'sphere', radius: 6, unit: 'cm' },
    { kind: 'hemisphere', radius: 6, unit: 'cm' },
    { kind: 'cone-on-cylinder', radius: 5, coneHeight: 12, cylinderHeight: 20, unit: 'cm' },
    { kind: 'cylinder-plus-hemisphere', radius: 4, height: 15, unit: 'cm' },
  ] as const;

  it('draws every one of them with finite geometry', () => {
    for (const params of solids) {
      const svg = compositeShape.render(CompositeShapeParamsZ.parse(params));
      expect(svg, params.kind).not.toContain('NaN');
      expect((svg.match(/<(line|path|polygon|circle)/g) ?? []).length, params.kind).toBeGreaterThan(3);
    }
  });

  it('shades the trapezoidal cross-section, because that is the area asked for', () => {
    const svg = compositeShape.render(CompositeShapeParamsZ.parse(solids[0]));
    expect(svg).toContain('shapeHatch');
    const plain = compositeShape.render(CompositeShapeParamsZ.parse({ ...solids[0], shaded: false }));
    expect(plain).not.toContain('shapeHatch');
  });

  it('tells the solver what each solid is, with its dimensions', () => {
    const ctx = { stem: 'A solid of radius 7 cm, height 24 cm, slant height 25 cm.', partPrompts: [] };
    expect(compositeShape.describe(CompositeShapeParamsZ.parse(solids[1]))).toContain('slant height 25 cm');
    expect(compositeShape.verify(CompositeShapeParamsZ.parse(solids[1]), ctx)).toEqual([]);
  });

  it('rejects a slant height that contradicts the radius and height', () => {
    const bad = CompositeShapeParamsZ.parse({ kind: 'cone', radius: 7, height: 24, slant: 30, unit: 'cm' });
    const issues = compositeShape.verify(bad, { stem: 'radius 7 cm, height 24 cm, slant 30 cm', partPrompts: [] });
    expect(issues.join(' ')).toContain('slant height 30 disagrees');
  });

  it('rejects a trapezium whose parallel sides are equal — that is a rectangle', () => {
    const bad = CompositeShapeParamsZ.parse({
      kind: 'trapezoidal-prism',
      parallelA: 20,
      parallelB: 20,
      depth: 8,
      length: 30,
      unit: 'cm',
    });
    const issues = compositeShape.verify(bad, { stem: '20 cm, 20 cm, 8 cm, 30 cm', partPrompts: [] });
    expect(issues.join(' ')).toContain('different lengths');
  });
});

// January 2026 Q6: a running belt on a treadmill — a rectangle with a
// semicircular end at BOTH ends. rect-plus-semicircle caps one end, and the
// perimeter question this shape carries needs the other: the two half
// circumferences make one whole circle.
describe('compositeShape — stadium', () => {
  const params = CompositeShapeParamsZ.parse({
    kind: 'stadium',
    length: 2.1,
    width: 0.7,
    unit: 'm',
  });
  const context = {
    stem: 'The belt is 2.1 m long between the ends, and each semicircular end has a diameter of 0.7 m.',
    partPrompts: ['Calculate the length of the belt.'],
  };

  it('renders one closed outline with two arcs (snapshot)', () => {
    const svg = compositeShape.render(params);
    expect(svg).toContain('<svg');
    expect(svg).not.toMatch(/NaN|Infinity/);
    expect(svg).toMatchSnapshot();
  });

  it('tells the solver the ends make a whole circle, which is the insight', () => {
    const d = compositeShape.describe(params);
    expect(d).toContain('EACH end');
    expect(d).toContain('one full circle');
  });

  it('accepts dimensions the question states', () => {
    expect(compositeShape.verify(params, context)).toEqual([]);
  });

  it('rejects a dimension the student is never told', () => {
    expect(
      compositeShape.verify(params, { stem: 'A belt revolves around a board.', partPrompts: [] }).join(' '),
    ).toContain('2.1');
  });

  it('shades the whole region when asked', () => {
    const shaded = CompositeShapeParamsZ.parse({ ...params, shaded: true });
    expect(compositeShape.render(shaded)).toContain('shapeHatch');
  });
});

// May/June sweep — "the length of arc AB" and "the area of the shaded sector"
// recur across the papers, and had no figure: circleCenter draws the circle
// THEOREMS (chords, tangents, subtended angles), not a sector.
describe('compositeShape — sector', () => {
  const params = CompositeShapeParamsZ.parse({
    kind: 'sector',
    radius: 7,
    angle: 120,
    unit: 'cm',
    shaded: true,
  });
  const context = {
    stem: 'The sector has radius 7 cm and the angle at the centre is 120°.',
    partPrompts: ['Calculate the length of the arc.'],
  };

  it('renders a closed sector with the angle and radius marked', () => {
    const svg = compositeShape.render(params);
    expect(svg).toContain('120°');
    expect(svg).toContain('7 cm');
    expect(svg).not.toMatch(/NaN|Infinity/);
  });

  it('tells the solver the edges are two radii and an arc', () => {
    const d = compositeShape.describe(params);
    expect(d).toContain('radius 7 cm');
    expect(d).toContain('120° at the centre');
    expect(d).toContain('curved edge is the arc');
  });

  it('accepts values the question states', () => {
    expect(compositeShape.verify(params, context)).toEqual([]);
  });

  it('rejects a radius the student is never told', () => {
    expect(
      compositeShape.verify(params, { stem: 'A sector of a circle is shown.', partPrompts: [] }).join(' '),
    ).toContain('7');
  });

  it('sweeps a reflex angle the long way round', () => {
    // The large-arc flag is what makes 300 degrees look like 300 rather than 60.
    const reflex = CompositeShapeParamsZ.parse({ ...params, angle: 300 });
    expect(compositeShape.render(reflex)).toMatch(/A 150 150 0 1 0/);
    const minor = CompositeShapeParamsZ.parse({ ...params, angle: 60 });
    expect(compositeShape.render(minor)).toMatch(/A 150 150 0 0 0/);
  });
});
