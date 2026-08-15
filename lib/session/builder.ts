import { M1_PREREQ_THRESHOLD } from '@/lib/mastery/config';
import type { ModuleNumber, QuestionKind } from '@/lib/types';

// Session builder (ROUND_1 §6.2). Pure and deterministic so ordering is
// unit-testable: 8 approved questions, weakest-objectives-first within the
// student's target modules, M1 topics before M2/M3 while M1 mastery is below
// the prerequisite threshold, ~60/40 structured/mcq blend per availability,
// biased toward blueprint-heavy topics.

export const SESSION_SIZE = 8;
export const STRUCTURED_SHARE = 0.6;

export interface CandidateQuestion {
  id: string;
  objective_ids: string[];
  module: ModuleNumber;
  kind: QuestionKind;
  /** R1.6 §1: response modes present on this question's parts. */
  response_modes?: string[];
}

// A question belongs in the auto-graded session only when every part can be
// marked from a typed final answer. "Show that" states the answer in the stem,
// so comparing against it would pass a student who wrote nothing — the exact
// false confidence this product exists to prevent. Those go to worked practice.
export function isAutoGradable(q: CandidateQuestion): boolean {
  return (q.response_modes ?? ['answer']).every((m) => m === 'answer');
}

export interface BuildSessionArgs {
  candidates: CandidateQuestion[];
  perObjectiveMastery: Map<string, number>; // absent objective = not started
  m1Mastery: number;
  targetModules: ModuleNumber[];
  // blueprint weight per topic keyed by objective prefix, e.g. 'M1.5.' -> 10
  topicWeightByPrefix: Map<string, number>;
  size?: number;
}

function objectivePrefix(objectiveId: string): string {
  return objectiveId.slice(0, objectiveId.lastIndexOf('.') + 1);
}

interface Scored extends CandidateQuestion {
  priority: number;
}

export function buildSession(args: BuildSessionArgs): CandidateQuestion[] {
  const {
    candidates,
    perObjectiveMastery,
    m1Mastery,
    targetModules,
    topicWeightByPrefix,
    size = SESSION_SIZE,
  } = args;

  const m1Gated = targetModules.includes(1) && m1Mastery <= M1_PREREQ_THRESHOLD;

  const scored: Scored[] = candidates
    .filter((c) => targetModules.includes(c.module) && isAutoGradable(c))
    .map((c) => {
      // Weakest objective drives the need; untouched objectives count as 0.
      const weakest = Math.min(...c.objective_ids.map((id) => perObjectiveMastery.get(id) ?? 0));
      const weight = Math.max(
        ...c.objective_ids.map((id) => topicWeightByPrefix.get(objectivePrefix(id)) ?? 1),
      );
      return { ...c, priority: (1 - weakest) * weight };
    })
    .sort((a, b) => {
      // Cold-start prerequisite: all M1 questions rank ahead of M2/M3.
      if (m1Gated && (a.module === 1) !== (b.module === 1)) return a.module === 1 ? -1 : 1;
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.id < b.id ? -1 : 1; // deterministic tiebreak
    });

  // Blend kinds: aim for the 60/40 structured/mcq split, degrade gracefully
  // when one pool runs dry. Objectives already picked are deprioritized so a
  // session spreads across weak objectives instead of repeating one.
  const structuredPool = scored.filter((q) => q.kind === 'structured');
  const mcqPool = scored.filter((q) => q.kind === 'mcq');
  let structuredLeft = Math.min(structuredPool.length, Math.round(size * STRUCTURED_SHARE));
  let mcqLeft = Math.min(mcqPool.length, size - structuredLeft);
  structuredLeft = Math.min(structuredPool.length, size - mcqLeft);

  const covered = new Set<string>();
  const picked: CandidateQuestion[] = [];
  const pickFrom = (pool: Scored[]): boolean => {
    const next =
      pool.find((q) => !picked.includes(q) && !q.objective_ids.some((o) => covered.has(o))) ??
      pool.find((q) => !picked.includes(q));
    if (!next) return false;
    picked.push(next);
    next.objective_ids.forEach((o) => covered.add(o));
    return true;
  };

  while (picked.length < size && (structuredLeft > 0 || mcqLeft > 0)) {
    // Keep the running ratio close to the target share.
    const structuredSoFar = picked.filter((q) => q.kind === 'structured').length;
    const wantStructured =
      structuredLeft > 0 &&
      (mcqLeft === 0 || structuredSoFar / Math.max(1, picked.length) < STRUCTURED_SHARE);
    if (wantStructured) {
      if (pickFrom(structuredPool)) structuredLeft--;
      else structuredLeft = 0;
    } else {
      if (pickFrom(mcqPool)) mcqLeft--;
      else mcqLeft = 0;
    }
  }

  return picked;
}
