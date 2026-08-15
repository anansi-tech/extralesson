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
