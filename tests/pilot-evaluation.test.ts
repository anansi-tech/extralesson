import { describe, expect, it } from 'vitest';
import targetsJson from '@/design/research/question-bank-targets.json';
import { QuestionBankTargetsArtifactZ } from '@/lib/generation/question-bank-targets';
import { compareBlindEvaluation } from '@/lib/generation/pilot-evaluation';
import { buildCorpusInformedQuestionRecipe } from '@/lib/generation/question-recipe';

const targets = QuestionBankTargetsArtifactZ.parse(targetsJson);

describe('blind pilot comparison', () => {
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
});
