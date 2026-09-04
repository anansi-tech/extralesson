import { M1_PREREQ_THRESHOLD } from '@/lib/mastery/config';
import type { ModuleNumber, QuestionKind } from '@/lib/types';

// Session builder — see ROUND_1 §6.2. Pure and deterministic so ordering is
// unit-testable.

// A session is a budget of WORK at exam pace, not a count of questions, because
// the papers price the work themselves — see ROUND_1_8 §2.
export const SESSION_MINUTES = 15;

/**
 * 'adaptive' is the default. The others exist because it cannot answer a
 * student who knows something about their own week — today's class topic, or
 * the questions they got wrong rather than ones they have never seen.
 */
export type SessionMode = 'adaptive' | 'topic' | 'revisit' | 'diagnostic' | 'first';

/**
 * Twelve minutes buys about eight items: enough to RANK topics so weakest-first
 * stops sending a student to solid ones, nowhere near enough to estimate a
 * grade, which is why it does not try to.
 */
export const DIAGNOSTIC_MINUTES = 12;
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
  /** Response modes present on this question's parts — see ROUND_1_6 §1. */
  response_modes?: string[];
  /** Rubric rows a photograph of the working could earn; 'first' needs one. */
  method_rows?: number;
  /** Lettered parts; 'first' takes a short question. */
  part_count?: number;
}

/** The first question is short: five marks or fewer, two parts or fewer. */
export const FIRST_MAX_MARKS = 5;
export const FIRST_MAX_PARTS = 2;

// A question belongs in the session when it has anything to mark; self-marked
// parts are revealed inline. See ROUND_1_6 §1.
export function hasMarkableParts(q: CandidateQuestion): boolean {
  const modes = q.response_modes ?? ['answer'];
  return modes.length === 0 || modes.some((m) => m === 'answer');
}

export interface BuildSessionArgs {
  candidates: CandidateQuestion[];
  perObjectiveMastery: Map<string, number>; // absent objective = not started
  /**
   * Objectives the student has actually been asked about. Mastery cannot carry
   * this: never-seen and answered-wrong both read 0, so weight alone decides
   * and the heavier topic keeps winning.
   */
  attemptedObjectives?: Set<string>;
  m1Mastery: number;
  targetModules: ModuleNumber[];
  // blueprint weight per topic keyed by objective prefix, e.g. 'M1.5.' -> 10
  topicWeightByPrefix: Map<string, number>;
  /** Budget in exam-pace minutes; defaults to the mode's own length. */
  minutes?: number;
  mode?: SessionMode;
  /** 'topic': the objective prefixes the student asked for, e.g. 'M1.5.'. */
  focusPrefixes?: string[];
  /** 'revisit': marks lost per objective, already filtered by the delay. */
  lostByObjective?: Map<string, number>;
  /** 'revisit': questions already attempted, which are not re-shown. */
  attemptedIds?: Set<string>;
}

function objectivePrefix(objectiveId: string): string {
  return objectiveId.slice(0, objectiveId.lastIndexOf('.') + 1);
}

interface Scored extends CandidateQuestion {
  priority: number;
  /** No objective in this question's topic has ever been asked. */
  topicUnstarted: boolean;
}

/**
 * Exported so the landing page states the same gate the builder applies; two
 * copies would drift the first time the threshold moved. ADAPTIVE mode only —
 * a student who names a topic has overruled the default deliberately.
 */
export function m1GateHolds(targetModules: ModuleNumber[], m1Mastery: number): boolean {
  return targetModules.includes(1) && m1Mastery <= M1_PREREQ_THRESHOLD;
}

