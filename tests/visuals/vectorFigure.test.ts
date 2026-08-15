import { describe, expect, it } from 'vitest';
import {
  vectorFigure,
  VectorFigureParamsZ,
  type VectorFigureParams,
} from '@/lib/visuals/templates/vectorFigure';

// ORIGINAL fixture data only (R1.5 ground truth — no CXC content anywhere).
const triangle = VectorFigureParamsZ.parse({
  shape: 'triangle',
  vectors: [
    { from: 'A', to: 'B', label: 'p' },
    { from: 'A', to: 'C', label: 'q' },
  ],
  points: [{ label: 'M', on: ['B', 'C'], ratio: 0.5 }],
});

const parallelogram = VectorFigureParamsZ.parse({
  shape: 'parallelogram',
  vectors: [
    { from: 'A', to: 'B', label: 'a' },
    { from: 'A', to: 'D', label: 'b' },
  ],
  points: [{ label: 'P', on: ['A', 'C'], ratio: 1 / 3 }],
  equalMarks: [{ first: { from: 'A', to: 'B' }, second: { from: 'D', to: 'C' } }],
});

const context = {
  stem: 'The figure shows a parallelogram with two vectors marked.',
  partPrompts: ['Write an expression for the third vector in terms of a and b.'],
};

describe('vectorFigure template', () => {
  it('renders a triangle with two labelled vectors and a midpoint (snapshot)', () => {
    const svg = vectorFigure.render(triangle);
    expect(svg).toContain('<svg');
    // outline polygon + one arrowhead per vector
    expect((svg.match(/<polygon points=/g) ?? []).length).toBe(3);
    expect((svg.match(/<circle/g) ?? []).length).toBe(1); // the midpoint dot
    expect(svg).toContain('>M<');
    expect(svg).toContain('>p<');
    expect(svg).toMatchSnapshot();
  });

  it('renders a parallelogram with a ratio-divided point and equal marks (snapshot)', () => {
    const svg = vectorFigure.render(parallelogram);
    expect((svg.match(/<polygon points=/g) ?? []).length).toBe(3);
    expect((svg.match(/<circle/g) ?? []).length).toBe(1); // the point P dot
    expect(svg).toContain('>P<');
    expect(svg).toContain('>D<');
    expect(svg).toMatchSnapshot();
  });

  it('describe() carries every vertex, ratio and vector label', () => {
    const d = vectorFigure.describe(triangle);
    expect(d).toContain('Triangle ABC');
    expect(d).toContain('A, B, C');
    expect(d).toContain('Point M lies on BC');
    expect(d).toContain('1/2');
    expect(d).toContain('BM : MC = 1 : 1');
    expect(d).toContain('from A to B, labelled p');
    expect(d).toContain('from A to C, labelled q');
  });

  it('describe() gives the parallelogram property, the 1 : 2 split and the equal marks', () => {
    const d = vectorFigure.describe(parallelogram);
    expect(d).toContain('Parallelogram ABCD');
    expect(d).toContain('AB is parallel and equal in length to DC');
    expect(d).toContain('Point P lies on AC');
    expect(d).toContain('1/3');
    expect(d).toContain('AP : PC = 1 : 2');
    expect(d).toContain('AB and DC carry matching single tick marks');
  });

  it('verify passes on both well-formed figures', () => {
    expect(vectorFigure.verify(triangle, context)).toEqual([]);
    expect(vectorFigure.verify(parallelogram, context)).toEqual([]);
  });

  it('verify rejects a vector that names an undeclared point', () => {
    const bad = { ...triangle, vectors: [{ from: 'A', to: 'Z', label: 'r' }] };
    expect(vectorFigure.verify(bad, context).join(' ')).toContain(
      'references "Z", which is not a declared vertex or point',
    );
  });

  it('verify rejects a point placed on an undeclared segment endpoint', () => {
    const bad = { ...triangle, points: [{ label: 'M', on: ['B', 'Q'] as [string, string], ratio: 0.5 }] };
    expect(vectorFigure.verify(bad, context).join(' ')).toContain('point M references "Q"');
  });

  it('verify rejects a ratio outside (0, 1)', () => {
    // Built raw: the Zod schema also rejects this, so verify() is the second gate.
    const bad: VectorFigureParams = {
      ...triangle,
      points: [{ label: 'M', on: ['B', 'C'], ratio: 1.4 }],
    };
    expect(vectorFigure.verify(bad, context).join(' ')).toContain(
      'ratio 1.4, which must be strictly between 0 and 1',
    );
  });

  it('verify rejects a point label that duplicates a vertex', () => {
    const bad = { ...triangle, points: [{ label: 'B', on: ['B', 'C'] as [string, string], ratio: 0.5 }] };
    expect(vectorFigure.verify(bad, context).join(' ')).toContain('label "B" is used more than once');
  });

  it('verify rejects a zero-length vector', () => {
    const bad = { ...triangle, vectors: [{ from: 'A', to: 'A', label: 'p' }] };
    expect(vectorFigure.verify(bad, context).join(' ')).toContain('to itself has zero length');
  });

  it('verify rejects a vertex count that contradicts the shape', () => {
    const bad = VectorFigureParamsZ.parse({ shape: 'triangle', labels: ['A', 'B', 'C', 'D'] });
    expect(vectorFigure.verify(bad, context).join(' ')).toContain(
      'a triangle needs 3 vertex labels, but 4 were given',
    );
  });

  it('verify rejects an equalMarks segment that is not a real segment', () => {
    const bad = {
      ...parallelogram,
      equalMarks: [{ first: { from: 'A', to: 'A' }, second: { from: 'D', to: 'C' } }],
    };
    expect(vectorFigure.verify(bad, context).join(' ')).toContain('which is not a real segment');
  });

  it('verify rejects a circular point definition', () => {
    const bad: VectorFigureParams = {
      ...triangle,
      points: [
        { label: 'M', on: ['B', 'N'], ratio: 0.5 },
        { label: 'N', on: ['C', 'M'], ratio: 0.5 },
      ],
    };
    expect(vectorFigure.verify(bad, context).join(' ')).toContain('cannot be placed');
  });

  it('places a point defined on a segment between two other points', () => {
    // N is the midpoint of A and M, where M is the midpoint of BC.
    const nested = VectorFigureParamsZ.parse({
      shape: 'triangle',
      points: [
        { label: 'M', on: ['B', 'C'], ratio: 0.5 },
        { label: 'N', on: ['A', 'M'], ratio: 0.5 },
      ],
      vectors: [{ from: 'A', to: 'N', label: 'v' }],
    });
    expect(vectorFigure.verify(nested, context)).toEqual([]);
    expect((vectorFigure.render(nested).match(/<circle/g) ?? []).length).toBe(2);
  });
});
