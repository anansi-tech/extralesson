import { z } from 'zod';
import { line, round, svgOpen, text, ticks } from '../svg';
import type { VisualTemplate } from '../types';

// Histogram: contiguous class intervals (touching bars — unlike barChart).
// `boundaries` are the class boundaries in ascending order (equal or unequal
// widths); `frequencies[i]` belongs to [boundaries[i], boundaries[i+1]).
// Data lives in the visual; values need not appear in the question text.
export const HistogramParamsZ = z.object({
  title: z.string().max(60).optional(),
  x_label: z.string().max(40).optional(),
  y_label: z.string().max(40).optional(),
  y_step: z.number().positive().max(1000),
  boundaries: z.array(z.number().min(-100000).max(100000)).min(4).max(13),
  frequencies: z.array(z.number().min(0).max(10000)).min(3).max(12),
});

export type HistogramParams = z.infer<typeof HistogramParamsZ>;

const W = 640;
const H = 400;
const PAD_L = 70;
const PAD_R = 30;
const PAD_T = 40;
const PAD_B = 70;

export const histogram: VisualTemplate<HistogramParams> = {
  name: 'histogram',
  paramsSchema: HistogramParamsZ,

  render(p) {
    const parts: string[] = [svgOpen(W, H)];
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;
    const x0 = p.boundaries[0];
    const x1 = p.boundaries[p.boundaries.length - 1];
    const maxVal = Math.max(...p.frequencies);
    const yMax = Math.ceil(maxVal / p.y_step) * p.y_step || p.y_step;
    const xFor = (v: number) => PAD_L + ((v - x0) / (x1 - x0)) * plotW;
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
    // boundary ticks along the x-axis
    for (const b of p.boundaries) {
      const x = xFor(b);
      parts.push(line(x, PAD_T + plotH, x, PAD_T + plotH + 5));
      parts.push(text(x, PAD_T + plotH + 20, String(b), { size: 11 }));
    }
    // contiguous bars
    p.frequencies.forEach((f, i) => {
      if (f <= 0) return;
      const xa = xFor(p.boundaries[i]);
      const xb = xFor(p.boundaries[i + 1]);
      const y = yFor(f);
      parts.push(
        `<rect x="${round(xa)}" y="${round(y)}" width="${round(xb - xa)}" height="${round(
          PAD_T + plotH - y,
        )}" fill="none" />`,
      );
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
    const classes = p.frequencies
      .map((f, i) => `${p.boundaries[i]}–${p.boundaries[i + 1]}: ${f}`)
      .join(', ');
    return `Histogram${p.title ? ` titled "${p.title}"` : ''}${
      p.x_label ? ` (x-axis: ${p.x_label})` : ''
    }${p.y_label ? ` (y-axis: ${p.y_label})` : ''} with class boundaries ${p.boundaries.join(
      ', ',
    )} and frequencies per class — ${classes}.`;
  },

  verify(p) {
    const issues: string[] = [];
    if (p.boundaries.length !== p.frequencies.length + 1) {
      issues.push(
        `histogram: ${p.boundaries.length} boundaries with ${p.frequencies.length} frequencies (need boundaries = frequencies + 1)`,
      );
    }
    if (p.frequencies.length < 3) issues.push('histogram: at least 3 classes required');
    for (let i = 1; i < p.boundaries.length; i++) {
      if (!(p.boundaries[i] > p.boundaries[i - 1])) {
        issues.push('histogram: class boundaries must be strictly ascending');
        break;
      }
    }
    if (p.frequencies.some((f) => !Number.isFinite(f) || f < 0)) {
      issues.push('histogram: frequencies must be finite and non-negative');
    }
    return issues;
  },
};
