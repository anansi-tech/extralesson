import { BANDS, FOLD_WEIGHTS, type MasteryBand } from './config';

// All mastery state is a fold over append-only attempts (ROUND_1 §3.5, §6.5).
// Inputs here are plain data so every function is unit-testable without a DB.

export interface AttemptScore {
  objective_ids: string[];
  score: number; // fraction of available marks earned, 0..1
  ts: number; // epoch ms
}

// Mastery for one objective: weighted fold over its last 5 attempts,
// weights 5..1, most recent attempt weighted heaviest.
export function objectiveMastery(scoresNewestFirst: number[]): number | null {
  if (scoresNewestFirst.length === 0) return null;
  const window = scoresNewestFirst.slice(0, FOLD_WEIGHTS.length);
  let num = 0;
  let den = 0;
  window.forEach((s, i) => {
    num += FOLD_WEIGHTS[i] * s;
    den += FOLD_WEIGHTS[i];
  });
  return num / den;
}

export function bandFor(mastery: number | null): MasteryBand {
  if (mastery === null) return 'NOT_STARTED';
  if (mastery >= BANDS.STRONG) return 'STRONG';
  if (mastery >= BANDS.BUILDING) return 'BUILDING';
  return 'WEAK';
}

// Fold a student's attempts into per-objective mastery.
export function masteryByObjective(attempts: AttemptScore[]): Map<string, number> {
  const byObjective = new Map<string, { score: number; ts: number }[]>();
  for (const a of attempts) {
    for (const id of a.objective_ids) {
      (byObjective.get(id) ?? byObjective.set(id, []).get(id)!).push({ score: a.score, ts: a.ts });
    }
  }
  const out = new Map<string, number>();
  for (const [id, list] of byObjective) {
    list.sort((a, b) => b.ts - a.ts);
    out.set(id, objectiveMastery(list.map((l) => l.score))!);
  }
  return out;
}

// Topic mastery: mean over ALL the topic's objectives, counting untouched
// objectives as 0. Conservative by design — "honest arithmetic" (§6.6).
export function topicMastery(objectiveIds: string[], perObjective: Map<string, number>): number {
  if (objectiveIds.length === 0) return 0;
  const sum = objectiveIds.reduce((s, id) => s + (perObjective.get(id) ?? 0), 0);
  return sum / objectiveIds.length;
}

export interface TopicWeight {
  code: string;
  weight: number; // blueprint-derived weight (P1 items + P2 mark share)
}

// Blueprint weight per topic: its P1 item count plus an equal share of each
// P2 cluster's marks (the syllabus allocates P2 marks to topic clusters).
export function topicWeights(
  blueprints: {
    paper: 'P1' | 'P2';
    module: number;
    allocations: { topic_codes: string[]; items?: number; marks?: number }[];
  }[],
  module: number,
): Map<string, number> {
  const weights = new Map<string, number>();
  for (const b of blueprints.filter((b) => b.module === module)) {
    for (const a of b.allocations) {
      const value = (a.items ?? 0) + (a.marks ?? 0);
      const share = value / a.topic_codes.length;
      for (const code of a.topic_codes) {
        weights.set(code, (weights.get(code) ?? 0) + share);
      }
    }
  }
  return weights;
}

// Module mastery: blueprint-weighted rollup of its topics (§6.5).
export function moduleMastery(
  topics: { code: string; mastery: number }[],
  weights: Map<string, number>,
): number {
  let num = 0;
  let den = 0;
  for (const t of topics) {
    const w = weights.get(t.code) ?? 0;
    num += w * t.mastery;
    den += w;
  }
  return den === 0 ? 0 : num / den;
}
