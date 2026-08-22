import { Question } from '@/lib/db';
import { buildSession, type CandidateQuestion, type SessionMode } from './builder';
import { loadStudyState } from '@/lib/study/state';
import { loadMistakes } from '@/lib/study/mistakes';
import type { ModuleNumber } from '@/lib/types';

/**
 * Choosing the questions for a session, in ONE place.
 *
 * Starting a session and previewing one have to agree, or the diagnostic's
 * closing promise — "your next session starts here" — is a guess about code
 * somewhere else. buildSession is pure and deterministic, so the same inputs
 * give the same questions: previewing is running it, not predicting it.
 */
export interface PlanArgs {
  studentId: string;
  targetModules: ModuleNumber[];
  mode: SessionMode;
  /** 'topic' only: the objective prefixes the student asked for. */
  focusPrefixes?: string[];
  /** Freezes the clock for the revisit delay; defaults to now. */
  now?: Date;
}

export async function planSession(args: PlanArgs): Promise<CandidateQuestion[]> {
  const { studentId, targetModules, mode, focusPrefixes, now } = args;

  const [state, raw, mistakes] = await Promise.all([
    loadStudyState(studentId, targetModules),
    Question.find({ status: 'approved' })
      .select('objective_ids module kind marks parts')
      .lean<
        {
          _id: unknown;
          objective_ids: string[];
          module: ModuleNumber;
          kind: 'mcq' | 'structured';
          marks: number;
          parts?: { slots?: { response_mode?: string }[] }[];
        }[]
      >(),
    mode === 'revisit' ? loadMistakes(studentId, now) : null,
  ]);

  return buildSession({
    candidates: raw.map((c) => ({
      id: String(c._id),
      objective_ids: c.objective_ids,
      module: c.module,
      kind: c.kind,
      marks: c.marks,
      response_modes: (c.parts ?? []).flatMap((p) =>
        (p.slots ?? []).map((slot) => slot.response_mode ?? 'answer'),
      ),
    })),
    perObjectiveMastery: state.perObjective,
    attemptedObjectives: state.attemptedObjectives,
    m1Mastery: state.moduleMastery[1],
    targetModules,
    topicWeightByPrefix: state.topicWeightByPrefix,
    mode,
    focusPrefixes,
    lostByObjective: mistakes?.lostByObjective,
    attemptedIds: mistakes?.attemptedIds,
  });
}

/** The objective prefixes a set of questions covers, which is its topics. */
export function topicPrefixesOf(questions: CandidateQuestion[]): string[] {
  return [
    ...new Set(
      questions.flatMap((q) => q.objective_ids.map((o) => o.slice(0, o.lastIndexOf('.') + 1))),
    ),
  ];
}
