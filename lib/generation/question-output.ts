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

// The visual type already determines the renderer format. Some structured
// outputs omit that redundant discriminator, so repair it deterministically
// before the same strict Zod boundary is applied again.
export function repairQuestionOutput(text: string): string | null {
  try {
    const raw: unknown = JSON.parse(text);
    if (typeof raw !== 'object' || raw === null || !('visual' in raw)) return null;
    const visual = (raw as { visual?: unknown }).visual;
    if (typeof visual !== 'object' || visual === null || 'format' in visual) return null;
    const visualType = (visual as { visual_type?: unknown }).visual_type;
    if (typeof visualType !== 'string') return null;
    const format = FORMAT_BY_VISUAL_TYPE[visualType];
    if (!format) return null;
    return JSON.stringify({
      ...raw,
      visual: { ...visual, format },
    });
  } catch {
    return null;
  }
}
