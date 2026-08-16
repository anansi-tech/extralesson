import { z } from 'zod';
import { esc, svgPlainLabel } from '../svg';
import type { VisualTemplate } from '../types';

// Semantic HTML table (the one non-SVG template). Data lives in the visual;
// values need not appear in the question text.
//
// R1.8 Part 3 — a cell is either printed or ANSWERABLE. The sequence question
// in 2023, 2024 and 2025 puts 7 of its 10 marks in a table: rows to complete, a
// row where a later column is given and the earlier ones are the answers, and a
// final row in terms of n. The 2023 table goes further and scaffolds the rule
// itself — "( … × … ) + … + … = …" — walking the candidate from arithmetic to
// the general form. A value-only cell cannot express any of that.
const CellZ = z.union([
  // printed text, exactly as today
  z.string().max(60),
  z.object({
    /**
     * The slots that fill this cell's blanks, in order. One slot for an
     * ordinary blank cell; several when the cell is scaffolded.
     */
    slots: z.array(z.string().regex(/^[a-j]\.[a-z0-9][a-z0-9._\-]{0,29}$/i)).min(1).max(6),
    /**
     * The printed skeleton, with {} where each slot goes: "({} × {}) + {} = {}".
     * Omit for a plain blank cell.
     */
    template: z.string().max(80).optional(),
  }),
]);

export const DataTableParamsZ = z.object({
  caption: z.string().max(80).optional(),
  headers: z.array(z.string().min(1).max(40)).min(1).max(12),
  rows: z.array(z.array(CellZ).min(1).max(12)).min(1).max(15),
  row_header_column: z.boolean().default(false),
});

export type DataTableParams = z.infer<typeof DataTableParamsZ>;

type Cell = z.infer<typeof CellZ>;

function cellText(raw: string): string {
  return esc(svgPlainLabel(raw));
}

/** A cell the student fills: the printed skeleton with a gap per slot. */
function answerCell(cell: Exclude<Cell, string>): string {
  const gap = '<span class="cell-blank"></span>';
  if (!cell.template) return gap;
  // The skeleton's spacing is the teaching: "( _ × _ ) + _" must not collapse
  // to "(_×_)+_", so the outer spaces of each piece survive the label tidy-up.
  const spaced = (piece: string) =>
    `${piece.match(/^\s*/)?.[0] ?? ''}${cellText(piece)}${piece.match(/\s*$/)?.[0] ?? ''}`;
  const pieces = cell.template.split('{}');
  return pieces.map((piece, i) => spaced(piece) + (i < pieces.length - 1 ? gap : '')).join('');
}

function isAnswerCell(cell: Cell): cell is Exclude<Cell, string> {
  return typeof cell !== 'string';
}

export const dataTable: VisualTemplate<DataTableParams> = {
  name: 'dataTable',
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    "every row must have exactly as many cells as there are headers",
    "header cells must not be blank",
    "a cell the student fills is {\"slots\": [\"b.r5S\"]} rather than text, and every slot it names must be a slot of this question",
    "a scaffolded cell adds \"template\" with {} where each slot goes — \"({} x {}) + {} + {} = {}\" — which is how the paper walks a candidate from the arithmetic to the rule",
    "a final row in terms of n is written as answerable cells like any other row",
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
        const html = isAnswerCell(cell) ? answerCell(cell) : cellText(cell);
        if (i === 0 && p.row_header_column) {
          parts.push(`<th scope="row">${html}</th>`);
        } else {
          parts.push(`<td>${html}</td>`);
        }
      });
      parts.push('</tr>');
    }
    parts.push('</tbody></table>');
    return parts.join('');
  },

  describe(p, context) {
    // The solver is told which cells the student fills, and with what scaffold,
    // so it can answer them slot by slot rather than reading them as data.
    const v = (cell: Cell) => {
      if (!isAnswerCell(cell)) return cell === '' ? '(blank)' : cell;
      const named = cell.slots.join(', ');
      return cell.template
        ? `to be completed as "${cell.template.replace(/\{\}/g, '___')}" (slots ${named})`
        : `to be completed (slot ${named})`;
    };
    void context;
    const rows = p.rows
      .map((row, i) => `Row ${i + 1}: ${row.map(v).join(' | ')}`)
      .join('. ');
    return `Table${p.caption ? ` captioned "${p.caption}"` : ''} with columns ${p.headers.join(
      ' | ',
    )}${p.row_header_column ? ' (first column is a row header)' : ''}. ${rows}.`;
  },

  verify(p, context) {
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

    // A cell the student fills must name slots this question actually has, and
    // a scaffold must have one gap per slot — otherwise the table asks for
    // something nothing marks, or marks something it never asked for.
    const known = context?.slotRefs;
    const seen = new Set<string>();
    p.rows.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (!isAnswerCell(cell)) return;
        const gaps = cell.template ? cell.template.split('{}').length - 1 : 1;
        if (gaps !== cell.slots.length) {
          issues.push(
            `dataTable: cell (row ${i + 1}, column ${j + 1}) has ${gaps} gap(s) for ${cell.slots.length} slot(s)`,
          );
        }
        for (const ref of cell.slots) {
          if (seen.has(ref)) issues.push(`dataTable: slot ${ref} fills more than one cell`);
          seen.add(ref);
          if (known && !known.includes(ref)) {
            issues.push(`dataTable: cell slot ${ref} is not a slot of this question`);
          }
        }
      });
    });
    return issues;
  },
};
