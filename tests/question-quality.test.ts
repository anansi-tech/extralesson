import { describe, expect, it } from 'vitest';
import { blindReviewIssues, deterministicPresentationIssues } from '@/lib/generation/question-quality';
import { buildDefaultQuestionRecipe } from '@/lib/generation/question-recipe';
import { QuestionVisualZ } from '@/lib/validation/question-visual';

describe('deterministic presentation quality', () => {
  it('rejects a diagram confined to a tiny part of the fixed canvas', () => {
    const visual = QuestionVisualZ.parse({
      format: 'diagram', visual_type: 'geometry-figure',
      alt_text: 'Three points making a small right angle.',
      points: [
        { id: 'P', x: 1, y: 1 },
        { id: 'Q', x: 7, y: 3 },
        { id: 'R', x: 6, y: 6 },
      ],
      segments: [{ from: 'P', to: 'Q' }, { from: 'Q', to: 'R' }],
    });
    expect(deterministicPresentationIssues(visual)).toEqual(['visual-scale-risk']);
  });

  it('accepts a diagram that uses the available canvas', () => {
    const visual = QuestionVisualZ.parse({
      format: 'diagram', visual_type: 'geometry-figure',
      alt_text: 'Three points making a large triangle.',
      points: [
        { id: 'A', x: 10, y: 80 },
        { id: 'B', x: 50, y: 10 },
        { id: 'C', x: 90, y: 80 },
      ],
      segments: [
        { from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'C', to: 'A' },
      ],
    });
    expect(deterministicPresentationIssues(visual)).toEqual([]);
  });

  it('rejects a blind review whose observed demand misses the recipe', () => {
    const recipe = buildDefaultQuestionRecipe({
      objectiveIds: ['M3.4.1'], kind: 'mcq', difficulty: 3,
    });
    const issues = blindReviewIssues({
      question_id: 'candidate', difficulty: 1, archetype: 'direct-procedure', profile: 'AK',
      part_count: 1, context_category: 'none', visual_type: null,
      exam_fidelity: 5, clarity: 5, visual_legibility: null, visual_necessity: null,
      readiness: 'pass', concerns: [],
    }, recipe);
    expect(issues).toContain('difficulty-mismatch');
    expect(issues).toContain('profile-mismatch');
  });

  it('accepts a clean blind review that matches the hidden controls', () => {
    const recipe = buildDefaultQuestionRecipe({
      objectiveIds: ['M2.3.1'], kind: 'mcq', difficulty: 2,
    });
    expect(blindReviewIssues({
      question_id: 'candidate', difficulty: 2, archetype: 'direct-procedure', profile: 'AK',
      part_count: 1, context_category: 'none', visual_type: null,
      exam_fidelity: 4, clarity: 4, visual_legibility: null, visual_necessity: null,
      readiness: 'pass', concerns: [],
    }, recipe)).toEqual([]);
  });
});
