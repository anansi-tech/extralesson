import {
  MCQ_ARCHETYPE_TARGETS,
  REPRESENTATION_TARGETS,
  STRUCTURED_ARCHETYPE_TARGETS,
} from './representation';
import type { Archetype, ModuleNumber, Profile, Representation } from '@/lib/types';

// R1.5 §4 — separate P1 and P2 target matrices. Blueprints (2027) are
// authoritative for marks/items; the corpus is authoritative for
// representation/archetype shares only.

export const P1_TOTAL = 160; // 60-item P1 table × 2.67

// R1.8 §2 — the P2 target is a pool of MARKS, and always was. It used to be
// written as 240 "questions" and then multiplied by an assumed 7-mark mean
// wherever it was actually used, which made the headline number a function of
// how big we happened to be writing questions that month. Paper-shaped
// questions run 9-12 marks instead of 4-10, so under the old unit the same
// bank would have looked like a 40% regression overnight while containing
// strictly more work.
//
// The pool is unchanged (240 × 7), so no topic's target moves. Only the unit
// is now the one we were already measuring in.
export const P2_MARKS_TOTAL = 1680;

// Per-module profile splits (per 20 P1 items / per 30 P2 raw marks).
export const P1_PROFILE_SPLIT: Record<Profile, number> = { CK: 6, AK: 8, R: 6 };
export const P2_PROFILE_SPLIT: Record<Profile, number> = { CK: 9, AK: 12, R: 9 };

// R1.7 §B5 asked for Paper 1 items to climb CK -> AK -> R within a topic
// block, and a fixed ten-item cycle delivered it. The cycle is balanced only
// over its full length: at two to five items per topic only its first
// positions ever ran, so R was structurally starved and the split sat at
// 31/53/16. The profile now comes from the same per-module deficit the rest of
// the recipe uses, which converges at any topic size; the ramp is emergent
// rather than fixed, which is the price of converging at all.

export const DIFFICULTY_TARGETS: Record<1 | 2 | 3, number> = { 1: 25, 2: 50, 3: 25 };

export interface QuestionFacts {
  kind: 'mcq' | 'structured';
  module: ModuleNumber;
  topic_code: string; // resolved from objective ids by the caller
  /** How many distinct topics the question's objectives span. */
  topic_span?: number;
  representation: Representation;
  archetype: Archetype;
  difficulty: 1 | 2 | 3;
  marks: number;
  rubric_profile_marks: Record<Profile, number>; // structured: rubric totals; mcq: {profile: 1}
}

export interface TopicRow {
  code: string;
  title: string;
  module: ModuleNumber;
  /** P1: item count target; P2: rubric-marks target (share of blueprint marks) */
  p1_target: number;
  p1_actual: number;
  p2_marks_target: number;
  p2_marks_actual: number;
  p2_questions: number;
  representation_actuals: Partial<Record<Representation, number>>;
}

export interface Matrix {
  topics: TopicRow[];
  p1_actual_total: number;
  p2_actual_total: number; // questions
  p2_marks_actual_total: number;
  archetype_actuals: { mcq: Partial<Record<Archetype, number>>; structured: Partial<Record<Archetype, number>> };
  difficulty_actuals: { mcq: Record<1 | 2 | 3, number>; structured: Record<1 | 2 | 3, number> };
  profile_actuals: Record<ModuleNumber, { p1: Record<Profile, number>; p2: Record<Profile, number> }>;
  mcq_visual_actual: number;
  /** Structured questions drawing on more than one topic (R1.8 pairing). */
  multi_topic_actual: number;
}

interface BlueprintLean {
  paper: 'P1' | 'P2';
  module: number;
  allocations: { topic_codes: string[]; items?: number; marks?: number }[];
}

interface TopicLean {
  code: string;
  title: string;
  module: ModuleNumber;
  order: number;
}

// A topic's share of the 90 blueprint marks (cluster marks split equally among
// the topics in the cluster), scaled to the bank's marks pool. Measuring the
// share in marks is what lets question size change without moving the target.
export function p2MarksTargetForTopic(blueprints: BlueprintLean[], topicCode: string): number {
  const POOL = P2_MARKS_TOTAL;
  let share = 0;
  for (const b of blueprints.filter((b) => b.paper === 'P2')) {
    for (const a of b.allocations) {
      if (a.topic_codes.includes(topicCode)) {
        share += (a.marks ?? 0) / a.topic_codes.length / 90;
      }
    }
  }
  return Math.round(share * POOL);
}

