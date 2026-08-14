import { describe, expect, it } from 'vitest';
import {
  parallelTransversal,
  ParallelTransversalParamsZ,
} from '@/lib/visuals/templates/parallelTransversal';

// ORIGINAL fixture data only (R1.5 ground truth — no CXC content anywhere).
const params = ParallelTransversalParamsZ.parse({
  transversals: [{ angleDeg: 62 }],
  angles: [
    { transversal: 0, line: 'top', slot: 'NE', value: 62 },
    { transversal: 0, line: 'bottom', slot: 'SW', value: 62 },
    { transversal: 0, line: 'bottom', slot: 'NW', variable: 'y°' },
  ],
});

const context = {
  stem: 'Two parallel lines are cut by a transversal. One angle is 62°, as shown.',
  partPrompts: ['Calculate the value of y.'],
};

describe('parallelTransversal template', () => {
  it('renders deterministic SVG (snapshot)', () => {
    const svg = parallelTransversal.render(params);
    expect(svg).toContain('<svg');
    expect(svg).toMatchSnapshot();
  });

  it('describe() carries everything needed to solve', () => {
    const d = parallelTransversal.describe(params);
    expect(d).toContain('parallel lines');
    expect(d).toContain('62°');
    expect(d).toContain('y°');
    expect(d).toContain('north-east');
    expect(d).toContain('top parallel line');
    expect(d).toContain('bottom parallel line');
  });

  it('verify passes on consistent params', () => {
    expect(parallelTransversal.verify(params, context)).toEqual([]);
  });

  it('verify rejects alternate/corresponding angles that are not equal', () => {
    const bad = ParallelTransversalParamsZ.parse({
      transversals: [{ angleDeg: 62 }],
      angles: [
        { transversal: 0, line: 'top', slot: 'NE', value: 62 },
        { transversal: 0, line: 'bottom', slot: 'SW', value: 58 },
      ],
    });
    const ctx = { stem: 'Angles of 62° and 58° are shown.', partPrompts: [] };
    const issues = parallelTransversal.verify(bad, ctx);
    expect(issues.some((i) => i.includes('must be equal'))).toBe(true);
  });

  it('verify rejects co-interior angles that do not sum to 180', () => {
    const bad = ParallelTransversalParamsZ.parse({
      transversals: [{ angleDeg: 62 }],
      angles: [
        { transversal: 0, line: 'top', slot: 'SE', value: 62 },
        { transversal: 0, line: 'bottom', slot: 'NE', value: 100 },
      ],
    });
    const ctx = { stem: 'Angles of 62° and 100° are shown.', partPrompts: [] };
    const issues = parallelTransversal.verify(bad, ctx);
    expect(issues.some((i) => i.includes('sum to 180'))).toBe(true);
  });

  it('verify rejects a numeric angle never stated in the text', () => {
    const bad = ParallelTransversalParamsZ.parse({
      transversals: [{ angleDeg: 75 }],
      angles: [{ transversal: 0, line: 'top', slot: 'NE', value: 75 }],
    });
    const issues = parallelTransversal.verify(bad, context);
    expect(issues.some((i) => i.includes('never appears'))).toBe(true);
  });

  it('verify rejects an angle on a missing transversal', () => {
    const bad = ParallelTransversalParamsZ.parse({
      transversals: [{ angleDeg: 62 }],
      angles: [{ transversal: 1, line: 'top', slot: 'NE', value: 62 }],
    });
    const issues = parallelTransversal.verify(bad, context);
    expect(issues.some((i) => i.includes('only 1 exist'))).toBe(true);
  });
});
