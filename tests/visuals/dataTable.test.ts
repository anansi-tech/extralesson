import { describe, expect, it } from 'vitest';
import { dataTable, DataTableParamsZ } from '@/lib/visuals/templates/dataTable';

// ORIGINAL fixture data only.
const params = DataTableParamsZ.parse({
  caption: 'Books borrowed from a school library',
  headers: ['Day', 'Fiction', 'Non-fiction'],
  rows: [
    ['Monday', '12', '8'],
    ['Tuesday', '9', '11'],
    ['Wednesday', '15', ''],
  ],
  row_header_column: true,
});

describe('dataTable template', () => {
  it('renders semantic HTML (snapshot)', () => {
    const html = dataTable.render(params);
    expect(html.startsWith('<table')).toBe(true);
    expect(html).toContain('<caption>Books borrowed from a school library</caption>');
    expect(html).toContain('<thead>');
    expect(html).toContain('<tbody>');
    expect((html.match(/<th scope="col">/g) || []).length).toBe(3);
    expect((html.match(/<th scope="row">/g) || []).length).toBe(3);
    expect(html).toContain('<td></td>'); // blank cell preserved
    expect(html).toMatchSnapshot();
  });

  it('escapes cell text', () => {
    const spicy = DataTableParamsZ.parse({
      headers: ['Item', 'Note'],
      rows: [['Rope <3 m>', 'Tom & Jerry']],
    });
    const html = dataTable.render(spicy);
    expect(html).toContain('Rope &lt;3 m&gt;');
    expect(html).toContain('Tom &amp; Jerry');
    expect(html).not.toContain('<3');
  });

  it('describe() lists every header and cell for the solver', () => {
    const d = dataTable.describe(params);
    for (const s of ['Day | Fiction | Non-fiction', 'Monday | 12 | 8', 'Tuesday | 9 | 11']) {
      expect(d).toContain(s);
    }
    expect(d).toContain('Wednesday | 15 | (blank)');
  });

  it('verify passes on consistent params', () => {
    expect(dataTable.verify(params, { stem: 'x', partPrompts: [] })).toEqual([]);
  });

  it('verify rejects ragged rows', () => {
    const ragged = { ...params, rows: [...params.rows, ['Thursday', '7']] };
    expect(dataTable.verify(ragged, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
  });

  it('verify rejects blank headers and oversize tables', () => {
    const blank = { ...params, headers: ['Day', '  ', 'Non-fiction'] };
    expect(dataTable.verify(blank, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
    const tall = { ...params, rows: Array.from({ length: 16 }, () => ['a', 'b', 'c']) };
    expect(dataTable.verify(tall, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
  });
});

// R1.8 §4.4 — the two-way (contingency) table. It is structurally the table we
// already had; what it needs is the check that its margins add up, because an
// inconsistent one reads as correct right up until a student tries to answer it.
describe('dataTable — two-way tables', () => {
  const context = { stem: 'x', partPrompts: [], slotRefs: ['a.i'] };
  const table = (over: Record<string, unknown> = {}) =>
    DataTableParamsZ.parse({
      headers: ['Group', 'Walks', 'Rides', 'Total'],
      row_header_column: true,
      totals: 'both',
      rows: [
        ['Boys', '12', '8', '20'],
        ['Girls', '9', '11', '20'],
        ['Total', '21', '19', '40'],
      ],
      ...over,
    });

  it('accepts a table whose rows, columns and grand total agree', () => {
    expect(dataTable.verify(table(), context)).toEqual([]);
  });

  it('catches a row total that does not match its own cells', () => {
    const bad = table({
      rows: [
        ['Boys', '12', '8', '21'],
        ['Girls', '9', '11', '20'],
        ['Total', '21', '19', '40'],
      ],
    });
    expect(dataTable.verify(bad, context).join(' ')).toContain('row 1 totals 21');
  });

  it('catches a column total that does not match its own cells', () => {
    const bad = table({
      rows: [
        ['Boys', '12', '8', '20'],
        ['Girls', '9', '11', '20'],
        ['Total', '22', '19', '40'],
      ],
    });
    expect(dataTable.verify(bad, context).join(' ')).toContain('column 2 totals 22');
  });

  it('catches a grand total that disagrees with the margins', () => {
    const bad = table({
      rows: [
        ['Boys', '12', '8', '20'],
        ['Girls', '9', '11', '20'],
        ['Total', '21', '19', '41'],
      ],
    });
    expect(dataTable.verify(bad, context).join(' ')).toContain('grand total is 41');
  });

  it('says nothing about a line the student is being asked to complete', () => {
    const withGap = table({
      rows: [
        ['Boys', '12', { slots: ['a.i'] }, '20'],
        ['Girls', '9', '11', '20'],
        ['Total', '21', '19', '40'],
      ],
    });
    // Row 1 and column 3 both run through the gap and cannot be checked; the
    // rest of the table still can, and does.
    expect(dataTable.verify(withGap, context)).toEqual([]);
  });

  it('checks nothing at all unless the table says it has totals', () => {
    const plain = table({ totals: undefined, rows: [['Boys', '12', '8', '99']] });
    expect(dataTable.verify(plain, context)).toEqual([]);
  });

  it('tells the solver which margins are totals', () => {
    expect(dataTable.describe(table(), context)).toContain('last row and the last column are totals');
  });
});
