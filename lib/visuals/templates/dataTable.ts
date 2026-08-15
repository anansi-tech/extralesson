import { z } from 'zod';
import { esc, svgPlainLabel } from '../svg';
import type { VisualTemplate } from '../types';

// Semantic HTML table (the one non-SVG template). Cells may be "" for
// complete-the-table questions. Data lives in the visual; values need not
// appear in the question text.
export const DataTableParamsZ = z.object({
  caption: z.string().max(80).optional(),
  headers: z.array(z.string().min(1).max(40)).min(1).max(12),
  rows: z.array(z.array(z.string().max(60)).min(1).max(12)).min(1).max(15),
  row_header_column: z.boolean().default(false),
});

export type DataTableParams = z.infer<typeof DataTableParamsZ>;

function cellText(raw: string): string {
  return esc(svgPlainLabel(raw));
}

export const dataTable: VisualTemplate<DataTableParams> = {
  name: 'dataTable',
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    "every row must have exactly as many cells as there are headers",
    "header cells must not be blank",
  ],
  paramsSchema: DataTableParamsZ,

  render(p) {
    const parts: string[] = ['<table>'];
    if (p.caption) parts.push(`<caption>${cellText(p.caption)}</caption>`);
    parts.push('<thead><tr>');
    for (const h of p.headers) parts.push(`<th scope="col">${cellText(h)}</th>`);
    parts.push('</tr></thead>');
    parts.push('<tbody>');
    for (const row of p.rows) {
      parts.push('<tr>');
      row.forEach((cell, i) => {
        if (i === 0 && p.row_header_column) {
          parts.push(`<th scope="row">${cellText(cell)}</th>`);
        } else {
          parts.push(`<td>${cellText(cell)}</td>`);
        }
      });
      parts.push('</tr>');
    }
    parts.push('</tbody></table>');
    return parts.join('');
  },

  describe(p) {
    const v = (s: string) => (s === '' ? '(blank)' : s);
    const rows = p.rows
      .map((row, i) => `Row ${i + 1}: ${row.map(v).join(' | ')}`)
      .join('. ');
    return `Table${p.caption ? ` captioned "${p.caption}"` : ''} with columns ${p.headers.join(
      ' | ',
    )}${p.row_header_column ? ' (first column is a row header)' : ''}. ${rows}.`;
  },

  verify(p) {
    const issues: string[] = [];
    if (p.headers.length === 0) issues.push('dataTable: headers must be non-empty');
    if (p.headers.length > 12) issues.push('dataTable: at most 12 columns');
    if (p.headers.some((h) => h.trim() === '')) issues.push('dataTable: blank header cell');
    if (p.rows.length < 1) issues.push('dataTable: at least 1 row required');
    if (p.rows.length > 15) issues.push('dataTable: at most 15 rows');
    p.rows.forEach((row, i) => {
      if (row.length !== p.headers.length) {
        issues.push(
          `dataTable: row ${i + 1} has ${row.length} cells but there are ${p.headers.length} headers`,
        );
      }
    });
    return issues;
  },
};