export function buildSession(args: BuildSessionArgs): CandidateQuestion[] {
  const {
    candidates,
    perObjectiveMastery,
    m1Mastery,
    targetModules,
    topicWeightByPrefix,
    mode = 'adaptive',
    focusPrefixes,
    lostByObjective,
    attemptedIds,
    attemptedObjectives,
    minutes = mode === 'diagnostic' ? DIAGNOSTIC_MINUTES : SESSION_MINUTES,
  } = args;

  // The gate belongs to the mode that chose for the student: holding M3 back
  // would overrule a student who named a topic or asked for their own mistakes.
  const m1Gated = (mode === 'adaptive' || mode === 'first') && m1GateHolds(targetModules, m1Mastery);

  const startedPrefixes = new Set(
    [...(attemptedObjectives ?? [])].map(objectivePrefix),
  );

  const eligible = (c: CandidateQuestion): boolean => {
    if (!hasMarkableParts(c)) return false;
    // The first question shows the examiner: structured, photographed, with
    // method marks to earn (ROUND_4 Task 2). Ranked as adaptive would rank it.
    if (mode === 'first') {
      if (c.kind !== 'structured' || !(c.method_rows ?? 0)) return false;
      if (c.marks > FIRST_MAX_MARKS || (c.part_count ?? 1) > FIRST_MAX_PARTS) return false;
    }
    if (mode === 'topic') {
      return (focusPrefixes ?? []).some((prefix) =>
        c.objective_ids.some((id) => id.startsWith(prefix)),
      );
    }
    if (!targetModules.includes(c.module)) return false;
    if (mode === 'revisit') {
      // A NEW question on the missed objective: re-showing the same one tests
      // whether the answer was remembered, not what was got wrong.
      if (attemptedIds?.has(c.id)) return false;
      return c.objective_ids.some((id) => (lostByObjective?.get(id) ?? 0) > 0);
    }
    return true;
  };

  const scored: Scored[] = candidates
    .filter(eligible)
    .map((c) => {
      // How much of the student's weakness this question COVERS, not how weak
      // its weakest objective is: a question spanning three shaky objectives is
      // worth more of a session than a drill item. See ROUND_1_8 §2.
      const priority =
        mode === 'revisit'
          ?
            c.objective_ids.reduce((sum, id) => sum + (lostByObjective?.get(id) ?? 0), 0)
          : c.objective_ids.reduce((sum, id) => {
              const mastery = perObjectiveMastery.get(id) ?? 0;
              // A diagnostic is ranking topics it knows nothing about, so
              // weighting by an unmeasured mastery would rank noise. Blueprint
              // weight alone puts the heavily examined topics first.
              const weight = topicWeightByPrefix.get(objectivePrefix(id)) ?? 1;
              return sum + (mode === 'diagnostic' ? weight : (1 - mastery) * weight);
            }, 0);
      const topicUnstarted = c.objective_ids.some(
        (id) => !startedPrefixes.has(objectivePrefix(id)),
      );
      return { ...c, priority, topicUnstarted };
    })
    .sort((a, b) => {
      if (m1Gated && (a.module === 1) !== (b.module === 1)) return a.module === 1 ? -1 : 1;
      // COVER BEFORE DEEPEN. A topic never asked about outranks one part way
      // through, whatever the blueprint weight: weight times deficit alone left
      // three M1 topics unseen after sixteen sessions.
      if (a.topicUnstarted !== b.topicUnstarted) return a.topicUnstarted ? -1 : 1;
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.id < b.id ? -1 : 1;
    });

  if (mode === 'first') return scored.slice(0, 1);

  // Degrade gracefully when one pool runs dry, and deprioritize objectives
  // already picked so a session spreads instead of repeating one.
  const structuredPool = scored.filter((q) => q.kind === 'structured');
  const mcqPool = scored.filter((q) => q.kind === 'mcq');

  // A diagnostic spreads across TOPICS, not objectives: its job is to rank
  // them, and eight questions inside two topics rank two.
  const spreadKeys = (q: CandidateQuestion): string[] =>
    mode === 'diagnostic' ? q.objective_ids.map(objectivePrefix) : q.objective_ids;

  const covered = new Set<string>();
  const picked: CandidateQuestion[] = [];
  let spent = 0;
  const pickFrom = (pool: Scored[], budget: number): boolean => {
    const affordable = pool.filter(
      (q) => !picked.includes(q) && estimatedMinutes(q) <= budget,
    );
    const next =
      affordable.find((q) => !spreadKeys(q).some((o) => covered.has(o))) ?? affordable[0];
    if (!next) return false;
    picked.push(next);
    spent += estimatedMinutes(next);
    spreadKeys(next).forEach((o) => covered.add(o));
    return true;
  };

  // The first question is bought whatever it costs: a session returning nothing
  // rather than one over-budget question would be the wrong answer. A diagnostic
  // buys the cheapest items, since an MCQ reports on one more topic.
  const structuredShare = mode === 'diagnostic' ? 0 : STRUCTURED_SHARE;
  const first =
    mode === 'diagnostic' && mcqPool.length
      ? mcqPool
      : m1Gated || structuredPool.length
        ? structuredPool
        : mcqPool;
  if (!pickFrom(first, Infinity)) pickFrom(mcqPool, Infinity);

  while (spent < minutes) {
    const remaining = minutes - spent;
    const structuredMinutes = picked
      .filter((q) => q.kind === 'structured')
      .reduce((s, q) => s + estimatedMinutes(q), 0);
    const wantStructured = structuredMinutes / Math.max(1, spent) < structuredShare;
    const order = wantStructured ? [structuredPool, mcqPool] : [mcqPool, structuredPool];
    if (!pickFrom(order[0], remaining) && !pickFrom(order[1], remaining)) break;
  }

  return picked;
}
