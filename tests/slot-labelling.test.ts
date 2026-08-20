import { describe, expect, it } from 'vitest';
import { renderVisual } from '@/lib/visuals';
import { isPositionalLabel } from '@/lib/notation';
import { QuestionDraftZ } from '@/lib/validation/question';

// Two correct answers typed into the wrong boxes were marked wrong. Nothing in
// the question was wrong: the table showed four identical blanks, the boxes
// were named (i) to (iv), and only counting connected them.

describe('a completable table names its gaps', () => {
  const table = (cell: unknown) =>
    renderVisual(
      {
        template: 'dataTable',
        params: {
          headers: ['Score', 'Frequency'],
          rows: [['10', cell], ['20', { slots: ['a.ii'] }]],
        },
      } as never,
      { stimulus: '', stem: 'Complete the table.', partPrompts: [] },
    );

  it('stamps each gap with the key of the box that fills it', () => {
    const html = table({ slots: ['a.i'] });
    expect(html).toContain('<span class="cell-blank"><i class="cell-key">i</i></span>');
    expect(html).toContain('<i class="cell-key">ii</i>');
  });

  it('names every gap of a scaffolded cell, in order', () => {
    const html = table({ slots: ['a.p', 'a.q'], template: '{} × {}' });
    const keys = [...html.matchAll(/class="cell-key">([^<]+)</g)].map((m) => m[1]);
    expect(keys.slice(0, 2)).toEqual(['p', 'q']);
  });
});

describe('positional labels name nothing', () => {
  it('knows the difference between a position and a quantity', () => {
    for (const l of ['i', 'ii', 'iii', 'iv', 'vi', '1', '2']) expect(isPositionalLabel(l), l).toBe(true);
    // These ARE the wording — the paper's own name for the thing asked for.
    for (const l of ['centre', 'factor', 'modal_class', 'y']) expect(isPositionalLabel(l), l).toBe(false);
  });

  it('does not read the unknown x as the tenth item', () => {
    // A part holds at most eight slots, so ix and x are unreachable as
    // positions — and "find the values of x and y" labels its boxes x and y.
    for (const l of ['x', 'ix']) expect(isPositionalLabel(l), l).toBe(false);
  });
});

describe('a part with several boxes must say what each is for', () => {
  it('is satisfied by a table that names the boxes in its own gaps', () => {
    const q = {
      kind: 'structured' as const,
      module: 2 as const,
      objective_ids: ['M2.3.1'],
      difficulty: 2 as const,
      marks: 2,
      representation: 'table' as const,
      archetype: 'multi-step-application' as const,
      shape: 'drill' as const,
      stem: 'The table shows two totals.',
      visual: { template: 'dataTable', params: { headers: ['n', 'total'], rows: [['1', { slots: ['a.i'] }], ['2', { slots: ['a.ii'] }]] } },
      worked_solution: 'The totals are $4$ and $9$.',
      misconceptions: [],
      parts: [
        {
          label: 'a',
          prompt: 'Complete the table.',
          marks: 2,
          slots: [
            { label: 'i', answer: '4', rubric_codes: ['AK1'] },
            { label: 'ii', answer: '9', rubric_codes: ['AK2'] },
          ],
        },
      ],
      rubric: [
        { code: 'AK1', profile: 'AK' as const, criterion: 'First total', mark_value: 1, slot_ref: 'a.i' },
        { code: 'AK2', profile: 'AK' as const, criterion: 'Second total', mark_value: 1, slot_ref: 'a.ii' },
      ],
      final_answer: '4; 9',
    };
    expect(QuestionDraftZ.safeParse(q).success).toBe(true);
  });

  const question = (slots: { label: string; prompt?: string; answer: string; rubric_codes: string[] }[]) => ({
    kind: 'structured' as const,
    module: 2 as const,
    objective_ids: ['M2.3.1'],
    difficulty: 2 as const,
    marks: 2,
    representation: 'prose' as const,
    archetype: 'multi-step-application' as const,
    shape: 'drill' as const,
    stem: 'A line passes through $(0, 3)$ and $(1, 5)$.',
    worked_solution: 'The gradient is $2$ and the intercept is $3$.',
    misconceptions: [],
    parts: [{ label: 'a', prompt: 'State the gradient and the $y$-intercept.', marks: 2, slots }],
    rubric: [
      { code: 'AK1', profile: 'AK' as const, criterion: 'Gradient', mark_value: 1, slot_ref: 'a.i' },
      { code: 'AK2', profile: 'AK' as const, criterion: 'Intercept', mark_value: 1, slot_ref: 'a.ii' },
    ],
    final_answer: '$2$; $3$',
  });

  it('rejects two positional boxes under one instruction', () => {
    const res = QuestionDraftZ.safeParse(
      question([
        { label: 'i', answer: '$2$', rubric_codes: ['AK1'] },
        { label: 'ii', answer: '$3$', rubric_codes: ['AK2'] },
      ]),
    );
    expect(res.success).toBe(false);
    expect(JSON.stringify(res.error)).toContain('must say what each box is for');
  });

  it('accepts them once each box says what it is for', () => {
    const res = QuestionDraftZ.safeParse(
      question([
        { label: 'i', prompt: 'the gradient', answer: '$2$', rubric_codes: ['AK1'] },
        { label: 'ii', prompt: 'the $y$-intercept', answer: '$3$', rubric_codes: ['AK2'] },
      ]),
    );
    expect(res.success).toBe(true);
  });
});
