import { describe, expect, it } from 'vitest';
import { coordinateGrid, CoordinateGridParamsZ } from '@/lib/visuals/templates/coordinateGrid';
import { namedPoints, resolvePoints } from '@/lib/visuals/points';
import { renderVisual, describeVisual, paramsDocFor } from '@/lib/visuals';
import { verifyQuestionVisual } from '@/lib/visuals/verify';

// The figure's geometry and the question's geometry used to be authored
// separately, and every gate for that class detects a disagreement already
// written down. A figure that REFERENCES the question's points has nothing to
// disagree with.
const stem =
  "Triangle $ABC$, where $A(1,1)$, $B(3,1)$ and $C(2,3)$, is translated to triangle $A'B'C'$, where $A'=(5,-1)$, $B'=(7,-1)$ and $C'=(6,1)$.";
const ctx = { stem, partPrompts: ['Determine the translation vector.'] };

const params = CoordinateGridParamsZ.parse({
  named: {
    polygons: [{ points: ['A', 'B', 'C'] }, { points: ["A'", "B'", "C'"], dashed: true }],
  },
});

describe('named points come from the question and nowhere else', () => {
  it('reads every point the question states', () => {
    const found = namedPoints(ctx);
    expect(found.get('A')).toEqual({ label: 'A', x: 1, y: 1 });
    expect(found.get("C'")).toEqual({ label: "C'", x: 6, y: 1 });
    expect(found.size).toBe(6);
  });

  it('refuses a label the question states twice with different coordinates', () => {
    const found = namedPoints({ stem: 'P(1,2) and later P(4,5).', partPrompts: [] });
    expect(found.has('P')).toBe(false);
  });

  it('reports labels the question never states', () => {
    const { missing } = resolvePoints(['A', 'B', 'Z'], ctx);
    expect(missing).toEqual(['Z']);
  });
});

describe('the sketch is drawn from those coordinates', () => {
  const svg = coordinateGrid.render(params, ctx);

  it('places C above A and B, because that is what the question says', () => {
    const label = (t: string) =>
      [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)<\/text>/g)]
        .filter((m) => m[3] === t)
        .map((m) => ({ x: Number(m[1]), y: Number(m[2]) }))[0];
    // smaller y is higher on screen
    expect(label('C').y).toBeLessThan(label('A').y);
    expect(label('C').y).toBeLessThan(label('B').y);
    expect(label('A').x).toBeLessThan(label('B').x);
  });

  it('draws the image shape dashed', () => {
    expect(svg).toMatch(/<polygon points="[^"]+" stroke-dasharray/);
  });

  it('shows no axes, gridlines or scale numbers', () => {
    expect(svg).not.toContain('stroke-width="0.5"'); // gridlines
    expect(svg).not.toMatch(/<text[^>]*>-?\d+<\/text>/); // tick numerals
    expect(svg).not.toMatch(/<text[^>]*>x<\/text>/);
  });

  it('carries the caption, since it is a schematic', () => {
    const html = renderVisual({ template: 'coordinateGrid', params: params as never }, ctx);
    expect(html).toContain('Not drawn to scale');
  });

  it('tells the solver the real coordinates', () => {
    const text = describeVisual({ template: 'coordinateGrid', params: params as never }, ctx);
    expect(text).toContain('A(1, 1)');
    expect(text).toContain("C'(6, 1)");
    expect(text).toContain('Schematic sketch');
  });

  it('still draws the grid when the question is about reading it', () => {
    const plotted = CoordinateGridParamsZ.parse({
      named: { polygons: [{ points: ['A', 'B', 'C'] }], sketch: false },
    });
    const svg2 = coordinateGrid.render(plotted, ctx);
    expect(svg2).toContain('stroke-width="0.5"');
    const html = renderVisual({ template: 'coordinateGrid', params: plotted as never }, ctx);
    expect(html).not.toContain('Not drawn to scale');
  });
});

describe('the gate now has nothing left to catch', () => {
  it('passes the figure that used to contradict its question', () => {
    const res = verifyQuestionVisual({ template: 'coordinateGrid', params: params as never }, ctx);
    expect(res.ok).toBe(true);
  });

  it('rejects a figure referencing a point the question never states', () => {
    const res = verifyQuestionVisual(
      { template: 'coordinateGrid', params: { named: { polygons: [{ points: ['A', 'B', 'Z'] }] } } },
      ctx,
    );
    expect(res.ok).toBe(false);
    expect(res.issues.join(' ')).toContain('states no coordinates for it');
  });

  it('tells the model which templates cannot show a position', () => {
    const doc = paramsDocFor(['triangleLabeled', 'coordinateGrid']);
    expect(doc).toContain('PLACES ITS OWN POINTS');
    expect(doc).toContain('needs coordinateGrid with a "named" block');
  });
});

// The papers write an image point as A', A'' or A_1, and a generation run was
// rejected for using the forms it had been shown in its own exemplars.
describe('image points are named the way the papers name them', () => {
  const ctx2 = {
    stem: "Triangle $ABC$ with $A(1,1)$, $B(3,1)$, $C(2,3)$ maps to $A'(5,-1)$, $B''(7,-1)$ and $A_1(2,2)$.",
    partPrompts: [],
  };

  it('reads primes, double primes and subscripts', () => {
    const found = namedPoints(ctx2);
    expect(found.get("A'")).toEqual({ label: "A'", x: 5, y: -1 });
    expect(found.get("B''")).toEqual({ label: "B''", x: 7, y: -1 });
    expect(found.get('A_1')).toEqual({ label: 'A_1', x: 2, y: 2 });
  });

  it('accepts all of them as figure references', () => {
    const parsed = CoordinateGridParamsZ.safeParse({
      named: { polygons: [{ points: ['A', "B''", 'A_1'] }] },
    });
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
  });
});
