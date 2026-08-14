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
