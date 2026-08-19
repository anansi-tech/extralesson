import { describe, expect, it } from 'vitest';
import { CONSTRUCT_FAMILIES, CONSTRUCT_SHARE, constructFamily, isConstructTemplate } from '@/lib/targets/construct';
import { QuestionDraftZ } from '@/lib/validation/question';
import { buildDraftPrompt } from '@/lib/prompts/question-gen';
import type { QuestionRecipe, RecipeContext } from '@/lib/generation/recipe';

// R1.9 — a construction is only a question when something interrogates it.

const base = () => ({
  kind: 'structured' as const,
  module: 3 as const,
  objective_ids: ['M3.2.4'],
  difficulty: 2 as const,
  marks: 4,
  representation: 'graph' as const,
  archetype: 'multi-step-application' as const,
  shape: 'paper' as const,
  stem: 'A curve is given by $y = x^2 - 4$.',
  visual: { template: 'coordinateGrid', params: { x_range: [-3, 3], y_range: [-5, 5], curves: [{ a: 1, b: 0, c: -4 }] } },
  worked_solution: 'The curve cuts the $x$-axis at $x = -2$ and $x = 2$.',
  final_answer: 'A parabola with minimum $(0, -4)$.; $x = -2$; $x = 2$',
  misconceptions: [],
  parts: [
    {
      label: 'a',
      prompt: 'Using a scale of 2 cm to 1 unit, draw the graph of $y = x^2 - 4$ for $-3 \\le x \\le 3$.',
      marks: 2,
      slots: [{ label: 'i', answer: 'A parabola with minimum $(0, -4)$.', response_mode: 'construct' as const }],
    },
    {
      label: 'b',
      prompt: 'State the values of $x$ where the graph cuts the $x$-axis.',
      marks: 2,
      slots: [{ label: 'i', answer: '$x = -2$; $x = 2$', response_mode: 'answer' as const }],
    },
  ],
  rubric: [
    { code: 'AK1', profile: 'AK' as const, criterion: 'Plots the points from the table', mark_value: 1, slot_ref: 'a.i' },
    { code: 'CK1', profile: 'CK' as const, criterion: 'Draws a smooth curve', mark_value: 1, slot_ref: 'a.i' },
    { code: 'AK2', profile: 'AK' as const, criterion: 'Reads the negative root', mark_value: 1, slot_ref: 'b.i' },
    { code: 'R1', profile: 'R' as const, criterion: 'Reads the positive root', mark_value: 1, slot_ref: 'b.i' },
  ],
});

describe('construct slots', () => {
  it('accepts a construction that later parts interrogate', () => {
    expect(QuestionDraftZ.safeParse(base()).success).toBe(true);
  });

  it('rejects a construction with nothing marked after it — that is drawing practice', () => {
    const q = base();
    q.parts[1].slots[0].response_mode = 'explain' as never;
    const res = QuestionDraftZ.safeParse(q);
    expect(res.success).toBe(false);
    expect(JSON.stringify(res.error)).toContain('a drawing alone is not a question');
  });

  it('rejects a construction that is not the first part', () => {
    const q = base();
    q.parts[0].slots[0].response_mode = 'answer' as never;
    q.parts[1].slots[0].response_mode = 'construct' as never;
    const res = QuestionDraftZ.safeParse(q);
    expect(res.success).toBe(false);
    expect(JSON.stringify(res.error)).toContain('must be the first part');
  });

  it('rejects a question carrying no figure to check the drawing against', () => {
    const q = base();
    delete (q as { visual?: unknown }).visual;
    const res = QuestionDraftZ.safeParse(q);
    expect(res.success).toBe(false);
    expect(JSON.stringify(res.error)).toContain('must carry the figure');
  });
});

describe('construct families', () => {
  it('covers the four families and nothing else', () => {
    expect(CONSTRUCT_FAMILIES.map((f) => f.template).sort()).toEqual([
      'coordinateGrid',
      'cumulativeFrequency',
      'patternFigure',
      'travelGraph',
    ]);
    // Instrument constructions are not a family, and never become one here.
    expect(isConstructTemplate('triangleLabeled')).toBe(false);
  });

  it('gives every family a self-check list of examiner acts', () => {
    for (const f of CONSTRUCT_FAMILIES) {
      expect(f.acts.length).toBeGreaterThanOrEqual(3);
      expect(constructFamily(f.template)).toBe(f);
    }
  });

  it('holds the measured share, which the recipe consumes', () => {
    expect(CONSTRUCT_SHARE).toBeCloseTo(0.15);
  });
});

describe('the prompt asks for a construction only when the recipe does', () => {
  const recipe = (over: Partial<QuestionRecipe>): QuestionRecipe => ({
    objective_ids: ['M3.2.4'],
    kind: 'structured',
    difficulty: 2,
    marks: 10,
    archetype: 'multi-step-application',
    representation: 'graph',
    shape: 'paper',
    ...over,
  });
  const context: RecipeContext = { topic_code: 'M3-RFG1', topic_codes: ['M3-RFG1'], template_hints: [] };
  const build = (over: Partial<QuestionRecipe>) =>
    buildDraftPrompt({
      topicTitle: 'Relations, functions and graphs',
      objectives: [{ id: 'M3.2.4', text: 'Draw graphs of non-linear functions.' }],
      recipe: recipe(over),
      context,
      module: 3,
      visualContract: '',
    });

  it('carries the contract when asked', () => {
    const p = build({ construct: true });
    expect(p).toContain('CONSTRUCTION (hard requirement for this question)');
    expect(p).toContain('THE REST OF THE QUESTION INTERROGATES THE DRAWING');
    expect(p).not.toContain('Never "construct"');
  });

  it('forbids it otherwise, which is every other question', () => {
    const p = build({});
    expect(p).not.toContain('CONSTRUCTION (hard requirement');
    expect(p).toContain('Never "construct"');
  });
});
