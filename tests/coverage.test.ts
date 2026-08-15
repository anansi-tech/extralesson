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

// R1.6 §3 — the tag is only honest if generation honours it. An M2-GEO1 batch
// wrote seven questions against "draw angles accurately using appropriate
// instruments" and "measure angles and line segments accurately", both tagged
// unassessable, and the questions did what those objectives ask: they told the
// student to measure a figure that is not to scale, and asked which instruments
// they would use.
describe('unassessable objectives are excluded from generation, not just from the count', () => {
  const assessableIds = new Set(
    topics.flatMap((t) => t.objectives.filter((o) => o.assessable !== false).map((o) => o.id)),
  );

  it('leaves every topic with something to generate against', () => {
    for (const t of topics) {
      const usable = t.objectives.filter((o) => o.assessable !== false);
      expect(usable.length, `${t.code} has no assessable objective left`).toBeGreaterThan(0);
    }
  });

  it('keeps the construction and measurement objectives out of the pool', () => {
    for (const id of ['M2.4.2', 'M2.4.3', 'M2.4.4', 'M1.3.6', 'M1.6.1']) {
      expect(assessableIds.has(id), `${id} must not be generated against`).toBe(false);
    }
  });

  it('every excluded objective says why, in words a student could read', () => {
    for (const t of topics) {
      for (const o of t.objectives.filter((o) => o.assessable === false)) {
        expect(o.unassessable_reason, `${o.id} has no reason`).toBeTruthy();
        expect(o.unassessable_reason!.length).toBeGreaterThan(15);
      }
    }
  });
});
