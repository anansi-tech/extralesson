/**
 * WHAT A BOX IS FOR, WHEN THE TABLE ALREADY SAYS SO. A positional label is the
 * one thing a label must never be: two right answers were marked wrong when a
 * table's row order disagreed with its keys. Header pairs name a cell exactly.
 */
interface TableCell {
  slots?: unknown;
}

interface TableParams {
  headers?: unknown;
  rows?: unknown[][];
  row_header_column?: boolean;
}

/** Slot ref → the cell it fills, as "Suitable beans · Percentage". */
export function slotCellNames(visual: unknown): Map<string, string> {
  const names = new Map<string, string>();
  const v = visual as { template?: string; params?: TableParams } | undefined;
  if (v?.template !== 'dataTable') return names;

  const headers = Array.isArray(v.params?.headers) ? (v.params.headers as string[]) : [];
  const rows = v.params?.rows ?? [];

  for (const row of rows) {
    // From the first column whenever it holds plain text, NOT only when
    // row_header_column is set: that flag decides how the cell renders and says
    // nothing about whether the value names the row. Half the tables leave it
    // unset and still open with "Cement bags", "Coconut", "Total bars".
    const rowName = typeof row?.[0] === 'string' ? (row[0] as string).trim() : '';
    for (const [col, cell] of (row ?? []).entries()) {
      const slots = (cell as TableCell)?.slots;
      if (!Array.isArray(slots)) continue;
      const columnName = typeof headers[col] === 'string' ? headers[col].trim() : '';
      // A cell in the first column IS the row name; pairing it with itself
      // would read "Cement bags · Item".
      const rowPart = col === 0 ? '' : rowName;
      // A scaffolded cell holds several slots in one cell; they share its name
      // and are told apart by their position within the printed skeleton.
      for (const [i, ref] of slots.entries()) {
        if (typeof ref !== 'string') continue;
        const parts = [rowPart, columnName].filter(Boolean);
        if (parts.length === 0) continue;
        const suffix = slots.length > 1 ? ` (${i + 1})` : '';
        names.set(ref, parts.join(' · ') + suffix);
      }
    }
  }
  return names;
}
