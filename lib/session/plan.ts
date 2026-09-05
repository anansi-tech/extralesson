import { Attempt, Question } from '@/lib/db';
import { buildSession, RECENT_DAYS, type CandidateQuestion, type SessionMode } from './builder';
import { loadStudyState } from '@/lib/study/state';
import { loadMistakes } from '@/lib/study/mistakes';
import { earnableByMethod } from '@/lib/grade/method-marks';
import type { RubricItem } from '@/lib/types';
import type { ModuleNumber } from '@/lib/types';

/**
 * Choosing the questions for a session, in ONE place: starting a session and
 * previewing one have to agree. buildSession is pure and deterministic, so
 * previewing is running it rather than predicting it.
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

  const [state, raw, mistakes, recent] = await Promise.all([
    loadStudyState(studentId, targetModules),
    Question.find({ status: 'approved' })
      .select(mode === 'first' ? 'objective_ids module kind marks parts rubric' : 'objective_ids module kind marks parts')
      .lean<
        {
          _id: unknown;
          objective_ids: string[];
          module: ModuleNumber;
          kind: 'mcq' | 'structured';
          marks: number;
          parts?: { label: string; slots?: { label: string; response_mode?: string }[] }[];
          rubric?: RubricItem[];
        }[]
      >(),
    mode === 'revisit' ? loadMistakes(studentId, now) : null,
    Attempt.find({ student_id: studentId, ts: { $gte: new Date((now ?? new Date()).getTime() - RECENT_DAYS * 86_400_000) } })
      .select('question_id')
      .lean<{ question_id: unknown }[]>(),
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
      method_rows: c.rubric ? earnableByMethod(c, []).length : undefined,
      part_count: c.parts?.length,
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
    recentIds: new Set(recent.map((a) => String(a.question_id))),
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
