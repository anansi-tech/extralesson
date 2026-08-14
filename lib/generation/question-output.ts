const FORMAT_BY_VISUAL_TYPE: Readonly<Record<string, string>> = {
  'coordinate-grid': 'plot',
  'function-graph': 'plot',
  'transformation-grid': 'plot',
  'vector-diagram': 'plot',
  'geometry-figure': 'diagram',
  'measurement-figure': 'diagram',
  'bearing-diagram': 'diagram',
  'statistical-chart': 'chart',
  'data-table': 'table',
  'number-line': 'number-line',
  'set-diagram': 'set-diagram',
  'matrix-diagram': 'matrix',
  'mapping-diagram': 'mapping',
};

const OPTIONAL_LABEL_KEYS = new Set(['label', 'x_label', 'y_label']);

function removeEmptyOptionalLabels(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.reduce((changed, item) => removeEmptyOptionalLabels(item) || changed, false);
  }
  if (typeof value !== 'object' || value === null) return false;
  let changed = false;
  for (const [key, child] of Object.entries(value)) {
    if (OPTIONAL_LABEL_KEYS.has(key) && typeof child === 'string' && child.trim() === '') {
      delete (value as Record<string, unknown>)[key];
      changed = true;
    } else if (removeEmptyOptionalLabels(child)) {
      changed = true;
    }
  }
  return changed;
}

function padShortTableRows(visual: Record<string, unknown>): boolean {
  if (
    visual.format !== 'table' ||
    !Array.isArray(visual.headers) ||
    !Array.isArray(visual.rows)
  ) return false;
  let changed = false;
  for (const row of visual.rows) {
    if (!Array.isArray(row) || row.length >= visual.headers.length) continue;
    while (row.length < visual.headers.length) row.push('');
    changed = true;
  }
  return changed;
}

// Repair only redundant/optional presentation metadata before applying the
// same strict Zod boundary again. Mathematical coordinates and values are
// never rewritten.
export function repairQuestionOutput(text: string): string | null {
  try {
    const raw: unknown = JSON.parse(text);
    if (typeof raw !== 'object' || raw === null || !('visual' in raw)) return null;
    const visual = (raw as { visual?: unknown }).visual;
    if (typeof visual !== 'object' || visual === null) return null;
    let changed = removeEmptyOptionalLabels(visual);
    if (!('format' in visual)) {
      const visualType = (visual as { visual_type?: unknown }).visual_type;
      const format = typeof visualType === 'string' ? FORMAT_BY_VISUAL_TYPE[visualType] : undefined;
      if (format) {
        (visual as { format?: string }).format = format;
        changed = true;
      }
    }
    if (padShortTableRows(visual as Record<string, unknown>)) changed = true;
    return changed ? JSON.stringify(raw) : null;
  } catch {
    return null;
  }
}
