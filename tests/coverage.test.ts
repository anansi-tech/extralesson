import { describe, expect, it } from 'vitest';
import {
  computeCoverage,
  coverageSummary,
  coverageDetail,
  displayFigure,
  FULL_PAPER_RAW_MARKS,
} from '@/lib/targets/coverage';
import { paperShape } from '@/lib/exam/paper-shape';
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
    const s = coverageSummary(coverage);
    expect(s).toContain(`${coverage.displayPercent}%`);
    // R2 §8 — the marks left on paper are the ones a photograph cannot reach.
    expect(s).toContain(`${coverage.photographed.uncoveredMarks} marks`);
    expect(s).toMatch(/ruler[- ]and[- ]compasses/);
  });

  it('is short enough to be read', () => {
    // Seventy words above the fold went unread, which said less than three
    // sentences that get read.
    const s = coverageSummary(coverage);
    expect(s.split(/\s+/).length).toBeLessThanOrEqual(50);
    expect(s.split('. ').length).toBeLessThanOrEqual(3);
  });

  it('names Paper 032 in the summary, because a private candidate needs the term', () => {
    // It is the one thing a reader cannot look up if we do not name it: they
    // would not know there was anything to look for.
    expect(coverageSummary(coverage)).toContain('Paper 032');
  });

  it('drops no fact into the detail that the summary was carrying', () => {
    const detail = coverageDetail(coverage).join(' ');
    for (const fact of [
      `${coverage.displayPercent}%`,
      `${coverage.photographed.uncoveredMarks} marks`,
      'ruler and compasses',
      'Paper 032',
      'school-based assessment',
      'graph paper',
      'solid-geometry',
    ]) {
      expect(detail, fact).toContain(fact);
    }
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

  // R1.7: "draw a graph" objectives came back in — we supply the graph and
  // assess reading it, which is a genuine half of what they test. What stays
  // out is instrument work: ruler, protractor and compasses on paper.
  it('keeps the instrument objectives out of the pool', () => {
    for (const id of ['M2.4.2', 'M2.4.3', 'M2.4.4']) {
      expect(assessableIds.has(id), `${id} must not be generated against`).toBe(false);
    }
  });

  it('generates against the graph objectives it covers in part', () => {
    for (const id of ['M1.6.1', 'M3.2.1']) {
      expect(assessableIds.has(id), `${id} should be generated against`).toBe(true);
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

// R1.7 §B1/§B6 — what we say about the paper, and about what we do not do.
describe('coverage statement (R1.7)', () => {
  it('rounds down to a number that does not claim false precision', () => {
    expect(coverage.percent).toBe(93);
    expect(coverage.displayPercent).toBe(90);
    expect(coverageSummary(coverage)).toContain('about 90%');
    expect(coverageSummary(coverage)).not.toContain('93%');
  });

  // A claim about coverage should lag the truth, never lead it. Untagging two
  // objectives moved the arithmetic from 91% to 93%, and the printed figure did
  // not move at all — which is the point.
  it('will not step up until the arithmetic is clear of the next figure', () => {
    expect(displayFigure(91)).toBe(90);
    expect(displayFigure(93)).toBe(90);
    expect(displayFigure(95)).toBe(90); // level with it is not past it
    expect(displayFigure(95.9)).toBe(90);
    expect(displayFigure(96)).toBe(95);
    expect(displayFigure(100)).toBe(95); // never claims all of it
  });

  it('says what partial coverage means, so the number cannot erase the caveat', () => {
    expect(coverage.partialCount).toBeGreaterThan(0);
    const s = coverageDetail(coverage).join(' ');
    // R1.9 set the drawing and self-checked it; R2 §8 marks it when the student
    // photographs it. The caveat is now conditional, and says which condition.
    expect(s).toMatch(/[Pp]hotograph what you drew and we check it/);
    expect(s).toContain('you check it yourself');
    expect(s).toContain('reading and interpreting only');
    expect(s).toContain('not covered at all'); // the instrument work
  });

  it('names the objectives it covers only in part', () => {
    const partial = coverage.topics.flatMap((t) => t.partial.map((p) => p.id));
    expect(partial).toContain('M1.6.1');
    expect(partial).toContain('M3.2.1');
    expect(partial).toContain('M1.4.8');
    for (const p of coverage.topics.flatMap((t) => t.partial)) {
      expect(p.reason.length, p.id).toBeGreaterThan(20);
    }
  });

  it('never rounds up past what we can show', () => {
    const round = (f: number) => Math.floor((f * 100) / 5) * 5;
    for (const f of [0.909, 0.94, 0.949, 0.96, 0.999]) {
      expect(round(f) * 1).toBeLessThanOrEqual(f * 100);
    }
  });

  it('names Paper 032, which we do not prepare anyone for', () => {
    const s = coverageDetail(coverage).join(' ');
    expect(s).toContain('Paper 032');
    expect(s).toContain('private candidates');
  });
});

describe('paperShape (R1.7 §B1)', () => {
  it('describes the 2027 paper as three module sections of three questions', () => {
    const s = paperShape('modular-2027');
    expect(s).toContain('three sections, one for each module');
    expect(s).toContain('three questions in each');
  });

  it('never describes module sections to a January re-sit candidate', () => {
    const s = paperShape('legacy-jan');
    expect(s).toContain('old format');
    expect(s).not.toMatch(/three sections|module sections(?!\.)/);
    expect(s).toContain('no module sections');
  });

  it('matches the seeded blueprint: three modules, 30 marks each in Paper 2', () => {
    for (const m of [1, 2, 3] as const) {
      const bp = seedBlueprints.find((b) => b.paper === 'P2' && b.module === m)!;
      const marks = bp.allocations.reduce((s, a) => s + (a.marks ?? 0), 0);
      expect(marks, `module ${m}`).toBe(30); // 3 questions x 10 marks
    }
  });
});

// R2 §8 — a photographed construction is marked, so a student who photographs
// is not on the same coverage figure as one who does not. Both are computed;
// neither is claimed above what the arithmetic supports.
describe('photographed coverage', () => {
  it('never falls below the typed-only figure: a photograph only adds', () => {
    expect(coverage.photographed.fraction).toBeGreaterThanOrEqual(coverage.fraction);
    expect(coverage.photographed.uncoveredMarks).toBeLessThanOrEqual(coverage.uncoveredMarks);
  });

  it('counts only objectives that DECLARE photo_assessable, not ones whose reason mentions a graph', () => {
    const declared = topics
      .flatMap((t) => t.objectives)
      .filter((o) => o.assessable === false && o.photo_assessable === true);
    const mentionsGraph = topics
      .flatMap((t) => t.objectives)
      .filter((o) => o.assessable === false && /graph|curve/i.test(o.unassessable_reason ?? ''));
    expect(declared.length).toBeGreaterThan(0);
    // Every declared one mentions a graph, but not every graph-mentioning one is
    // declared — the ban on prose-matching has to be visible as a difference.
    expect(mentionsGraph.length).toBeGreaterThanOrEqual(declared.length);
    const withoutField = computeCoverage(
      topics.map((t) => ({ ...t, objectives: t.objectives.map(({ ...o }) => ({ ...o, photo_assessable: undefined })) })),
      seedBlueprints,
    );
    expect(withoutField.photographed.fraction).toBe(withoutField.fraction);
  });

  it('never marks an instrument construction as photographable', () => {
    const instrument = topics
      .flatMap((t) => t.objectives)
      .filter((o) => /compass|protractor|instrument|Venn/i.test(o.unassessable_reason ?? ''));
    expect(instrument.length).toBeGreaterThan(0);
    for (const o of instrument) expect(o.photo_assessable).toBeUndefined();
  });

  it('displays under the same floor-to-five rule, so it can never lead the truth', () => {
    expect(coverage.photographed.displayPercent).toBe(displayFigure(coverage.photographed.fraction * 100));
    expect(coverage.photographed.displayPercent % 5).toBe(0);
    expect(coverage.photographed.displayPercent).toBeLessThanOrEqual(coverage.photographed.percent);
  });

  it('tells the student photographing is what earns those marks', () => {
    const said = [coverageSummary(coverage), ...coverageDetail(coverage)].join(' ');
    expect(said).toMatch(/photograph/i);
    expect(said).toContain(String(coverage.photographed.marksEarnedByPhoto));
  });
});
