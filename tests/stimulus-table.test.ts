import { describe, expect, it } from 'vitest';
import { renderStimulusTable, describeStimulusTable } from '@/lib/visuals';
import { verifyStimulusTable } from '@/lib/visuals/verify';
import { svgPlainLabel } from '@/lib/visuals/svg';
import { StructuredQuestionZ } from '@/lib/validation/question';
import { reviewFlags } from '@/lib/admin/review-flags';

// A question's one visual slot holds the ogive, which is the ANSWER to part (a)
// and is withheld from the student. The data it is drawn from therefore has to
// be given separately — that is what stimulus_table is for. ORIGINAL data.
const table = {
  headers: ['Waiting time, t (minutes)', 'Frequency'],
  rows: [
    ['0 < t ≤ 6', '4'],
    ['6 < t ≤ 12', '7'],
    ['12 < t ≤ 18', '11'],
  ],
  row_header_column: true,
};

const question = {
  objective_ids: ['M3.1.9'],
  module: 3,
  kind: 'structured',
  stimulus: 'A nurse recorded the waiting times of a sample of patients.',
  stem: 'Use the information above to answer the parts below.',
  representation: 'graph',
  visual: { template: 'cumulativeFrequency', params: { points: [{ x: 0, cf: 0 }] } },
  stimulus_table: table,
  archetype: 'multi-step-application',
  shape: 'paper',
  difficulty: 2,
  marks: 2,
  worked_solution: 'Form the running totals, then plot each at the upper class boundary.',
  misconceptions: [],
  parts: [
    {
      label: 'a',
      prompt: 'Draw the cumulative frequency curve.',
      marks: 2,
      slots: [{ label: 'i', answer: '22' }],
    },
  ],
  rubric: [
    {
      code: 'AK1',
      profile: 'AK',
      criterion: 'Plots the points accurately.',
      mark_value: 2,
      part_label: 'a',
      slot_ref: 'a.i',
    },
  ],
  final_answer: '22',
};

const issuesFor = (q: unknown): string[] => {
  const res = StructuredQuestionZ.safeParse(q);
  return res.success ? [] : res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};

describe('stimulus_table — the given data, when the visual slot is taken', () => {
  it('renders as a real HTML table rather than fixed-width typeset maths', () => {
    const html = renderStimulusTable(table);
    expect(html.startsWith('<table')).toBe(true);
    expect((html.match(/<th scope="col">/g) ?? []).length).toBe(2);
    // Every class interval survives; the one lost off the edge of the paper
    // was the last, so the count is the point of this assertion.
    expect((html.match(/<tr>/g) ?? []).length).toBe(4); // header + 3 rows
    expect(html).toContain('12 &lt; t ≤ 18');
  });

  it('is described to the solver, which cannot answer data it cannot see', () => {
    const text = describeStimulusTable(table);
    expect(text).toContain('Waiting time, t (minutes)');
    expect(text).toContain('Frequency');
    expect(text).toContain('0 < t ≤ 6');
  });

  it('answers to the same verify gate as a table in the visual slot', () => {
    const ok = verifyStimulusTable(table, { stimulus: '', stem: '', partPrompts: [] });
    expect(ok.ok).toBe(true);

    const ragged = { ...table, rows: [['0 < t ≤ 6', '4'], ['6 < t ≤ 12']] };
    const bad = verifyStimulusTable(ragged, { stimulus: '', stem: '', partPrompts: [] });
    expect(bad.ok).toBe(false);
    expect(bad.issues.join(' ')).toContain('headers');
  });

  it('is accepted beside a figure the student draws', () => {
    expect(issuesFor(question)).toEqual([]);
  });

  it('is refused when the visual slot is free, where a table belongs in it', () => {
    const noVisual = { ...question, representation: 'prose', visual: undefined };
    expect(issuesFor(noVisual).join(' ')).toContain('stimulus_table');
  });

  it('holds its labels to the plain-text rule, like any other table', () => {
    const typeset = { ...table, headers: ['$t$ (minutes)', 'Frequency'] };
    expect(issuesFor({ ...question, stimulus_table: typeset }).join(' ')).toContain('stimulus_table');
  });
});

describe('a table set as a KaTeX array', () => {
  it('is flagged for review, because an array cannot reflow to a phone', () => {
    const flags = reviewFlags({
      stimulus: 'The results are shown below.\n\\[\n\\begin{array}{c|c}\na & b\n\\end{array}\n\\]',
      stem: 'Use the information above to answer the parts below.',
      parts: [],
    } as never);
    expect(flags.some((f) => f.text.includes('KaTeX array'))).toBe(true);
  });
});

describe('svgPlainLabel — relations in a table cell', () => {
  // These fell through to the backslash strip and printed as words: one
  // approved table set its class intervals as "0 le t < 5".
  it('prints a relation as its symbol', () => {
    expect(svgPlainLabel('$0 \\le t < 5$')).toBe('0 ≤ t < 5');
    expect(svgPlainLabel('0 < t \\leq 6')).toBe('0 < t ≤ 6');
    expect(svgPlainLabel('$x \\ge 3$')).toBe('x ≥ 3');
    expect(svgPlainLabel('$x \\neq 2$')).toBe('x ≠ 2');
  });

  it('leaves a command that merely starts with the same letters alone', () => {
    expect(svgPlainLabel('\\leftarrow')).not.toContain('≤');
  });
});
