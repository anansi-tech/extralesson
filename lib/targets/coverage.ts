import { topicWeights } from '@/lib/mastery/fold';
import type { ModuleNumber } from '@/lib/types';

// R1.6 §3/§4 — how much of the exam ExtraLesson can actually assess.
//
// Construction and drawing objectives need pencil, ruler and compasses, so we
// cannot assess them and must not score around them silently. Coverage is
// computed from the syllabus seeds (which objectives are assessable) weighted
// by the blueprint (how many marks each topic carries), then stated plainly to
// the student and used to bound the grade prediction.

// Raw marks in a full sitting: Paper 1 is 60 one-mark items, Paper 2 is 90
// marks. Used to express the gap as "about N marks".
export const FULL_PAPER_RAW_MARKS = 150;

export interface TopicCoverage {
  code: string;
  module: ModuleNumber;
  assessable: number;
  total: number;
  /** Objectives we cannot assess, with the reason, for the UI to list. */
  excluded: { id: string; text: string; reason: string }[];
  /** Objectives we assess in part — reading one, not producing one. */
  partial: { id: string; text: string; reason: string }[];
}

export interface Coverage {
  /** 0..1 — share of exam marks we can assess, blueprint-weighted. */
  fraction: number;
  percent: number;
  /**
   * What we SAY. An estimate built from a proxy does not deserve a precise
   * number, and rounding down never claims coverage we cannot show.
   */
  displayPercent: number;
  /** Approximate raw marks per full paper that we cannot assess. */
  uncoveredMarks: number;
  /** Objectives covered in part, across every topic. */
  partialCount: number;
  byModule: Record<ModuleNumber, number>;
  topics: TopicCoverage[];
}

// Structural, not the seed's `Objective`: documents read back from Mongo type
// `assessable` as a plain boolean, and only `false` excludes.
interface TopicLike {
  code: string;
  module: ModuleNumber;
  objectives: {
    id: string;
    text: string;
    assessable?: boolean;
    unassessable_reason?: string;
    partial_reason?: string;
  }[];
}

interface BlueprintLike {
  paper: 'P1' | 'P2';
  module: number;
  allocations: { topic_codes: string[]; items?: number; marks?: number }[];
}

export function computeCoverage(topics: TopicLike[], blueprints: BlueprintLike[]): Coverage {
  // Blueprint weight per topic: P1 items plus its share of P2 cluster marks.
  const weights = new Map<string, number>();
  for (const m of [1, 2, 3] as const) {
    for (const [code, w] of topicWeights(blueprints, m)) weights.set(code, w);
  }

  const rows: TopicCoverage[] = topics.map((t) => {
    const excluded = t.objectives
      .filter((o) => o.assessable === false)
      .map((o) => ({ id: o.id, text: o.text, reason: o.unassessable_reason ?? 'Not assessable.' }));
    const partial = t.objectives
      .filter((o) => o.assessable !== false && o.partial_reason)
      .map((o) => ({ id: o.id, text: o.text, reason: o.partial_reason! }));
    return {
      code: t.code,
      module: t.module,
      assessable: t.objectives.length - excluded.length,
      total: t.objectives.length,
      excluded,
      partial,
    };
  });

  const share = (r: TopicCoverage) => (r.total === 0 ? 1 : r.assessable / r.total);

  let num = 0;
  let den = 0;
  const byModule = {} as Record<ModuleNumber, number>;
  for (const m of [1, 2, 3] as const) {
    let mNum = 0;
    let mDen = 0;
    for (const r of rows.filter((r) => r.module === m)) {
      const w = weights.get(r.code) ?? 0;
      mNum += w * share(r);
      mDen += w;
    }
    byModule[m] = mDen === 0 ? 1 : mNum / mDen;
    num += mNum;
    den += mDen;
  }

  const fraction = den === 0 ? 1 : num / den;
  const partialCount = rows.reduce((n, r) => n + r.partial.length, 0);
  return {
    fraction,
    percent: Math.round(fraction * 100),
    displayPercent: displayFigure(fraction * 100),
    uncoveredMarks: Math.round((1 - fraction) * FULL_PAPER_RAW_MARKS),
    partialCount,
    byModule,
    topics: rows,
  };
}

// The figure we print. Rounds down to a multiple of 5, and will not step up to
// the next one until the arithmetic is clear of it by a point — a coverage
// claim should lag the truth, never lead it, and under-claiming costs nothing.
export function displayFigure(percent: number): number {
  return Math.max(0, Math.floor((percent - 1) / 5) * 5);
}

// The sentence shown to students on the mastery map and beside the predicted
// grade, and echoed on the landing page. Stating coverage is a trust asset.
export function coverageSentence(coverage: Coverage): string {
  const partial =
    coverage.partialCount > 0
      ? ` On graph questions we set the drawing itself: you do it on graph paper, and once you have answered we show the finished graph with the list of things an examiner credits, for you to check against. We do not mark the drawing, so those marks stay out of your estimate. On a few solid-geometry and region-shading questions we cover reading and interpreting only.`
      : '';
  return `ExtraLesson practises about ${coverage.displayPercent}% of the marks in a CSEC Mathematics paper.${partial} Construction questions with ruler and compasses — roughly ${coverage.uncoveredMarks} marks — are not covered at all, so practise those with past papers. We do not prepare you for Paper 032, the alternative to the school-based assessment that private candidates sit.`;
}
