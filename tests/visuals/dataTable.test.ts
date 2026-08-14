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