export function p1TargetForTopic(blueprints: BlueprintLean[], topicCode: string): number {
  for (const b of blueprints.filter((b) => b.paper === 'P1')) {
    for (const a of b.allocations) {
      if (a.topic_codes.includes(topicCode)) {
        return Math.round(((a.items ?? 0) * P1_TOTAL) / 60);
      }
    }
  }
  return 0;
}

export function computeMatrix(
  topics: TopicLean[],
  blueprints: BlueprintLean[],
  questions: QuestionFacts[],
): Matrix {
  const rows: TopicRow[] = topics
    .sort((a, b) => a.module - b.module || a.order - b.order)
    .map((t) => ({
      code: t.code,
      title: t.title,
      module: t.module,
      p1_target: p1TargetForTopic(blueprints, t.code),
      p1_actual: 0,
      p2_marks_target: p2MarksTargetForTopic(blueprints, t.code),
      p2_marks_actual: 0,
      p2_questions: 0,
      representation_actuals: {},
    }));
  const byCode = new Map(rows.map((r) => [r.code, r]));

  const matrix: Matrix = {
    topics: rows,
    p1_actual_total: 0,
    p2_actual_total: 0,
    p2_marks_actual_total: 0,
    archetype_actuals: { mcq: {}, structured: {} },
    difficulty_actuals: { mcq: { 1: 0, 2: 0, 3: 0 }, structured: { 1: 0, 2: 0, 3: 0 } },
    profile_actuals: {
      1: { p1: { CK: 0, AK: 0, R: 0 }, p2: { CK: 0, AK: 0, R: 0 } },
      2: { p1: { CK: 0, AK: 0, R: 0 }, p2: { CK: 0, AK: 0, R: 0 } },
      3: { p1: { CK: 0, AK: 0, R: 0 }, p2: { CK: 0, AK: 0, R: 0 } },
    },
    mcq_visual_actual: 0,
    multi_topic_actual: 0,
  };

  for (const q of questions) {
    const row = byCode.get(q.topic_code);
    const paperKey = q.kind === 'mcq' ? 'p1' : 'p2';
    if (q.kind === 'mcq') {
      matrix.p1_actual_total++;
      if (row) row.p1_actual++;
      if (q.representation !== 'prose') matrix.mcq_visual_actual++;
    } else {
      matrix.p2_actual_total++;
      matrix.p2_marks_actual_total += q.marks;
      if ((q.topic_span ?? 1) > 1) matrix.multi_topic_actual++;
      if (row) {
        row.p2_marks_actual += q.marks;
        row.p2_questions++;
      }
    }
    if (row) {
      row.representation_actuals[q.representation] =
        (row.representation_actuals[q.representation] ?? 0) + 1;
    }
    const arch = matrix.archetype_actuals[q.kind];
    arch[q.archetype] = (arch[q.archetype] ?? 0) + 1;
    matrix.difficulty_actuals[q.kind][q.difficulty]++;
    const prof = matrix.profile_actuals[q.module][paperKey];
    for (const p of ['CK', 'AK', 'R'] as const) prof[p] += q.rubric_profile_marks[p] ?? 0;
  }

  return matrix;
}

// Deficit of a categorical dimension: target share minus actual share,
// weighted by target share so under-covered heavyweight cells win early.
export function largestDeficit<K extends string>(
  targets: Record<K, number>,
  actuals: Partial<Record<K, number>>,
): K {
  const targetTotal = Object.values<number>(targets).reduce((s, v) => s + v, 0);
  const actualTotal = Object.values(actuals as Record<string, number>).reduce(
    (s, v) => s + (v ?? 0),
    0,
  );
  let best: K | null = null;
  let bestScore = -Infinity;
  for (const key of Object.keys(targets) as K[]) {
    const targetShare = targets[key] / targetTotal;
    const actualShare = actualTotal === 0 ? 0 : (actuals[key] ?? 0) / actualTotal;
    const score = (targetShare - actualShare) + targetShare * 1e-6; // deterministic tiebreak
    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  }
  return best!;
}

export { REPRESENTATION_TARGETS, STRUCTURED_ARCHETYPE_TARGETS, MCQ_ARCHETYPE_TARGETS };
