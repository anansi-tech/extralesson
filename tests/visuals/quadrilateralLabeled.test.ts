import { describe, expect, it } from 'vitest';
import { quadrilateralLabeled, QuadrilateralLabeledParamsZ } from '@/lib/visuals/templates/quadrilateralLabeled';

// ORIGINAL fixture data only (R1.5 ground truth — no CXC content anywhere).
const trapezium = QuadrilateralLabeledParamsZ.parse({
  shape: 'trapezium',
  labels: ['P', 'Q', 'R', 'S'],
  sides: [
    { side: 0, value: 8, unit: 'cm' },
    { side: 2, value: 14, unit: 'cm' },
  ],
  angles: [
    { vertex: 3, value: 62 },
    { vertex: 2, variable: 'y' },
  ],
});

const context = {
  stem: 'In the trapezium PQRS, PQ = 8 cm, SR = 14 cm and angle S = 62°.',
  partPrompts: ['Calculate the size of angle y.'],
};

describe('quadrilateralLabeled template', () => {
  it('renders deterministic SVG (snapshot)', () => {
    const svg = quadrilateralLabeled.render(trapezium);
    expect(svg).toContain('<svg');
    expect(svg).toMatchSnapshot();
  });

  it('renders every shape without producing NaN coordinates', () => {
    for (const shape of ['trapezium', 'parallelogram', 'kite', 'rectangle'] as const) {
      const svg = quadrilateralLabeled.render(QuadrilateralLabeledParamsZ.parse({ shape }));
      expect(svg, shape).not.toMatch(/NaN|Infinity/);
    }
  });

  it('marks the parallel pair a trapezium has, and only that pair', () => {
    // one chevron per parallel side: a trapezium has exactly two such sides
    const svg = quadrilateralLabeled.render(trapezium);
    const chevrons = svg.match(/<path d="M [^"]+" fill="none" \/>/g) ?? [];
    expect(chevrons).toHaveLength(2);
  });

  it('marks both pairs of a parallelogram, with a second chevron on the second pair', () => {
    const svg = quadrilateralLabeled.render(QuadrilateralLabeledParamsZ.parse({ shape: 'parallelogram' }));
    const chevrons = svg.match(/<path d="M [^"]+" fill="none" \/>/g) ?? [];
    expect(chevrons).toHaveLength(2 + 2 * 2);
  });

  it('describes the figure for the solver, naming the parallel sides', () => {
    const description = quadrilateralLabeled.describe(trapezium);
    expect(description).toContain('PQ is parallel to RS');
    expect(description).toContain('The angle at S is marked 62°');
    expect(description).toContain('Side PQ is marked 8 cm');
  });

  it('accepts a figure whose values all appear in the question text', () => {
    expect(quadrilateralLabeled.verify(trapezium, context)).toEqual([]);
  });

  it('rejects a value the student is never told', () => {
    const issues = quadrilateralLabeled.verify(trapezium, {
      stem: 'In the trapezium PQRS, PQ = 8 cm and SR = 14 cm.',
      partPrompts: ['Calculate the size of angle y.'],
    });
    expect(issues.join(' ')).toContain('62');
  });

  it('rejects four angles that do not sum to 360', () => {
    const bad = QuadrilateralLabeledParamsZ.parse({
      shape: 'kite',
      angles: [
        { vertex: 0, value: 100 },
        { vertex: 1, value: 100 },
        { vertex: 2, value: 100 },
        { vertex: 3, value: 100 },
      ],
    });
    const issues = quadrilateralLabeled.verify(bad, {
      stem: 'A kite has angles of 100°, 100°, 100° and 100°.',
      partPrompts: ['Find the error.'],
    });
    expect(issues.join(' ')).toContain('400');
  });

  it('rejects a rectangle whose angle is not a right angle', () => {
    const bad = QuadrilateralLabeledParamsZ.parse({
      shape: 'rectangle',
      angles: [{ vertex: 0, value: 70 }],
    });
    const issues = quadrilateralLabeled.verify(bad, {
      stem: 'A rectangle ABCD has an angle of 70°.',
      partPrompts: ['Explain.'],
    });
    expect(issues.join(' ')).toContain('90°');
  });

  it("rejects unequal opposite angles in a parallelogram", () => {
    const bad = QuadrilateralLabeledParamsZ.parse({
      shape: 'parallelogram',
      angles: [
        { vertex: 0, value: 70 },
        { vertex: 2, value: 80 },
      ],
    });
    const issues = quadrilateralLabeled.verify(bad, {
      stem: 'A parallelogram ABCD has angles of 70° and 80° opposite each other.',
      partPrompts: ['Explain.'],
    });
    expect(issues.join(' ')).toContain('opposite angles');
  });

  it('reports equal tick marks as equal sides, which is what they tell a student', () => {
    const kite = QuadrilateralLabeledParamsZ.parse({
      shape: 'kite',
      equalTicks: [
        { side: 0, count: 1 },
        { side: 3, count: 1 },
      ],
    });
    expect(quadrilateralLabeled.describe(kite)).toContain('equal in length');
  });
});
