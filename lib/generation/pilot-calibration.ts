import { z } from 'zod';
import { BlindPilotEvaluationZ } from '@/lib/generation/pilot-evaluation';

const EvaluatedQuestionZ = z.object({
  question_id: z.string().min(1),
  topic_code: z.string().min(1),
  blind_evaluation: BlindPilotEvaluationZ,
  comparison: z.object({
    intended_control_matches: z.object({
      difficulty: z.boolean(),
      profile: z.boolean(),
    }).passthrough(),
  }).passthrough(),
}).passthrough();

export const PilotEvaluationForCalibrationZ = z.object({
  evaluator: z.object({
    model: z.string().min(1),
    usage: z.object({
      input_tokens: z.number().int().nonnegative(),
      cached_input_tokens: z.number().int().nonnegative(),
      output_tokens: z.number().int().nonnegative(),
      reasoning_tokens: z.number().int().nonnegative(),
    }),
  }).passthrough(),
  summary: z.object({
    pilot_gate: z.enum(['pass', 'fail']),
    gate_failures: z.array(z.string()),
  }).passthrough(),
  questions: z.array(EvaluatedQuestionZ).min(1),
}).passthrough();

export type PilotEvaluationForCalibration = z.infer<typeof PilotEvaluationForCalibrationZ>;

function shareBps(matches: number, total: number) {
  return Math.round(matches * 10_000 / total);
}

function sameStringSet(left: string[], right: string[]) {
  return [...left].sort().join('\u0000') === [...right].sort().join('\u0000');
}

export function calibratePilotEvaluators(
  primary: PilotEvaluationForCalibration,
  comparator: PilotEvaluationForCalibration,
) {
  const comparatorById = new Map(comparator.questions.map((row) => [row.question_id, row]));
  if (
    primary.questions.length !== comparator.questions.length ||
    primary.questions.some((row) => !comparatorById.has(row.question_id))
  ) {
    throw new Error('Evaluator artifacts do not contain the same question ids');
  }

  const items = primary.questions.map((left) => {
    const right = comparatorById.get(left.question_id)!;
    const a = left.blind_evaluation;
    const b = right.blind_evaluation;
    return {
      question_id: left.question_id,
      topic_code: left.topic_code,
      primary: {
        difficulty: a.difficulty,
        archetype: a.archetype,
        profile: a.profile,
        readiness: a.readiness,
        concerns: a.concerns,
      },
      comparator: {
        difficulty: b.difficulty,
        archetype: b.archetype,
        profile: b.profile,
        readiness: b.readiness,
        concerns: b.concerns,
      },
      agreement: {
        difficulty: a.difficulty === b.difficulty,
        archetype: a.archetype === b.archetype,
        profile: a.profile === b.profile,
        readiness: a.readiness === b.readiness,
        concerns: sameStringSet(a.concerns, b.concerns),
        core_classification:
          a.difficulty === b.difficulty && a.archetype === b.archetype && a.profile === b.profile,
      },
    };
  });

  const agreement = {
    difficulty_bps: shareBps(items.filter((row) => row.agreement.difficulty).length, items.length),
    archetype_bps: shareBps(items.filter((row) => row.agreement.archetype).length, items.length),
    profile_bps: shareBps(items.filter((row) => row.agreement.profile).length, items.length),
    readiness_bps: shareBps(items.filter((row) => row.agreement.readiness).length, items.length),
    concerns_bps: shareBps(items.filter((row) => row.agreement.concerns).length, items.length),
    core_classification_bps: shareBps(
      items.filter((row) => row.agreement.core_classification).length,
      items.length,
    ),
  };
  const lunaFirstPassApproved =
    agreement.difficulty_bps >= 8_000 &&
    agreement.archetype_bps >= 8_000 &&
    agreement.profile_bps >= 8_000 &&
    agreement.readiness_bps === 10_000 &&
    agreement.concerns_bps === 10_000;
  const readinessDisagreement = items.some((row) => !row.agreement.readiness);
  const concernDisagreement = items.some((row) => !row.agreement.concerns);

  return {
    primary_model: primary.evaluator.model,
    comparator_model: comparator.evaluator.model,
    question_count: items.length,
    agreement,
    same_pilot_gate: primary.summary.pilot_gate === comparator.summary.pilot_gate,
    same_gate_failures: sameStringSet(primary.summary.gate_failures, comparator.summary.gate_failures),
    routing: {
      decision: lunaFirstPassApproved
        ? 'primary-first-pass-with-comparator-escalation' as const
        : 'comparator-required' as const,
      primary_first_pass_approved: lunaFirstPassApproved,
      comparator_escalation_conditions: [
        'primary-readiness-not-pass',
        'primary-concern-present',
        'primary-intended-difficulty-mismatch',
        'primary-intended-archetype-mismatch',
        'primary-intended-profile-mismatch',
      ],
      frontier_adjudication_needed: readinessDisagreement || concernDisagreement,
      frontier_adjudication_conditions: [
        'primary-comparator-readiness-disagreement',
        'primary-comparator-concern-disagreement',
      ],
    },
    items,
  };
}
