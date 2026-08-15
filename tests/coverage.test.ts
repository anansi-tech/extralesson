import { describe, expect, it } from 'vitest';
import { computeCoverage, coverageSentence, FULL_PAPER_RAW_MARKS } from '@/lib/targets/coverage';
import { module1Topics } from '@/lib/seed/module1-topics';
import { module2Topics } from '@/lib/seed/module2-topics';
import { module3Topics } from '@/lib/seed/module3-topics';
import { seedBlueprints } from '@/lib/seed/blueprints';

const topics = [...module1Topics, ...module2Topics, ...module3Topics];
const coverage = computeCoverage(topics, seedBlueprints);

describe('computeCoverage (R1.6 §3)', () => {
  it('lands in the observed 5–10% uncoverable band', () => {
    console.log(
      `coverage ${coverage.percent}% · ${coverage.uncoveredMarks}/${FULL_PAPER_RAW_MARKS} marks uncovered`,
    );
    expect(coverage.percent).toBeGreaterThanOrEqual(90);
    expect(coverage.percent).toBeLessThanOrEqual(95);
  });

  it('excludes exactly the construction and drawing objectives that are tagged', () => {
    const excluded = coverage.topics.flatMap((t) => t.excluded);
    expect(excluded.length).toBe(topics.flatMap((t) => t.objectives).filter((o) => o.assessable === false).length);
    for (const e of excluded) expect(e.reason.length).toBeGreaterThan(10);
  });

  it('weights by blueprint marks, not by objective count', () => {
    // A topic carrying no blueprint weight cannot move the headline figure.
    const unweighted = computeCoverage(topics, []);
    expect(unweighted.fraction).toBe(1);
  });

  it('reports per-module coverage no greater than 1', () => {
    for (const m of [1, 2, 3] as const) {
      expect(coverage.byModule[m]).toBeGreaterThan(0.7);
      expect(coverage.byModule[m]).toBeLessThanOrEqual(1);
    }
  });

  it('states the gap plainly, in marks, without hedging', () => {
    const s = coverageSentence(coverage);
    expect(s).toContain(`${coverage.percent}%`);
    expect(s).toContain(`${coverage.uncoveredMarks} marks`);
    expect(s).toMatch(/pencil, ruler and compasses/);
  });
});
