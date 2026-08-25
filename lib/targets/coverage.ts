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
  /**
   * R2 §8 — the same computation with the photographed constructions counted.
   * A student who photographs the graph they drew is assessed on it, so they
   * are not on the same coverage figure as one who does not, and printing one
   * number for both would understate the first and overstate the second.
   */
  photographed: {
    fraction: number;
    percent: number;
    displayPercent: number;
    uncoveredMarks: number;
    /** Raw marks a photograph moves from "not covered" to "marked". */
    marksEarnedByPhoto: number;
  };
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
    photo_assessable?: boolean;
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

  // Objectives a photograph brings back in. Read off the DECLARED field, never
  // off the wording of unassessable_reason — the reason is prose for a student
  // and prose is not structure.
  const photoBack = new Map(
    topics.map((t) => [
      t.code,
      t.objectives.filter((o) => o.assessable === false && o.photo_assessable === true).length,
    ]),
  );

  const share = (r: TopicCoverage) => (r.total === 0 ? 1 : r.assessable / r.total);
  const photoShare = (r: TopicCoverage) =>
    r.total === 0 ? 1 : Math.min(1, (r.assessable + (photoBack.get(r.code) ?? 0)) / r.total);

  let num = 0;
  let den = 0;
  let photoNum = 0;
  const byModule = {} as Record<ModuleNumber, number>;
  for (const m of [1, 2, 3] as const) {
    let mNum = 0;
    let mDen = 0;
    for (const r of rows.filter((r) => r.module === m)) {
      const w = weights.get(r.code) ?? 0;
      mNum += w * share(r);
      photoNum += w * photoShare(r);
      mDen += w;
    }
    byModule[m] = mDen === 0 ? 1 : mNum / mDen;
    num += mNum;
    den += mDen;
  }

  const fraction = den === 0 ? 1 : num / den;
  const photoFraction = den === 0 ? 1 : photoNum / den;
  const uncovered = Math.round((1 - fraction) * FULL_PAPER_RAW_MARKS);
  const photoUncovered = Math.round((1 - photoFraction) * FULL_PAPER_RAW_MARKS);
  const partialCount = rows.reduce((n, r) => n + r.partial.length, 0);
  return {
    fraction,
    percent: Math.round(fraction * 100),
    displayPercent: displayFigure(fraction * 100),
    uncoveredMarks: uncovered,
    partialCount,
    byModule,
    topics: rows,
    photographed: {
      fraction: photoFraction,
      percent: Math.round(photoFraction * 100),
      displayPercent: displayFigure(photoFraction * 100),
      uncoveredMarks: photoUncovered,
      marksEarnedByPhoto: uncovered - photoUncovered,
    },
  };
}

// The figure we print. Rounds down to a multiple of 5, and will not step up to
// the next one until the arithmetic is clear of it by a point — a coverage
// claim should lag the truth, never lead it, and under-claiming costs nothing.
export function displayFigure(percent: number): number {
  return Math.max(0, Math.floor((percent - 1) / 5) * 5);
}

// What we cover, said in two parts.
//
// It was one seventy-word paragraph carrying five facts, sitting above the
// fold on the landing page. Every fact in it was worth stating and the shape
// was self-defeating: seventy words that go unread say less than three
// sentences that get read.
//
// So the SUMMARY leads with the number and keeps the two facts a student could
// be caught out by — the marks we do not cover at all, and Paper 032, which a
// private candidate needs the name of to know it is missing. The DETAIL keeps
// everything, behind a disclosure, for the reader who wants it. No fact was
// dropped in the compression; they moved.

/** Two or three short sentences. The version everybody actually reads. */
export function coverageSummary(coverage: Coverage): string {
  const photo = coverage.photographed;
  return (
    `ExtraLesson practises about ${coverage.displayPercent}% of a CSEC Mathematics paper's marks, ` +
    `and marks your graphs when you photograph them — ${photo.marksEarnedByPhoto} marks you earn no other way. ` +
    `Construction with ruler and compasses, roughly ${photo.uncoveredMarks} marks, needs past papers. ` +
    `We do not prepare private candidates for Paper 032, the school-based assessment alternative.`
  );
}

/** Everything the summary compressed, for the reader who opens it. */
export function coverageDetail(coverage: Coverage): string[] {
  const lines = [
    `About ${coverage.displayPercent}% of a paper's marks are practised here, and marked the way an examiner marks them.`,
  ];
  if (coverage.partialCount > 0) {
    lines.push(
      'On graph questions we set the drawing itself: you do it on graph paper. Photograph what you drew and we check it — the intercept, the points you plotted, the shape of the curve — and those marks count. Without a photograph we show you the finished graph and the list of things an examiner credits, and you check it yourself, so they stay out of your estimate.',
      'On a few solid-geometry questions we cover reading and interpreting only.',
    );
  }
  lines.push(
    `Photographing your graphs is worth about ${coverage.photographed.marksEarnedByPhoto} marks a paper. Nothing you photograph can lose you a mark: it can only add.`,
    `Construction questions with ruler and compasses — roughly ${coverage.photographed.uncoveredMarks} marks — are not covered at all, so practise those with past papers.`,
    'Paper 032 is the alternative to the school-based assessment that private candidates sit. We do not prepare you for it.',
  );
  return lines;
}
