import { describe, expect, it } from 'vitest';
import { buildDefaultQuestionRecipe } from '@/lib/generation/question-recipe';
import { buildDraftPrompt } from '@/lib/prompts/question-gen';

describe('question generation prompt recipes', () => {
  it('requires the exact objective and MCQ profile', () => {
    const recipe = buildDefaultQuestionRecipe({
      objectiveIds: ['M2.1.3'],
      kind: 'mcq',
      difficulty: 2,
    });
    const prompt = buildDraftPrompt({
      topicTitle: 'Statistics 1',
      objectives: [{ id: 'M2.1.3', text: 'Determine measures of central tendency.' }],
      recipe,
    });
    expect(prompt).toContain('use exactly these ids');
    expect(prompt).toContain('M2.1.3');
    expect(prompt).toContain('PROFILE: AK');
    expect(prompt).toContain('Archetype: direct-procedure');
  });

  it('requires the structured rubric to match the recipe profile totals', () => {
    const recipe = buildDefaultQuestionRecipe({
      objectiveIds: ['M3.2.1'],
      kind: 'structured',
      difficulty: 3,
    });
    const prompt = buildDraftPrompt({
      topicTitle: 'Relations, Functions and Graphs 2',
      objectives: [{ id: 'M3.2.1', text: 'Apply properties of functions.' }],
      recipe,
    });
    expect(prompt).toContain('PROFILE MARKS: CK 1, AK 3, R 3');
    expect(prompt).toContain('Marks: 7');
    expect(prompt).toContain('match its exact CK/AK/R totals');
  });
});
