import { describe, expect, it } from 'vitest';
import { dataTable, DataTableParamsZ } from '@/lib/visuals/templates/dataTable';
import { verifyQuestionVisual } from '@/lib/visuals/verify';

// R1.8 Part 3 — the sequence question puts 7 of its 10 marks in a table: rows
// to complete, a reverse row where a later column is given, and a final row in
// terms of n. 2023 goes further and scaffolds the rule itself, walking the
// candidate from arithmetic to the general form. A value-only cell cannot
// express any of it.
const sequence = DataTableParamsZ.parse({
  caption: 'Designs',
  headers: ['Design (D)', 'White discs (W)', 'Black discs (B)', 'Total (T)'],
  row_header_column: true,
  rows: [
    ['1', '(1 × 1) + 1 + 1 = 3', '4', '7'],
    ['2', '(2 × 2) + 2 + 1 = 7', '6', '13'],
    // a row to complete, with the rule scaffolded
    ['9', { slots: ['b.r9W1', 'b.r9W2', 'b.r9W3', 'b.r9W4'], template: '({} × {}) + {} + {} =' }, { slots: ['b.r9B'] }, '111'],
    // a reverse row: the later column is given, the earlier ones are answers
    [{ slots: ['b.rXD'] }, '(20 × 20) + 20 + 1 = 421', { slots: ['b.rXB'] }, { slots: ['b.rXT'] }],
    // the n row
    ['n', { slots: ['c.nW'] }, { slots: ['c.nB'] }, { slots: ['c.nT'] }],
  ],
});

const slotRefs = [
  'b.r9W1', 'b.r9W2', 'b.r9W3', 'b.r9W4', 'b.r9B',
  'b.rXD', 'b.rXB', 'b.rXT',
  'c.nW', 'c.nB', 'c.nT',
];
const ctx = { stem: 'Study the pattern of numbers in the table.', partPrompts: ['Complete the rows.'], slotRefs };

describe('a table whose cells can be answered', () => {
  it('prints the values it gives and leaves a gap for each answer', () => {
    const html = dataTable.render(sequence);
    expect(html).toContain('(1 × 1) + 1 + 1 = 3'); // printed
    expect((html.match(/cell-blank/g) ?? []).length).toBe(11); // one per slot
  });

  it('keeps the scaffold around its gaps, which is the teaching part', () => {
    const html = dataTable.render(sequence);
    // "( _ × _ ) + _ + _ =" — the skeleton survives, with four gaps inside it,
    // each gap now naming the box that fills it.
    expect(html).toMatch(/\(<span class="cell-blank"><i class="cell-key">[^<]+<\/i><\/span> × <span class="cell-blank">/);
  });

  it('tells the solver which cells are to be completed, and with what shape', () => {
    const d = dataTable.describe(sequence);
    expect(d).toContain('to be completed as "({} × {}) + {} + {} ="'.replace(/\{\}/g, '___'));
    expect(d).toContain('slot c.nW');
  });

  it('passes verification when every cell slot is a slot of the question', () => {
    expect(verifyQuestionVisual({ template: 'dataTable', params: sequence as never }, ctx).issues).toEqual([]);
  });

  it('rejects a cell asking for an answer nothing marks', () => {
    const stray = DataTableParamsZ.parse({
      ...sequence,
      rows: [...sequence.rows.slice(0, 2), ['3', { slots: ['b.nowhere'] }, '8', '21'], ...sequence.rows.slice(3)],
    });
    const res = verifyQuestionVisual({ template: 'dataTable', params: stray as never }, ctx);
    expect(res.ok).toBe(false);
    expect(res.issues.join(' ')).toContain('not a slot of this question');
  });

  it('rejects a scaffold whose gaps and slots disagree', () => {
    const mismatched = DataTableParamsZ.parse({
      ...sequence,
      rows: [['1', { slots: ['b.r9W1'], template: '({} × {}) + {}' }, '4', '7']],
    });
    const res = verifyQuestionVisual({ template: 'dataTable', params: mismatched as never }, {
      ...ctx,
      slotRefs: ['b.r9W1'],
    });
    expect(res.issues.join(' ')).toContain('3 gap(s) for 1 slot(s)');
  });

  it('rejects one slot filling two cells', () => {
    const doubled = DataTableParamsZ.parse({
      ...sequence,
      rows: [['1', { slots: ['c.nW'] }, { slots: ['c.nW'] }, '7']],
    });
    const res = verifyQuestionVisual({ template: 'dataTable', params: doubled as never }, ctx);
    expect(res.issues.join(' ')).toContain('fills more than one cell');
  });

  it('leaves an ordinary printed table exactly as it was', () => {
    const plain = DataTableParamsZ.parse({
      headers: ['Item', 'Price'],
      rows: [['Bag', '\\$80']],
    });
    const html = dataTable.render(plain);
    expect(html).not.toContain('cell-blank');
    expect(html).toContain('$80');
  });
});
