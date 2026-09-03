import { z } from 'zod';
import { circle, line, meshDefs, meshRect, plotMark, polygon, round, svgOpen, text, ticks } from '../svg';
import type { VisualTemplate } from '../types';

// A polyline through (upper class boundary, cumulative frequency) points. The
// data lives in the visual and need not appear in the question text.
export const CumulativeFrequencyParamsZ = z.object({
  title: z.string().max(60).optional(),
  x_label: z.string().max(40).optional(),
  y_label: z.string().max(40).optional(),
  x_step: z.number().positive().max(1000),
  y_step: z.number().positive().max(1000),
  // ROUND_1_8 §4.2 — the crosses without the curve through them.
  points_only: z.boolean().default(false),
  points: z
    .array(
      z.object({
        x: z.number().min(-100000).max(100000),
        cf: z.number().min(0).max(100000),
      }),
    )
    .min(3)
    .max(15),
  guides: z
    .array(
      z.object({
        label: z.string().min(1).max(20),
        x: z.number().min(-100000).max(100000),
        y: z.number().min(0).max(100000),
      }),
    )
    .max(3)
    .optional(),
});

export type CumulativeFrequencyParams = z.infer<typeof CumulativeFrequencyParamsZ>;

const W = 640;
const H = 420;
const PAD_L = 70;
const PAD_R = 30;
const PAD_T = 40;
const PAD_B = 70;

export const cumulativeFrequency: VisualTemplate<CumulativeFrequencyParams> = {
  name: 'cumulativeFrequency',
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    "x values must be strictly ascending",
    "cumulative frequencies must never decrease",
    "guide lines must fall inside the plotted data range",
  ],
  paramsSchema: CumulativeFrequencyParamsZ,

  render(p) {
    const parts: string[] = [svgOpen(W, H)];
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;
    const xsRaw = p.points.map((pt) => pt.x);
    const xMin = Math.floor(Math.min(...xsRaw) / p.x_step) * p.x_step;
    let xMax = Math.ceil(Math.max(...xsRaw) / p.x_step) * p.x_step;
    if (xMax <= xMin) xMax = xMin + p.x_step;
    const maxCf = Math.max(...p.points.map((pt) => pt.cf));
    const yMax = Math.ceil(maxCf / p.y_step) * p.y_step || p.y_step;
    const xFor = (v: number) => PAD_L + ((v - xMin) / (xMax - xMin)) * plotW;
    const yFor = (v: number) => PAD_T + plotH - (v / yMax) * plotH;

    if (p.title) parts.push(text(W / 2, 24, p.title, { size: 15 }));
    // The paper's mesh, under everything: reading "how many took at most 32
    // minutes" off an unruled plot is guesswork.
    const meshStep = plotW / Math.max(1, (xMax - xMin) / p.x_step);
    parts.push(meshDefs('cfMesh', meshStep));
    parts.push(meshRect('cfMesh', PAD_L, PAD_T, plotW, plotH));
    parts.push(line(PAD_L, PAD_T, PAD_L, PAD_T + plotH));
    parts.push(line(PAD_L, PAD_T + plotH, PAD_L + plotW, PAD_T + plotH));
    for (const t of ticks(0, yMax, p.y_step)) {
      const y = yFor(t);
      parts.push(line(PAD_L - 5, y, PAD_L, y));
      parts.push(text(PAD_L - 10, y + 4, String(t), { size: 11, anchor: 'end' }));
    }
    for (const t of ticks(xMin, xMax, p.x_step)) {
      const x = xFor(t);
      parts.push(line(x, PAD_T + plotH, x, PAD_T + plotH + 5));
      parts.push(text(x, PAD_T + plotH + 20, String(t), { size: 11 }));
    }
    for (const g of p.guides ?? []) {
      const gx = xFor(g.x);
      const gy = yFor(g.y);
      parts.push(line(PAD_L, gy, gx, gy, true));
      parts.push(line(gx, gy, gx, PAD_T + plotH, true));
      parts.push(text(PAD_L + 6, gy - 5, g.label, { size: 11, anchor: 'start' }));
    }
    // The papers sometimes print the crosses and leave the curve to the
    // candidate; medians, quartiles and "how many below" stay answerable.
    if (!p.points_only) {
      parts.push(polygon(p.points.map((pt) => [xFor(pt.x), yFor(pt.cf)] as [number, number]), false));
      for (const pt of p.points) parts.push(circle(xFor(pt.x), yFor(pt.cf), 3));
    } else {
      for (const pt of p.points) parts.push(plotMark(xFor(pt.x), yFor(pt.cf), 'cross'));
    }
    if (p.y_label) {
      parts.push(
        `<text x="16" y="${round(PAD_T + plotH / 2)}" font-size="12" text-anchor="middle" fill="#1E2430" stroke="none" transform="rotate(-90 16 ${round(PAD_T + plotH / 2)})">${p.y_label}</text>`,
      );
    }
    if (p.x_label) parts.push(text(PAD_L + plotW / 2, H - 16, p.x_label, { size: 12 }));
    parts.push('</svg>');
    return parts.join('');
  },

  describe(p) {
    const data = p.points.map((pt) => `(${pt.x}, ${pt.cf})`).join(', ');
    const guides = (p.guides ?? [])
      .map((g) => `${g.label} at x = ${g.x}, cumulative frequency = ${g.y}`)
      .join('; ');
    return `Cumulative frequency curve (ogive)${p.title ? ` titled "${p.title}"` : ''}${
      p.x_label ? ` (x-axis: ${p.x_label})` : ''
    }${
      p.y_label ? ` (y-axis: ${p.y_label})` : ''
    } through the points (upper class boundary, cumulative frequency): ${data}.${
      guides ? ` Dashed guide lines — ${guides}.` : ''
    }`;
  },

  verify(p) {
    const issues: string[] = [];
    for (let i = 1; i < p.points.length; i++) {
      if (!(p.points[i].x > p.points[i - 1].x)) {
        issues.push('cumulativeFrequency: x values must be strictly ascending');
        break;
      }
    }
    for (let i = 1; i < p.points.length; i++) {
      if (p.points[i].cf < p.points[i - 1].cf) {
        issues.push('cumulativeFrequency: cumulative frequencies must be non-decreasing');
        break;
      }
    }
    const xMin = Math.min(...p.points.map((pt) => pt.x));
    const xMax = Math.max(...p.points.map((pt) => pt.x));
    const maxCf = Math.max(...p.points.map((pt) => pt.cf));
    for (const g of p.guides ?? []) {
      if (g.x < xMin || g.x > xMax) {
        issues.push(`cumulativeFrequency: guide "${g.label}" x=${g.x} is outside the data range`);
      }
      if (g.y > maxCf) {
        issues.push(
          `cumulativeFrequency: guide "${g.label}" y=${g.y} exceeds the maximum cumulative frequency ${maxCf}`,
        );
      }
    }
    return issues;
  },
};
