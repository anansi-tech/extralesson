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
