import { describe, expect, it } from 'vitest';
import { slotCellNames } from '@/lib/visuals/slot-names';

// A table-completion part gives boxes and no per-slot prompt, so the card fell
// back to "first answer" / "second answer". Validation allowed it because the
// table prints a small (i) key in each blank cell — and a real attempt proved
// that is not enough. In 0ab933 the suitable-beans row runs PERCENTAGE then
// NUMBER while the boxes run (i) then (ii), number then percentage. A student
// filling boxes in the order they read the table put 88% where 1 056 000
// belonged. Both values were right; both were marked wrong.
describe('slotCellNames — a box is named by the cell it fills', () => {
  const beans = {
    template: 'dataTable',
    params: {
      headers: ['Category', 'Percentage of total harvest', 'Number of beans'],
      rows: [
        ['Rejected beans', '12%', { slots: ['a.i'] }],
        ['Suitable beans', { slots: ['b.ii'] }, { slots: ['b.i'] }],
      ],
      row_header_column: true,
    },
  };

  it('names each box by its row and column', () => {
    const names = slotCellNames(beans);
    expect(names.get('b.i')).toBe('Suitable beans · Number of beans');
    expect(names.get('b.ii')).toBe('Suitable beans · Percentage of total harvest');
  });

  // row_header_column decides whether the cell renders as a th. It says nothing
  // about whether the value names the row, and half the completion tables in
  // the bank leave it unset while still opening with "Cement bags".
  it('reads the row name whether or not the header flag is set', () => {
    const invoice = {
      template: 'dataTable',
      params: {
        headers: ['Item', 'Quantity', 'Amount'],
        rows: [
          ['Cement bags', '40', { slots: ['a.i'] }],
          ['Steel rods', '25', { slots: ['a.ii'] }],
        ],
      },
    };
    expect(slotCellNames(invoice).get('a.i')).toBe('Cement bags · Amount');
    expect(slotCellNames(invoice).get('a.ii')).toBe('Steel rods · Amount');
  });

  it('does not pair the first column with itself', () => {
    const names = slotCellNames({
      template: 'dataTable',
      params: { headers: ['Item', 'Cost'], rows: [[{ slots: ['a.i'] }, '5']] },
    });
    expect(names.get('a.i')).toBe('Item');
  });

  it('tells apart several slots scaffolded into one cell', () => {
    const names = slotCellNames({
      template: 'dataTable',
      params: {
        headers: ['Term', 'Rule'],
        rows: [['5th', { slots: ['a.i', 'a.ii'], template: '({} × {})' }]],
      },
    });
    expect(names.get('a.i')).toBe('5th · Rule (1)');
    expect(names.get('a.ii')).toBe('5th · Rule (2)');
  });

  it('says nothing about a figure that is not a table', () => {
    expect(slotCellNames({ template: 'coordinateGrid', params: {} }).size).toBe(0);
    expect(slotCellNames(undefined).size).toBe(0);
  });
});
