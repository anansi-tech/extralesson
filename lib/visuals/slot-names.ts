/**
 * WHAT A BOX IS FOR, WHEN THE TABLE ALREADY SAYS SO.
 *
 * A table-completion part gives several boxes and no per-slot prompt, so the
 * card fell back to "first answer" / "second answer" — a positional label,
 * which is the one thing a label must never be. Validation let it pass because
 * the table "names" the slot: each blank cell prints a small (i) or (ii) key.
 *
 * That is not enough, and a real attempt proved it. In 0ab933 the suitable-beans
 * row runs PERCENTAGE then NUMBER, while the boxes below run (i) then (ii) —
 * number then percentage. A student filling the boxes in the order they read
 * the table put 88% into the box wanting 1 056 000. Both values were right and
 * both were marked wrong.
 *
 * The table already carries the answer: every answerable cell sits at a column
 * with a header, in a row with a row header. That pair names the box exactly,
 * and it is read from the declared params rather than guessed at.
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
    // The row's own name. Taken from the first column whenever it holds plain
    // text, NOT only when row_header_column is set: that flag decides whether
    // the cell renders as a th, and says nothing about whether the value names
    // the row. Half the completion tables in the bank leave it unset and still
    // open with "Cement bags", "Coconut", "Total bars".
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
