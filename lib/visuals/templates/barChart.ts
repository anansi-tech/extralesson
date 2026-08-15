import { z } from 'zod';
import { line, round, svgOpen, text, ticks } from '../svg';
import type { VisualTemplate } from '../types';

// Vertical bar chart. Data usually lives ONLY in the chart (the student reads
// it off), so bar values are not required to appear in the question text.
export const BarChartParamsZ = z.object({
  title: z.string().max(60).optional(),
  x_label: z.string().max(40).optional(),
  y_label: z.string().max(40).optional(),
  y_step: z.number().positive().max(1000),
  bars: z
    .array(
      z.object({
        label: z.string().min(1).max(20),
        value: z.number().min(0).max(10000),
      }),
    )
    .min(2)
    .max(10),
});

export type BarChartParams = z.infer<typeof BarChartParamsZ>;

const W = 640;
const H = 400;
const PAD_L = 70;
const PAD_R = 30;
const PAD_T = 40;
const PAD_B = 70;

export const barChart: VisualTemplate<BarChartParams> = {
  name: 'barChart',
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    "bar labels must be unique",
    "choose y_step so the data spans at most ~20 gridlines",
  ],
  paramsSchema: BarChartParamsZ,

  render(p) {
    const parts: string[] = [svgOpen(W, H)];
    const maxVal = Math.max(...p.bars.map((b) => b.value));
    const yMax = Math.ceil(maxVal / p.y_step) * p.y_step || p.y_step;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;
    const yFor = (v: number) => PAD_T + plotH - (v / yMax) * plotH;

    if (p.title) parts.push(text(W / 2, 24, p.title, { size: 15 }));
    // axes
    parts.push(line(PAD_L, PAD_T, PAD_L, PAD_T + plotH));
    parts.push(line(PAD_L, PAD_T + plotH, PAD_L + plotW, PAD_T + plotH));
    for (const t of ticks(0, yMax, p.y_step)) {
      const y = yFor(t);
      parts.push(line(PAD_L - 5, y, PAD_L, y));
      parts.push(text(PAD_L - 10, y + 4, String(t), { size: 11, anchor: 'end' }));
      if (t > 0) parts.push(line(PAD_L, y, PAD_L + plotW, y, true));
    }
    const slot = plotW / p.bars.length;
    const barW = slot * 0.55;
    p.bars.forEach((b, i) => {
      const x = PAD_L + slot * i + (slot - barW) / 2;
      const y = yFor(b.value);
      parts.push(
        `<rect x="${round(x)}" y="${round(y)}" width="${round(barW)}" height="${round(
          PAD_T + plotH - y,
        )}" fill="none" />`,
      );
      parts.push(text(x + barW / 2, PAD_T + plotH + 20, b.label, { size: 12 }));
    });
    if (p.y_label) {
      parts.push(
        `<text x="16" y="${PAD_T + plotH / 2}" font-size="12" text-anchor="middle" fill="#1E2430" stroke="none" transform="rotate(-90 16 ${PAD_T + plotH / 2})">${p.y_label}</text>`,
      );
    }
    if (p.x_label) parts.push(text(PAD_L + plotW / 2, H - 16, p.x_label, { size: 12 }));
    parts.push('</svg>');
    return parts.join('');
  },

  describe(p) {
    const data = p.bars.map((b) => `${b.label}: ${b.value}`).join(', ');
    return `Bar chart${p.title ? ` titled "${p.title}"` : ''}${
      p.y_label ? ` (y-axis: ${p.y_label})` : ''
    } with values — ${data}.`;
  },

  verify(p) {
    const issues: string[] = [];
    const labels = new Set(p.bars.map((b) => b.label));
    if (labels.size !== p.bars.length) issues.push('barChart: duplicate bar labels');
    const maxVal = Math.max(...p.bars.map((b) => b.value));
    if (maxVal === 0) issues.push('barChart: all bars are zero');
    if (maxVal / p.y_step > 20) issues.push('barChart: y_step too small for the data range');
    if (p.bars.some((b) => !Number.isFinite(b.value))) issues.push('barChart: non-finite value');
    return issues;
  },
};
