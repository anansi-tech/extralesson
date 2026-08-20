import { describe, expect, it } from 'vitest';
import { CONSTRUCT_FAMILIES, CONSTRUCT_SHARE, constructActs, constructFamily, isConstructTemplate } from '@/lib/targets/construct';
import { QuestionDraftZ } from '@/lib/validation/question';
import { SHOW_THAT_SHARE } from '@/lib/targets/show-that';
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

  // One template, three drawings: the first live batch produced a linear
  // programming region on a coordinateGrid, which would have been checked
  // against "draw a smooth curve through the plotted points".
  it('takes the acts from what the figure declares, not from the template name', () => {
    const curve = constructActs({ template: 'coordinateGrid', params: { curves: [{ a: 1, b: 0, c: -4 }] } });
    const region = constructActs({ template: 'coordinateGrid', params: { lines: [{ m: -2, c: 12 }], regions: [{ constraints: [] }] } });
    const lines = constructActs({ template: 'coordinateGrid', params: { lines: [{ m: 2, c: 1 }] } });
    expect(curve.join(' ')).toContain('smooth curve');
    expect(region.join(' ')).toContain('shaded');
    expect(region.join(' ')).not.toContain('smooth curve');
    expect(lines.join(' ')).toContain('labelled with its equation');
    expect(lines.join(' ')).not.toContain('shaded');
  });

  it('gives a non-grid family its own single list', () => {
    expect(constructActs({ template: 'cumulativeFrequency', params: {} })).toEqual(
      constructFamily('cumulativeFrequency')!.acts,
    );
    expect(constructActs({ template: 'triangleLabeled', params: {} })).toEqual([]);
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

describe('show that — a demand the gates cannot check, so it must be asked for', () => {
  const recipe = (over: Partial<QuestionRecipe>): QuestionRecipe => ({
    objective_ids: ['M1.4.1'],
    kind: 'structured',
    difficulty: 2,
    marks: 10,
    archetype: 'multi-step-application',
    representation: 'prose',
    shape: 'paper',
    ...over,
  });
  const build = (over: Partial<QuestionRecipe>) =>
    buildDraftPrompt({
      topicTitle: 'Measurement',
      objectives: [{ id: 'M1.4.1', text: 'Calculate the area of a plane figure.' }],
      recipe: recipe(over),
      context: { topic_code: 'M1-MEAS', topic_codes: ['M1-MEAS'], template_hints: [] },
      module: 1,
      visualContract: '',
    });

  it('carries the contract when the recipe asks', () => {
    const p = build({ show_that: true });
    expect(p).toContain('ONE PART OF THIS QUESTION IS A "SHOW THAT"');
    expect(p).toContain('response_mode": "show_that');
    expect(p).toContain('THE RESULT MUST ACTUALLY FOLLOW');
  });

  it('says nothing about it otherwise', () => {
    expect(build({})).not.toContain('ONE PART OF THIS QUESTION IS A "SHOW THAT"');
  });

  it('holds the measured share', () => {
    expect(SHOW_THAT_SHARE).toBeCloseTo(0.15);
  });
});

describe('a construct question does not talk about a figure the student cannot see', () => {
  const base = () => ({
    kind: 'structured' as const,
    module: 3 as const,
    objective_ids: ['M3.2.4'],
    difficulty: 2 as const,
    marks: 4,
    representation: 'graph' as const,
    archetype: 'multi-step-application' as const,
    shape: 'paper' as const,
    stem: 'Answer the parts below.',
    visual: { template: 'coordinateGrid', params: { x_range: [-3, 3], y_range: [-5, 5], curves: [{ a: 1, b: 0, c: -4 }] } },
    worked_solution: 'The curve cuts the $x$-axis at $x = -2$ and $x = 2$.',
    misconceptions: [],
    final_answer: 'A parabola with minimum $(0, -4)$.; $x = -2$; $x = 2$',
    parts: [
      {
        label: 'a',
        prompt: 'Using a scale of 2 cm to 1 unit, draw the graph of $y = x^2 - 4$.',
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
      { code: 'AK1', profile: 'AK' as const, criterion: 'Plots the points', mark_value: 1, slot_ref: 'a.i' },
      { code: 'CK1', profile: 'CK' as const, criterion: 'Smooth curve', mark_value: 1, slot_ref: 'a.i' },
      { code: 'AK2', profile: 'AK' as const, criterion: 'Negative root', mark_value: 1, slot_ref: 'b.i' },
      { code: 'R1', profile: 'R' as const, criterion: 'Positive root', mark_value: 1, slot_ref: 'b.i' },
    ],
  });

  it('rejects a stem that points at the withheld figure', () => {
    // 35 of 58 construct questions did this, because the prompt never said the
    // figure was hidden. It points at nothing, and contradicts part (a).
    for (const stem of [
      'The grid below shows the completed graph. Answer the parts below.',
      'Use the graph to answer the parts below.',
      'The diagram shows the curve, as shown below.',
    ]) {
      const res = QuestionDraftZ.safeParse({ ...base(), stem });
      expect(res.success, stem).toBe(false);
      expect(JSON.stringify(res.error)).toContain('cannot see while answering');
    }
  });

  it('checks the stimulus as well as the stem', () => {
    const res = QuestionDraftZ.safeParse({ ...base(), stimulus: 'The graph below represents this model.' });
    expect(res.success).toBe(false);
  });

  it('leaves a pattern of figures alone, where the figures ARE given', () => {
    // patternFigure params carry figures 1 to 3 — the premise. The one drawn is
    // figure 4, which is not in them, so the diagram is shown and may be named.
    const pattern = {
      ...base(),
      representation: 'diagram' as const,
      visual: { template: 'patternFigure', params: { kind: 'matchsticks', arrangement: 'row', figure_numbers: [1, 2, 3], counts: [3, 5, 7] } },
      stem: 'The diagram shows the first three figures in the pattern.',
    };
    expect(QuestionDraftZ.safeParse(pattern).success).toBe(true);
  });
});
