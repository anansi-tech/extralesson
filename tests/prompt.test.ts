import { describe, expect, it } from 'vitest';
import { buildDraftPrompt, PROMPT_VERSION } from '@/lib/prompts/question-gen';
import type { QuestionRecipe, RecipeContext } from '@/lib/generation/recipe';
import type { Objective } from '@/lib/types';

// R1.6 §7 — the paper patterns must reach the model, and only where they apply:
// a prompt that always says everything teaches the model nothing.

const recipe = (over: Partial<QuestionRecipe> = {}): QuestionRecipe => ({
  objective_ids: ['M2.3.1'],
  kind: 'structured',
  difficulty: 2,
  marks: 7,
  archetype: 'multi-step-application',
  representation: 'prose',
  ...over,
});

const context = (topic_code: string): RecipeContext => ({ topic_code, template_hints: [] });

const objective = (text: string): Objective => ({ id: 'M2.3.1', text });

function prompt(args: {
  topic: string;
  objectives?: Objective[];
  recipe?: Partial<QuestionRecipe>;
}): string {
  return buildDraftPrompt({
    topicTitle: 'Test topic',
    objectives: args.objectives ?? [objective('Solve linear equations in one unknown.')],
    recipe: recipe(args.recipe),
    context: context(args.topic),
    module: 2,
    visualContract: '',
  });
}

describe('buildDraftPrompt — R1.6 §7 paper patterns', () => {
  it('is versioned so gen_meta records which wording produced a draft', () => {
    expect(PROMPT_VERSION).toBe('v10');
  });

  it('teaches hence-or-otherwise chaining with follow-through on structured drafts', () => {
    const p = prompt({ topic: 'M2-ALG2' });
    expect(p).toContain('Hence, or otherwise');
    expect(p).toContain('follow-through');
    expect(p).toContain("student's own earlier value");
  });

  it('pairs a request for a reason with response_mode explain', () => {
    expect(prompt({ topic: 'M2-ALG2' })).toContain('"response_mode": "explain"');
  });

  it('demands exam function notation on the functions topics only', () => {
    for (const topic of ['M2-RFG1', 'M3-RFG2']) {
      expect(prompt({ topic })).toContain('FUNCTION NOTATION');
    }
    expect(prompt({ topic: 'M1-NTC' })).not.toContain('FUNCTION NOTATION');
  });

  it('shapes sequence questions around the table and rule, never the drawing', () => {
    const p = prompt({
      topic: 'M1-ALG1',
      objectives: [objective('Derive an appropriate rule given the terms of a sequence.')],
    });
    expect(p).toContain('SEQUENCE/PATTERN SHAPE');
    expect(p).toContain('We do not set drawing work');
    expect(prompt({ topic: 'M1-ALG1' })).not.toContain('SEQUENCE/PATTERN SHAPE');
  });

  it('keeps every pattern out of single-mark MCQ prompts', () => {
    const p = prompt({
      topic: 'M2-RFG1',
      recipe: { kind: 'mcq', marks: 1, difficulty: 1 },
      objectives: [objective('Compute terms of a sequence given a rule.')],
    });
    expect(p).not.toContain('PAPER PATTERNS');
    expect(p).not.toContain('FUNCTION NOTATION');
    expect(p).not.toContain('SEQUENCE/PATTERN SHAPE');
  });
});

describe('buildDraftPrompt — R1.6 §1/§2 part fields', () => {
  it('documents every response mode and forbids the one we do not generate', () => {
    const p = prompt({ topic: 'M2-ALG2' });
    expect(p).toContain('"response_mode"');
    expect(p).toContain('"show_that"');
    expect(p).toContain('Never "construct"');
  });

  it('ties answer_format to wording that actually demands a form', () => {
    const p = prompt({ topic: 'M2-ALG2' });
    expect(p).toContain('"answer_format"');
    for (const f of ['exact', 'surd', 'standard_form', 'lowest_terms', 'equation_form', 'sf:N', 'dp:N']) {
      expect(p).toContain(f);
    }
    expect(p).toContain('if you do not demand a form, omit the field');
  });
});
