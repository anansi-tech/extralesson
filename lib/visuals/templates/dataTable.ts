import { z } from 'zod';
import { esc, svgPlainLabel } from '../svg';
import type { VisualTemplate } from '../types';
import { SLOT_REF_RE } from '@/lib/notation';

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
    slots: z.array(z.string().regex(SLOT_REF_RE)).min(1).max(6),
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
  /**
   * R1.8 §4.4 — a two-way (contingency) table: the last row totals each column,
   * the last column totals each row, or both. Declaring it is what lets verify()
   * check the arithmetic; a table whose margins do not add up is a question
   * nobody can answer, and it reads as correct until a student tries.
   */
  totals: z.enum(['row', 'column', 'both']).optional(),
});

export type DataTableParams = z.infer<typeof DataTableParamsZ>;

type Cell = z.infer<typeof CellZ>;

function cellText(raw: string): string {
  return esc(svgPlainLabel(raw));
}

/**
 * A cell the student fills: the printed skeleton with a gap per slot.
 *
 * Each gap is STAMPED WITH THE LABEL OF THE SLOT THAT FILLS IT, because that
 * label is also what the answer box beside the question is called. Anonymous
 * gaps put four identical blanks above four boxes named (i) to (iv) and left
 * the student to pair them by counting; pairing them wrong gets correct
 * answers marked wrong, which is the worst thing this can do to them.
 */
function answerCell(cell: Exclude<Cell, string>): string {
  const gaps = cell.slots.map(
    (ref) => `<span class="cell-blank"><i class="cell-key">${esc(ref.slice(ref.indexOf('.') + 1))}</i></span>`,
  );
  if (!cell.template) return gaps[0] ?? '<span class="cell-blank"></span>';
  // The skeleton's spacing is the teaching: "( _ × _ ) + _" must not collapse
  // to "(_×_)+_", so the outer spaces of each piece survive the label tidy-up.
  const spaced = (piece: string) =>
    `${piece.match(/^\s*/)?.[0] ?? ''}${cellText(piece)}${piece.match(/\s*$/)?.[0] ?? ''}`;
  const pieces = cell.template.split('{}');
  return pieces.map((piece, i) => spaced(piece) + (i < pieces.length - 1 ? (gaps[i] ?? '') : '')).join('');
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
    "a two-way (contingency) table sets \"totals\" to \"row\", \"column\" or \"both\" — its margins are then checked, and every printed total must equal the sum of the printed cells it totals",
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
    const margins =
      p.totals === 'both'
        ? ' The last row and the last column are totals.'
        : p.totals === 'row'
          ? ' The last column totals each row.'
          : p.totals === 'column'
            ? ' The last row totals each column.'
            : '';
    const rows = p.rows
      .map((row, i) => `Row ${i + 1}: ${row.map(v).join(' | ')}`)
      .join('. ');
    return `Table${p.caption ? ` captioned "${p.caption}"` : ''} with columns ${p.headers.join(
      ' | ',
    )}${p.row_header_column ? ' (first column is a row header)' : ''}.${margins} ${rows}.`;
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

    issues.push(...totalsIssues(p));
    return issues;
  },
};

/** A printed number, or null when the cell is answerable, blank or wordy. */
function numericCell(cell: Cell | undefined): number | null {
  if (cell === undefined || isAnswerCell(cell)) return null;
  const text = cell.replace(/[\s,$]/g, '');
  if (text === '' || !/^-?\d+(\.\d+)?$/.test(text)) return null;
  return Number(text);
}

/**
 * A two-way table's margins must add up. Only fully printed lines are checked:
 * where a cell is the student's to fill we do not know the value, and a gate
 * that guessed would reject good questions.
 */
function totalsIssues(p: DataTableParams): string[] {
  if (!p.totals) return [];
  const issues: string[] = [];
  const firstDataCol = p.row_header_column ? 1 : 0;
  const wantsRowTotals = p.totals === 'row' || p.totals === 'both';
  const wantsColumnTotals = p.totals === 'column' || p.totals === 'both';
  const lastRow = p.rows.length - 1;
  const lastCol = p.headers.length - 1;
  const near = (a: number, b: number) => Math.abs(a - b) < 0.005;

  if (wantsRowTotals && lastCol > firstDataCol) {
    p.rows.forEach((row, i) => {
      if (wantsColumnTotals && i === lastRow) return; // the grand total, checked below
      const total = numericCell(row[lastCol]);
      const cells = row.slice(firstDataCol, lastCol).map(numericCell);
      if (total === null || cells.some((c) => c === null)) return;
      const sum = (cells as number[]).reduce((s, c) => s + c, 0);
      if (!near(sum, total)) {
        issues.push(`dataTable: row ${i + 1} totals ${total} but its cells sum to ${sum}`);
      }
    });
  }

  if (wantsColumnTotals && lastRow > 0) {
    for (let j = firstDataCol; j <= lastCol; j++) {
      if (wantsRowTotals && j === lastCol) continue;
      const total = numericCell(p.rows[lastRow]?.[j]);
      const cells = p.rows.slice(0, lastRow).map((row) => numericCell(row[j]));
      if (total === null || cells.some((c) => c === null)) continue;
      const sum = (cells as number[]).reduce((s, c) => s + c, 0);
      if (!near(sum, total)) {
        issues.push(`dataTable: column ${j + 1} totals ${total} but its cells sum to ${sum}`);
      }
    }
  }

  // The corner cell must agree with both margins, or the table has two
  // different grand totals and the question depends on which one is read.
  if (p.totals === 'both' && lastRow > 0 && lastCol > firstDataCol) {
    const grand = numericCell(p.rows[lastRow]?.[lastCol]);
    const rowTotals = p.rows.slice(0, lastRow).map((row) => numericCell(row[lastCol]));
    if (grand !== null && rowTotals.length && rowTotals.every((c) => c !== null)) {
      const sum = (rowTotals as number[]).reduce((s, c) => s + c, 0);
      if (!near(sum, grand)) {
        issues.push(`dataTable: the grand total is ${grand} but the row totals sum to ${sum}`);
      }
    }
  }
  return issues;
}
