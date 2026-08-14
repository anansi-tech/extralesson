import { describe, expect, it } from 'vitest';
import {
  polygonMarkedAngle,
  PolygonMarkedAngleParamsZ,
} from '@/lib/visuals/templates/polygonMarkedAngle';

// ORIGINAL fixture data only (R1.5 ground truth — no CXC content anywhere).
const params = PolygonMarkedAngleParamsZ.parse({
  sides: 5,
  angles: [
    { vertex: 0, value: 112 },
    { vertex: 1, value: 98 },
    { vertex: 2, value: 123 },
    { vertex: 3, value: 101 },
    { vertex: 4, variable: 'x°' },
  ],
});

const context = {
  stem: 'The pentagon ABCDE has interior angles of 112°, 98°, 123° and 101°, as shown.',
  partPrompts: ['Calculate the value of x.'],
};

describe('polygonMarkedAngle template', () => {
  it('renders deterministic SVG (snapshot)', () => {
    const svg = polygonMarkedAngle.render(params);
    expect(svg).toContain('<svg');
    expect(svg).toMatchSnapshot();
  });

  it('describe() carries everything needed to solve', () => {
    const d = polygonMarkedAngle.describe(params);
    expect(d).toContain('pentagon ABCDE');
    expect(d).toContain('112°');
    expect(d).toContain('98°');
    expect(d).toContain('123°');
    expect(d).toContain('101°');
    expect(d).toContain('at E is marked x°');
  });

  it('verify passes on consistent params', () => {
    expect(polygonMarkedAngle.verify(params, context)).toEqual([]);
  });

  it('verify rejects a full set of numeric angles with the wrong sum', () => {
    const bad = PolygonMarkedAngleParamsZ.parse({
      sides: 5,
      angles: [
        { vertex: 0, value: 112 },
        { vertex: 1, value: 98 },
        { vertex: 2, value: 123 },
        { vertex: 3, value: 101 },
        { vertex: 4, value: 120 },
      ],
    });
    const ctx = {
      stem: 'A pentagon with angles 112°, 98°, 123°, 101° and 120° is shown.',
      partPrompts: [],
    };
    const issues = polygonMarkedAngle.verify(bad, ctx);
    expect(issues.some((i) => i.includes('sum to 554') && i.includes('540'))).toBe(true);
  });

  it('verify rejects an interior angle outside (0, 360)', () => {
    const bad = PolygonMarkedAngleParamsZ.parse({
      sides: 4,
      angles: [{ vertex: 0, value: 380 }],
    });
    const ctx = { stem: 'An angle of 380° is claimed.', partPrompts: [] };
    const issues = polygonMarkedAngle.verify(bad, ctx);
    expect(issues.some((i) => i.includes('strictly between'))).toBe(true);
  });

  it('verify rejects a numeric angle never stated in the text', () => {
    const bad = PolygonMarkedAngleParamsZ.parse({
      sides: 5,
      angles: [{ vertex: 0, value: 88 }],
    });
    const issues = polygonMarkedAngle.verify(bad, context);
    expect(issues.some((i) => i.includes('never appears'))).toBe(true);
  });

  it('verify rejects a vertex index out of range', () => {
    const bad = PolygonMarkedAngleParamsZ.parse({
      sides: 4,
      angles: [{ vertex: 6, value: 112 }],
    });
    const issues = polygonMarkedAngle.verify(bad, context);
    expect(issues.some((i) => i.includes('out of range'))).toBe(true);
  });
});
