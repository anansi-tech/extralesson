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
import { attemptOutcome, type OutcomeQuestion, type OutcomeRead, type OutcomeRow } from './outcome';
import { computeCoverage, type Coverage } from '@/lib/targets/coverage';
import type { MasteryBand } from '@/lib/mastery/config';
import type { ModuleNumber } from '@/lib/types';

// All mastery/progress state is a fold over append-only attempts (ROUND_1
// §3.5); nothing here writes.

export interface TopicState {
  code: string;
  title: string;
  module: ModuleNumber;
  order: number;
  /** Over the objectives seen; 0 when none has been, which `band` says. */
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

export interface AttemptRow {
  /** ONE objective per row (ROUND_6 Task 6): the slot's own, so (a) right and (b) wrong move apart. */
  objective_ids: string[];
  /** Earned over assessed on the rows whose slot carries this objective — the one fold. */
  score: number;
  /** Marks assessed for this objective on this attempt — the evidence it is worth (§2). */
  marks: number;
  ts: number;
}

export async function loadAttemptRows(studentId: string, before?: Date): Promise<AttemptRow[]> {
  const query: Record<string, unknown> = { student_id: studentId };
  if (before) query.ts = { $lt: before };
  const attempts = await Attempt.find(query)
    .populate('question_id', 'objective_ids marks profile parts rubric')
    .lean<
      {
        question_id: (OutcomeQuestion & { objective_ids: string[]; parts?: { label: string; slots?: { label: string; response_mode?: string; objective_id?: string }[] }[] }) | null;
        rubric_awarded: string[];
        rubric?: OutcomeRow[];
        correct: boolean;
        ts: Date;
        _id: unknown;
      }[]
    >();

  const reads = await Transcription.find({
    attempt_id: { $in: attempts.map((a) => a._id) },
  })
    .select('attempt_id legible marker_version method_marks')
    .lean<(OutcomeRead & { attempt_id: unknown })[]>();
  const takesByAttempt = new Map<string, OutcomeRead[]>();
  for (const r of reads) takesByAttempt.set(String(r.attempt_id), [...(takesByAttempt.get(String(r.attempt_id)) ?? []), r]);

  const rows: AttemptRow[] = [];
  for (const a of attempts) {
    if (!a.question_id) continue;
    const outcome = attemptOutcome(a, a.question_id, takesByAttempt.get(String(a._id)) ?? []);
    for (const [objective, marks] of attributeBySlot(outcome, a.question_id)) {
      // An objective with nothing assessed is no evidence either way.
      if (marks.assessed === 0) continue;
      rows.push({ objective_ids: [objective], score: marks.earned / marks.assessed, marks: marks.assessed, ts: new Date(a.ts).getTime() });
    }
  }
  return rows;
}

/**
 * PER SLOT, NOT PER QUESTION (ROUND_6 Task 6): each assessed row counts toward
 * the objective its slot names, so a question with (a) right and (b) wrong
 * moves those two objectives in opposite directions. A row whose slot names
 * no objective falls back to the question's first, which is what every row
 * did before.
 */
export function attributeBySlot(
  outcome: { rows: { slot_ref: string; mark_value: number; state: string }[] },
  question: { objective_ids: string[]; parts?: { label: string; slots?: { label: string; objective_id?: string }[] }[] },
): Map<string, { earned: number; assessed: number }> {
  const objectiveOf = new Map<string, string>();
  for (const p of question.parts ?? []) {
    for (const s of p.slots ?? []) if (s.objective_id) objectiveOf.set(`${p.label}.${s.label}`, s.objective_id);
  }
  const out = new Map<string, { earned: number; assessed: number }>();
  for (const r of outcome.rows) {
    if (r.state === 'unassessed') continue;
    const objective = objectiveOf.get(r.slot_ref) ?? question.objective_ids[0];
    if (!objective) continue;
    const m = out.get(objective) ?? { earned: 0, assessed: 0 };
    m.assessed += r.mark_value;
    if (r.state === 'awarded') m.earned += r.mark_value;
    out.set(objective, m);
  }
  return out;
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
      const mastery = topicMastery(t.objectives.map((o) => o.id), perObjective);
      return {
        code: t.code,
        title: t.title,
        module: t.module,
        order: t.order,
        mastery: mastery ?? 0,
        band: bandFor(mastery),
      };
    });

  const modMastery = {} as Record<ModuleNumber, number>;
  const weightByPrefix = new Map<string, number>();
  for (const m of [1, 2, 3] as const) {
    const weights = topicWeights(blueprints, m);
    modMastery[m] = moduleMastery(
      topicStates.filter((t) => t.module === m).map((t) => ({ code: t.code, mastery: t.band === 'NOT_STARTED' ? null : t.mastery })),
      weights,
    );
    for (const t of topics.filter((t) => t.module === m)) {
      weightByPrefix.set(`M${t.module}.${t.order}.`, weights.get(t.code) ?? 1);
    }
  }

  // Predict from the marks we can actually assess (§4), counted per module:
  // an objective id is M<module>.<topic>.<n>. Coverage is reported on its own
  // page and changes nothing here.
  const coverage = computeCoverage(topics, blueprints);
  const marksSeen: Partial<Record<ModuleNumber, number>> = {};
  for (const a of attemptRows) {
    const m = Number(a.objective_ids[0]?.match(/^M([123])\./)?.[1]) as ModuleNumber;
    if (m) marksSeen[m] = (marksSeen[m] ?? 0) + a.marks;
  }
  const prediction = predictOverall(
    targetModules.map((m) => predictModule(m, modMastery[m])),
    marksSeen,
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
