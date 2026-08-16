import { M1_PREREQ_THRESHOLD } from '@/lib/mastery/config';
import type { ModuleNumber, QuestionKind } from '@/lib/types';

// Session builder (ROUND_1 §6.2). Pure and deterministic so ordering is
// unit-testable: 8 approved questions, weakest-objectives-first within the
// student's target modules, M1 topics before M2/M3 while M1 mastery is below
// the prerequisite threshold, ~60/40 structured/mcq blend per availability,
// biased toward blueprint-heavy topics.

// R1.8 §2 — a session is a budget of WORK, not a count of questions. Once a
// question is a whole 9-12 mark paper question, "8 questions" stops describing
// anything a student recognises: it was a 15-minute session in the spec and
// nearer an hour in practice. The papers price the work themselves — Paper 1
// allows 90 minutes for 60 items, Paper 2 150 minutes for 90 marks — so a
// session is now minutes at exam pace, and one or two paper-shaped questions
// fill it exactly as §2 asks.
export const SESSION_MINUTES = 15;
export const MINUTES_PER_MCQ = 90 / 60;
export const MINUTES_PER_STRUCTURED_MARK = 150 / 90;
export const STRUCTURED_SHARE = 0.6;

/** Exam-pace minutes for one question, which is what the budget spends. */
export function estimatedMinutes(q: CandidateQuestion): number {
  return q.kind === 'mcq' ? MINUTES_PER_MCQ : Math.max(1, q.marks) * MINUTES_PER_STRUCTURED_MARK;
}

export interface CandidateQuestion {
  id: string;
  objective_ids: string[];
  module: ModuleNumber;
  kind: QuestionKind;
  /** Rubric marks; an MCQ is 1. Prices the question against the budget. */
  marks: number;
  /** R1.6 §1: response modes present on this question's parts. */
  response_modes?: string[];
}

// R1.6 §1 excludes PARTS, not questions. A "show that" part states its answer
// in the stem, so marking it would pass a student who wrote nothing — but the
// other parts of the same question are ordinary marked work, and real papers
// mix them freely. Requiring every part to be markable emptied the pool: all
// seven questions in a v12 batch carried a reason part, taking 45 markable
// marks out of the session with the 18 unmarkable ones. So a question belongs
// in the session when it has anything to mark; the rest is self-marked inline.
export function hasMarkableParts(q: CandidateQuestion): boolean {
  const modes = q.response_modes ?? ['answer'];
  return modes.length === 0 || modes.some((m) => m === 'answer');
}

export interface BuildSessionArgs {
  candidates: CandidateQuestion[];
  perObjectiveMastery: Map<string, number>; // absent objective = not started
  m1Mastery: number;
  targetModules: ModuleNumber[];
  // blueprint weight per topic keyed by objective prefix, e.g. 'M1.5.' -> 10
  topicWeightByPrefix: Map<string, number>;
  /** Budget in exam-pace minutes; defaults to a 15-minute session. */
  minutes?: number;
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
    minutes = SESSION_MINUTES,
  } = args;

  const m1Gated = targetModules.includes(1) && m1Mastery <= M1_PREREQ_THRESHOLD;

  const scored: Scored[] = candidates
    .filter((c) => targetModules.includes(c.module) && hasMarkableParts(c))
    .map((c) => {
      // R1.8 §2 — how much of the student's weakness this question COVERS, not
      // how weak its weakest objective is. A paper-shaped question spanning
      // three shaky objectives is worth more of a session than a drill item on
      // one of them, and the old min() could not say so. An untouched
      // objective counts as fully weak.
      const priority = c.objective_ids.reduce((sum, id) => {
        const mastery = perObjectiveMastery.get(id) ?? 0;
        const weight = topicWeightByPrefix.get(objectivePrefix(id)) ?? 1;
        return sum + (1 - mastery) * weight;
      }, 0);
      return { ...c, priority };
    })
    .sort((a, b) => {
      // Cold-start prerequisite: all M1 questions rank ahead of M2/M3.
      if (m1Gated && (a.module === 1) !== (b.module === 1)) return a.module === 1 ? -1 : 1;
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.id < b.id ? -1 : 1; // deterministic tiebreak
    });

  // Blend kinds: aim for the 60/40 structured/mcq split of the budget, degrade
  // gracefully when one pool runs dry. Objectives already picked are
  // deprioritized so a session spreads across weak objectives instead of
  // repeating one.
  const structuredPool = scored.filter((q) => q.kind === 'structured');
  const mcqPool = scored.filter((q) => q.kind === 'mcq');

  const covered = new Set<string>();
  const picked: CandidateQuestion[] = [];
  let spent = 0;
  const pickFrom = (pool: Scored[], budget: number): boolean => {
    const affordable = pool.filter(
      (q) => !picked.includes(q) && estimatedMinutes(q) <= budget,
    );
    const next =
      affordable.find((q) => !q.objective_ids.some((o) => covered.has(o))) ?? affordable[0];
    if (!next) return false;
    picked.push(next);
    spent += estimatedMinutes(next);
    next.objective_ids.forEach((o) => covered.add(o));
    return true;
  };

  // The first question is bought whatever it costs. A 12-mark question prices
  // at 20 minutes against a 15-minute budget, and a session that returned
  // nothing rather than one good question would be the wrong answer to that.
  const first = m1Gated || structuredPool.length ? structuredPool : mcqPool;
  if (!pickFrom(first, Infinity)) pickFrom(mcqPool, Infinity);

  while (spent < minutes) {
    const remaining = minutes - spent;
    const structuredMinutes = picked
      .filter((q) => q.kind === 'structured')
      .reduce((s, q) => s + estimatedMinutes(q), 0);
    const wantStructured = structuredMinutes / Math.max(1, spent) < STRUCTURED_SHARE;
    const order = wantStructured ? [structuredPool, mcqPool] : [mcqPool, structuredPool];
    if (!pickFrom(order[0], remaining) && !pickFrom(order[1], remaining)) break;
  }

  return picked;
}
