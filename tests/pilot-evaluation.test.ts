import { describe, expect, it } from 'vitest';
import targetsJson from '@/design/research/question-bank-targets.json';
import { QuestionBankTargetsArtifactZ } from '@/lib/generation/question-bank-targets';
import {
  compareBlindEvaluation,
  expectedProfile,
  expectedProfiles,
  summarizePilotComparisons,
} from '@/lib/generation/pilot-evaluation';
import {
  buildCorpusInformedQuestionRecipe,
  buildDefaultQuestionRecipe,
} from '@/lib/generation/question-recipe';

const targets = QuestionBankTargetsArtifactZ.parse(targetsJson);

describe('blind pilot comparison', () => {
  it('uses the dominant structured demand, breaking a difficulty-2 tie toward AK', () => {
    const d2 = buildDefaultQuestionRecipe({
      objectiveIds: ['M1.4.1'], kind: 'structured', difficulty: 2,
    });
    const d3 = buildDefaultQuestionRecipe({
      objectiveIds: ['M1.4.1'], kind: 'structured', difficulty: 3,
    });
    expect(expectedProfile(d2)).toBe('AK');
    expect(expectedProfiles(d2)).toEqual(['AK', 'R']);
    expect(expectedProfile(d3)).toBe('R');
    expect(expectedProfiles(d3)).toEqual(['R', 'AK']);
  });

  it('accepts either co-dominant profile for a mixed structured item', () => {
    const recipe = buildDefaultQuestionRecipe({
      objectiveIds: ['M1.4.1'], kind: 'structured', difficulty: 2,
    });
    const evaluation = {
      question_id: 'mixed-profile', difficulty: recipe.difficulty,
      archetype: recipe.archetype, profile: 'R' as const,
      part_count: recipe.part_count, context_category: recipe.context_category,
      visual_type: recipe.visual_type, exam_fidelity: 5, clarity: 5,
      visual_legibility: null, visual_necessity: null, readiness: 'pass' as const,
      concerns: [],
    };
    const comparison = compareBlindEvaluation({
      targets, topicCode: 'M1-MEAS', kind: 'structured', recipe, evaluation,
    });
    expect(comparison.acceptable_profiles).toEqual(['AK', 'R']);
    expect(comparison.intended_control_matches.profile).toBe(true);
  });
  it('compares a blind judgment to hidden controls and real-paper distributions', () => {
    const recipe = buildCorpusInformedQuestionRecipe({
      targets,
      topicCode: 'M2-GEO1',
      objectiveIds: ['M2.4.1'],
      kind: 'mcq',
      difficulty: 2,
      ordinal: 0,
      presentation: 'visual',
    });
    const comparison = compareBlindEvaluation({
      targets,
      topicCode: 'M2-GEO1',
      kind: 'mcq',
      recipe,
      evaluation: {
        question_id: 'pilot-1',
        difficulty: recipe.difficulty,
        archetype: recipe.archetype,
        profile: 'AK',
        part_count: recipe.part_count,
        context_category: recipe.context_category,
        visual_type: recipe.visual_type,
        exam_fidelity: 4,
        clarity: 4,
        visual_legibility: 2,
        visual_necessity: 5,
        readiness: 'review',
        concerns: ['visual-scale-risk'],
      },
    });

    expect(comparison.exact_intended_control_match).toBe(true);
    expect(comparison.source_question_count).toBeGreaterThan(0);
    expect(comparison.prevalence_bps.difficulty).toBeGreaterThan(0);
    expect(comparison.nearest_representative_pattern.similarity_bps).toBeGreaterThan(0);
  });

  it('fails a polished pilot when difficulty, profile, or visual alignment is weak', () => {
    const recipe = buildCorpusInformedQuestionRecipe({
      targets,
      topicCode: 'M2-GEO1',
      objectiveIds: ['M2.4.1'],
      kind: 'mcq',
      difficulty: 2,
      ordinal: 0,
      presentation: 'visual',
    });
    const blind_evaluation = {
      question_id: 'pilot-2', difficulty: 1 as const, archetype: 'concept-recognition' as const,
      profile: 'CK' as const, part_count: 1, context_category: 'none' as const,
      visual_type: recipe.visual_type, exam_fidelity: 5, clarity: 5,
      visual_legibility: 2, visual_necessity: 4, readiness: 'pass' as const,
      concerns: ['visual-scale-risk' as const],
    };
    const comparison = compareBlindEvaluation({
      targets, topicCode: 'M2-GEO1', kind: 'mcq', recipe, evaluation: blind_evaluation,
    });
    const summary = summarizePilotComparisons([{ blind_evaluation, comparison }]);

    expect(summary.pilot_gate).toBe('fail');
    expect(summary.gate_failures).toContain('difficulty-alignment-below-threshold');
    expect(summary.gate_failures).toContain('profile-alignment-below-threshold');
    expect(summary.gate_failures).toContain('visual-legibility-below-threshold');
  });
});
