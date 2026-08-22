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

/**
 * HOW THE QUESTIONS GET CHOSEN.
 *
 * 'adaptive' is the default and stays the default: a mark budget at exam pace,
 * weakest objectives first, M1 before M2/M3 until the prerequisite is met. The
 * others exist because that one cannot answer a student who knows something
 * about their own week — the class did circle theorems today, or they want the
 * questions they got wrong rather than the ones they have never seen.
 */
export type SessionMode = 'adaptive' | 'topic' | 'revisit' | 'diagnostic';

/**
 * A diagnostic is worth a session and not a lesson. Twelve minutes buys about
 * eight items, which is enough to RANK topics — to find the ones already
 * solid, so weakest-first stops sending a student there — and nowhere near
 * enough to estimate a grade, which is why it does not try to.
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
  /**
   * Objectives the student has actually been asked about.
   *
   * Mastery cannot carry this: an objective never seen and an objective
   * answered wrong both read 0, so the deficit is identical and a topic the
   * student has never opened competes on level terms with one they are part way
   * through. Weight then decides, and the heavier topic keeps winning.
   */
  attemptedObjectives?: Set<string>;
  m1Mastery: number;
  targetModules: ModuleNumber[];
  // blueprint weight per topic keyed by objective prefix, e.g. 'M1.5.' -> 10
  topicWeightByPrefix: Map<string, number>;
  /** Budget in exam-pace minutes; defaults to the mode's own length. */
  minutes?: number;
  /** Defaults to 'adaptive', which is what every session was before modes. */
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
 * WHETHER MODULE 1 IS STILL HOLDING THE LATER MODULES BACK.
 *
 * Exported because the landing page has to say the same thing the builder does.
 * It showed a student their highest-leverage topic, +6.9 points in Geometry and
 * Trigonometry 1, while this gate meant no session would ever take them there —
 * the plan and the sessions told different stories and nothing explained the
 * difference. Two copies of the condition would drift the first time the
 * threshold moved, so there is one.
 *
 * The gate is on the ADAPTIVE mode only: a student who names a topic has
 * overruled the default deliberately, and topic mode reaches it.
 */
export function m1GateHolds(targetModules: ModuleNumber[], m1Mastery: number): boolean {
  return targetModules.includes(1) && m1Mastery <= M1_PREREQ_THRESHOLD;
}

export interface NeedArgs {
  perObjectiveMastery: Map<string, number>;
  topicWeightByPrefix: Map<string, number>;
  attemptedObjectives?: Set<string>;
  m1Gated?: boolean;
}

/**
 * WHAT THE STUDENT NEEDS MOST, IN ORDER.
 *
 * Module 1 first while it gates, then topics never opened, then the weight of
 * the topic times how much of it is still missing. Exported because worked
 * practice picks from a different pool and must pick the same way: two copies
 * of "weakest first" would answer differently within a week, and a student
 * would be sent to one topic by their session and another by the practice page
 * with nothing to explain the difference.
 */
export function rankByNeed<T extends CandidateQuestion>(candidates: T[], args: NeedArgs): T[] {
  const { perObjectiveMastery, topicWeightByPrefix, attemptedObjectives, m1Gated = false } = args;
  const started = new Set([...(attemptedObjectives ?? [])].map(objectivePrefix));
  return candidates
    .map((c) => ({
      c,
      priority: c.objective_ids.reduce((sum, id) => {
        const mastery = perObjectiveMastery.get(id) ?? 0;
        return sum + (1 - mastery) * (topicWeightByPrefix.get(objectivePrefix(id)) ?? 1);
      }, 0),
      unstarted: c.objective_ids.some((id) => !started.has(objectivePrefix(id))),
    }))
    .sort((a, b) => {
      if (m1Gated && (a.c.module === 1) !== (b.c.module === 1)) return a.c.module === 1 ? -1 : 1;
      if (a.unstarted !== b.unstarted) return a.unstarted ? -1 : 1;
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.c.id < b.c.id ? -1 : 1;
    })
    .map((x) => x.c);
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

  // The prerequisite gate belongs to the mode that chose for the student. When
  // they name a topic themselves, or ask for their own mistakes, holding M3
  // back would be overruling the request they just made.
  const m1Gated = mode === 'adaptive' && m1GateHolds(targetModules, m1Mastery);

  // The topics the student has opened at all, by objective prefix.
  const startedPrefixes = new Set(
    [...(attemptedObjectives ?? [])].map(objectivePrefix),
  );

  const eligible = (c: CandidateQuestion): boolean => {
    if (!hasMarkableParts(c)) return false;
    if (mode === 'topic') {
      return (focusPrefixes ?? []).some((prefix) =>
        c.objective_ids.some((id) => id.startsWith(prefix)),
      );
    }
    if (!targetModules.includes(c.module)) return false;
    if (mode === 'revisit') {
      // A NEW question on the objective that was missed, never the same
      // question again: re-showing it tests whether the answer was remembered,
      // which is not what was got wrong.
      if (attemptedIds?.has(c.id)) return false;
      return c.objective_ids.some((id) => (lostByObjective?.get(id) ?? 0) > 0);
    }
    return true;
  };

  const scored: Scored[] = candidates
    .filter(eligible)
    .map((c) => {
      // R1.8 §2 — how much of the student's weakness this question COVERS, not
      // how weak its weakest objective is. A paper-shaped question spanning
      // three shaky objectives is worth more of a session than a drill item on
      // one of them, and the old min() could not say so. An untouched
      // objective counts as fully weak.
      const priority =
        mode === 'revisit'
          ? // How much this question would put back: the marks actually lost on
            // the objectives it covers.
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
      // Cold-start prerequisite: all M1 questions rank ahead of M2/M3.
      if (m1Gated && (a.module === 1) !== (b.module === 1)) return a.module === 1 ? -1 : 1;
      // COVER BEFORE DEEPEN. A topic the student has never been asked about
      // outranks one they are part way through, whatever the blueprint weight
      // says. Weight times deficit alone let a heavy topic at 15% (0.85 x 10)
      // beat an untouched lighter one (1.0 x 7.5), so after sixteen sessions
      // three M1 topics had still never been seen and the session kept
      // returning to the same two. The generation recipe settled this rule
      // already — coverage outranks the marks deficit there too.
      if (a.topicUnstarted !== b.topicUnstarted) return a.topicUnstarted ? -1 : 1;
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.id < b.id ? -1 : 1; // deterministic tiebreak
    });

  // Blend kinds: aim for the 60/40 structured/mcq split of the budget, degrade
  // gracefully when one pool runs dry. Objectives already picked are
  // deprioritized so a session spreads across weak objectives instead of
  // repeating one.
  const structuredPool = scored.filter((q) => q.kind === 'structured');
  const mcqPool = scored.filter((q) => q.kind === 'mcq');

  // What a session spreads ACROSS. Normally objectives, so one session does not
  // drill the same one twice. A diagnostic spreads across TOPICS instead: its
  // whole job is to rank them, and eight questions inside two topics rank two.
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

  // The first question is bought whatever it costs. A 12-mark question prices
  // at 20 minutes against a 15-minute budget, and a session that returned
  // nothing rather than one good question would be the wrong answer to that.
  // A diagnostic buys the cheapest items it can: an MCQ costs a minute and a
  // half and reports on one more topic, where a 12-mark question spends the
  // whole budget reporting on one.
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
