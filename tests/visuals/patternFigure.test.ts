import { describe, expect, it } from 'vitest';
import { patternFigure, PatternFigureParamsZ } from '@/lib/visuals/templates/patternFigure';

// ORIGINAL fixture data only (R1.5 ground truth — no CXC content anywhere).
const stickParams = PatternFigureParamsZ.parse({
  kind: 'matchsticks',
  arrangement: 'square',
  figure_numbers: [1, 2, 3],
  counts: [4, 7, 10],
});

const dotParams = PatternFigureParamsZ.parse({
  kind: 'dots',
  arrangement: 'triangle',
  figure_numbers: [1, 2, 3],
  counts: [3, 6, 10],
});

const context = {
  stem: 'The figures below show a pattern made of matchsticks.',
  partPrompts: ['Complete the table for Figure 4.'],
};

function elementCounts(svg: string, tag: 'circle' | 'line'): number[] {
  return [...svg.matchAll(/<g data-figure="\d+">([\s\S]*?)<\/g>/g)].map(
    (g) => (g[1].match(new RegExp(`<${tag} `, 'g')) ?? []).length,
  );
}

describe('patternFigure template', () => {
  it('renders deterministic SVG (snapshot)', () => {
    const svg = patternFigure.render(stickParams);
    expect(svg).toContain('<svg');
    expect(svg).toContain('Figure 1');
    expect(svg).toContain('Figure 3');
    expect(svg).toMatchSnapshot();
  });

  it('draws exactly counts[i] matchsticks inside each figure group', () => {
    const svg = patternFigure.render(stickParams);
    expect(elementCounts(svg, 'line')).toEqual([4, 7, 10]);
  });

  it('draws exactly counts[i] dots inside each figure group', () => {
    const svg = patternFigure.render(dotParams);
    expect(elementCounts(svg, 'circle')).toEqual([3, 6, 10]);
  });

  it('describe() gives the count for every figure', () => {
    const d = patternFigure.describe(stickParams);
    expect(d).toContain('Figure 1 has 4 matchsticks');
    expect(d).toContain('Figure 2 has 7 matchsticks');
    expect(d).toContain('Figure 3 has 10 matchsticks');
    expect(d).toContain('square');
  });

  it('verify passes on consistent linear and quadratic patterns', () => {
    expect(patternFigure.verify(stickParams, context)).toEqual([]);
    expect(patternFigure.verify(dotParams, context)).toEqual([]);
  });

  it('verify rejects counts with non-constant second differences', () => {
    const bad = { ...stickParams, figure_numbers: [1, 2, 3, 4], counts: [2, 5, 9, 15] };
    const issues = patternFigure.verify(bad, context);
    expect(issues.some((i) => i.includes('second differences'))).toBe(true);
  });

  it('verify rejects non-consecutive figure numbers', () => {
    const bad = { ...stickParams, figure_numbers: [1, 2, 4] };
    const issues = patternFigure.verify(bad, context);
    expect(issues.some((i) => i.includes('consecutive'))).toBe(true);
  });

  it('verify rejects counts that are not strictly increasing', () => {
    const bad = { ...stickParams, counts: [4, 4, 10] };
    const issues = patternFigure.verify(bad, context);
    expect(issues.some((i) => i.includes('strictly increasing'))).toBe(true);
  });
});
