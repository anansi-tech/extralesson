import { Attempt, Blueprint, Topic, Transcription } from '@/lib/db';
import {
  bandFor,
  masteryByObjective,
  moduleMastery,
  topicMastery,
  topicWeights,
  type AttemptScore,
} from '@/lib/mastery/fold';
import { predictModule, predictOverall, type OverallPrediction } from '@/lib/grade/predict';
import { markSplit } from '@/lib/grade/assessable';
import { methodMarksEarned } from '@/lib/grade/method-marks';
import { computeCoverage, type Coverage } from '@/lib/targets/coverage';
import type { MasteryBand } from '@/lib/mastery/config';
import type { ModuleNumber } from '@/lib/types';

// All mastery/progress state is a fold over append-only attempts (§3.5).
// This module assembles that fold for the dashboard, session builder, and
// prediction — nothing here writes.

export interface TopicState {
  code: string;
  title: string;
  module: ModuleNumber;
  order: number;
  mastery: number;
  band: MasteryBand;
}

export interface StudyState {
  perObjective: Map<string, number>;
  topics: TopicState[];
  moduleMastery: Record<ModuleNumber, number>;
  prediction: OverallPrediction;
  topicWeightByPrefix: Map<string, number>;
  attemptedObjectives: Set<string>;
  /** R1.6 §3: share of exam marks this product can assess. */
  coverage: Coverage;
}

interface LeanTopic {
  code: string;
  title: string;
  module: ModuleNumber;
  order: number;
  objectives: { id: string; text: string; assessable?: boolean; unassessable_reason?: string }[];
}

interface LeanBlueprint {
  paper: 'P1' | 'P2';
  module: number;
  allocations: { topic_codes: string[]; items?: number; marks?: number }[];
}

// question_id -> {objective_ids, marks} is joined by the caller via attempts'
// stored profile_marks; the fold input is score fraction per attempt.
export interface AttemptRow {
  objective_ids: string[];
  score: number;
  /** Assessable marks this attempt covered — the evidence it is worth (§2). */
  marks: number;
  ts: number;
}

export async function loadAttemptRows(studentId: string, before?: Date): Promise<AttemptRow[]> {
  const query: Record<string, unknown> = { student_id: studentId };
  if (before) query.ts = { $lt: before };
  const attempts = await Attempt.find(query)
    .populate('question_id', 'objective_ids marks parts rubric')
    .lean<
      {
        question_id: {
          objective_ids: string[];
          marks: number;
          parts?: { label: string; marks: number; slots?: { label: string; response_mode?: string }[] }[];
          rubric?: { slot_ref: string; mark_value: number }[];
        } | null;
        profile_marks: { CK: number; AK: number; R: number };
        ts: Date;
        _id: unknown;
      }[]
    >();

  const reads = await Transcription.find({
    attempt_id: { $in: attempts.map((a) => a._id) },
  })
    .select('attempt_id method_marks')
    .lean<{ attempt_id: unknown; method_marks?: { code: string; awarded: boolean; mark_value: number }[] }[]>();
  // Grouped by attempt, then folded ONCE PER ROW: an attempt can carry two
  // takes, and the second normally re-reads the same working as the first.
  const takesByAttempt = new Map<string, typeof reads>();
  for (const r of reads) {
    const key = String(r.attempt_id);
    const list = takesByAttempt.get(key) ?? [];
    list.push(r);
    takesByAttempt.set(key, list);
  }
  const methodByAttempt = new Map<string, number>();
  for (const [id, takes] of takesByAttempt) methodByAttempt.set(id, methodMarksEarned(takes));

  return attempts
    .filter((a) => a.question_id)
    .map((a) => {
      // Denominator counts only the marks we actually award (R1.6 §1/§4), read
      // off the rubric rows that sit on auto-marked slots. It used to be
      // approximated by slot proportion, which is a different number whenever a
      // part's marks are not spread evenly across its slots.
      const marks = markSplit(a.question_id!).auto || a.question_id!.marks || 1;
      // Method marks earned from photographed working are added here rather
      // than written back to the attempt, which is append-only. The attempt
      // records what the student was told on submitting; this records what
      // their working later showed, and mastery is the fold over both.
      const earned =
        a.profile_marks.CK +
        a.profile_marks.AK +
        a.profile_marks.R +
        (methodByAttempt.get(String(a._id)) ?? 0);
      return {
        objective_ids: a.question_id!.objective_ids,
        score: Math.min(1, earned / marks),
        marks,
        ts: new Date(a.ts).getTime(),
      };
    });
}

export function computeStudyState(
  attemptRows: AttemptRow[],
  topics: LeanTopic[],
  blueprints: LeanBlueprint[],
  targetModules: ModuleNumber[],
): StudyState {
  const perObjective = masteryByObjective(attemptRows as AttemptScore[]);

  const topicStates: TopicState[] = topics
    .sort((a, b) => a.module - b.module || a.order - b.order)
    .map((t) => {
      const ids = t.objectives.map((o) => o.id);
      const touched = ids.some((id) => perObjective.has(id));
      const mastery = topicMastery(ids, perObjective);
      return {
        code: t.code,
        title: t.title,
        module: t.module,
        order: t.order,
        mastery,
        band: touched ? bandFor(mastery) : 'NOT_STARTED',
      };
    });

  const modMastery = {} as Record<ModuleNumber, number>;
  const weightByPrefix = new Map<string, number>();
  for (const m of [1, 2, 3] as const) {
    const weights = topicWeights(blueprints, m);
    modMastery[m] = moduleMastery(
      topicStates.filter((t) => t.module === m).map((t) => ({ code: t.code, mastery: t.mastery })),
      weights,
    );
    for (const t of topics.filter((t) => t.module === m)) {
      weightByPrefix.set(`M${t.module}.${t.order}.`, weights.get(t.code) ?? 1);
    }
  }

  // Predict from the marks we can actually assess, not the whole paper (§4).
  const coverage = computeCoverage(topics, blueprints);
  const prediction = predictOverall(
    targetModules.map((m) => predictModule(m, modMastery[m], coverage.byModule[m])),
    attemptRows.reduce((sum, a) => sum + a.marks, 0),
  );

  return {
    perObjective,
    topics: topicStates,
    moduleMastery: modMastery,
    prediction,
    topicWeightByPrefix: weightByPrefix,
    attemptedObjectives: new Set(perObjective.keys()),
    coverage,
  };
}

export async function loadStudyState(
  studentId: string,
  targetModules: ModuleNumber[],
  before?: Date,
): Promise<StudyState> {
  const [attemptRows, topics, blueprints] = await Promise.all([
    loadAttemptRows(studentId, before),
    Topic.find().lean<LeanTopic[]>(),
    Blueprint.find().lean<LeanBlueprint[]>(),
  ]);
  return computeStudyState(attemptRows, topics, blueprints, targetModules);
}
