import { describe, expect, it } from 'vitest';
import { numberLine, NumberLineParamsZ } from '@/lib/visuals/templates/numberLine';

// ORIGINAL fixture data only (R1.5 ground truth — no CXC content anywhere).
const params = NumberLineParamsZ.parse({
  min: -5,
  max: 5,
  step: 1,
  points: [{ value: 3, label: 'p', filled: false }],
  interval: { from: null, to: 3 },
});

const context = {
  stem: 'The solution set of $x < 3$ is shown on the number line.',
  partPrompts: ['State the largest integer in the solution set.'],
};

describe('numberLine template', () => {
  it('renders deterministic SVG (snapshot)', () => {
    const svg = numberLine.render(params);
    expect(svg).toContain('<svg');
    expect(svg).toMatchSnapshot();
  });

  it('describe() carries everything needed to solve', () => {
    const d = numberLine.describe(params);
    expect(d).toContain('-5');
    expect(d).toContain('open point at 3');
    expect(d).toContain('interval');
  });

  it('verify passes on consistent params', () => {
    expect(numberLine.verify(params, context)).toEqual([]);
  });

  it('verify rejects a point outside the range', () => {
    const bad = { ...params, points: [{ value: 9, filled: true }] };
    expect(numberLine.verify(bad, context).length).toBeGreaterThan(0);
  });

  it('verify rejects a labeled value never stated in the text', () => {
    const bad = { ...params, points: [{ value: 4, filled: true }] };
    const issues = numberLine.verify(bad, context);
    expect(issues.some((i) => i.includes('never appears'))).toBe(true);
  });
});
