import { z } from 'zod';
import { esc, line, meshDefs, meshRect, polygon, round, svgOpen, svgPlainLabel, text } from '../svg';
import { numbersInText, type VisualTemplate } from '../types';

// Distance-time or speed-time graph: a piecewise-linear journey through
// (t, v) points, with unit-labeled axes and optional dashed guide lines.
export const TravelGraphParamsZ = z.object({
  mode: z.enum(['distance-time', 'speed-time']),
  t_label: z.string().min(1).max(30).default('Time'),
  t_unit: z.string().min(1).max(12),
  v_label: z.string().min(1).max(30),
  v_unit: z.string().min(1).max(12),
  points: z
    .array(
      z.object({
        t: z.number().min(-10000).max(10000),
        v: z.number().min(-10000).max(10000),
      }),
    )
    .min(2)
    .max(10),
  guides: z
    .array(
      z.object({
        t: z.number().min(0).max(10000),
        v: z.number().min(0).max(10000),
        label: z.string().max(20).optional(),
      }),
    )
    .max(4)
    .default([]),
});

export type TravelGraphParams = z.infer<typeof TravelGraphParamsZ>;

const W = 640;
const H = 400;
const PAD_L = 70;
const PAD_R = 40;
const PAD_T = 40;
const PAD_B = 70;

export const travelGraph: VisualTemplate<TravelGraphParams> = {
  name: 'travelGraph',
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    "t values strictly ascending, no negative values",
    "a distance-time graph cannot jump vertically (no teleporting)",
    "if the text states a constant speed, some segment's slope must match it",
  ],
  paramsSchema: TravelGraphParamsZ,

  render(p) {
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;
    const tMax = Math.max(1e-9, ...p.points.map((pt) => pt.t), ...p.guides.map((g) => g.t));
    const vMax = Math.max(1e-9, ...p.points.map((pt) => pt.v), ...p.guides.map((g) => g.v));
    const X = (t: number) => PAD_L + (t / tMax) * plotW;
    const Y = (v: number) => PAD_T + plotH - (v / vMax) * plotH;

    const parts: string[] = [svgOpen(W, H)];
    // The paper's mesh: a velocity-time graph is read for distances (areas)
    // and accelerations (gradients), neither of which is fair on a bare plot.
    const tSpan = Math.max(...p.points.map((pt) => pt.t)) || 1;
    parts.push(meshDefs('travelMesh', plotW / Math.max(4, Math.min(12, tSpan))));
    parts.push(meshRect('travelMesh', PAD_L, PAD_T, plotW, plotH));
    // axes
    parts.push(line(PAD_L, PAD_T - 10, PAD_L, PAD_T + plotH));
    parts.push(line(PAD_L, PAD_T + plotH, PAD_L + plotW + 10, PAD_T + plotH));
    // ticks at each journey value (exam style: only the key values are marked)
    const tTicks = [...new Set([0, ...p.points.map((pt) => pt.t)])].sort((a, b) => a - b);
    const vTicks = [...new Set([0, ...p.points.map((pt) => pt.v)])].sort((a, b) => a - b);
    for (const t of tTicks) {
      parts.push(line(X(t), PAD_T + plotH, X(t), PAD_T + plotH + 5));
      parts.push(text(X(t), PAD_T + plotH + 20, String(t), { size: 11 }));
    }
    for (const v of vTicks) {
      parts.push(line(PAD_L - 5, Y(v), PAD_L, Y(v)));
      parts.push(text(PAD_L - 10, Y(v) + 4, String(v), { size: 11, anchor: 'end' }));
    }
    // dashed guides from the axes to each guide point
    for (const g of p.guides) {
      parts.push(line(X(g.t), PAD_T + plotH, X(g.t), Y(g.v), true));
      parts.push(line(PAD_L, Y(g.v), X(g.t), Y(g.v), true));
      if (g.label) parts.push(text(X(g.t) + 6, Y(g.v) - 6, g.label, { size: 12, anchor: 'start' }));
    }
    // the journey itself
    parts.push(polygon(p.points.map((pt) => [X(pt.t), Y(pt.v)] as [number, number]), false));
    // axis captions with units
    parts.push(text(PAD_L + plotW / 2, H - 20, `${p.t_label} (${p.t_unit})`, { size: 13 }));
    const yCap = `${p.v_label} (${p.v_unit})`;
    parts.push(
      `<text x="20" y="${round(PAD_T + plotH / 2)}" font-size="13" text-anchor="middle" fill="#1E2430" stroke="none" transform="rotate(-90 20 ${round(PAD_T + plotH / 2)})">${esc(svgPlainLabel(yCap))}</text>`,
    );
    parts.push('</svg>');
    return parts.join('');
  },

  describe(p) {
    const kind = p.mode === 'distance-time' ? 'Distance-time' : 'Speed-time';
    const pts = p.points.map((pt) => `(${pt.t}, ${pt.v})`).join(', ');
    const guides = p.guides.length
      ? ` Dashed guide lines mark ${p.guides
          .map((g) => `(${g.t}, ${g.v})${g.label ? ` labeled ${g.label}` : ''}`)
          .join('; ')}.`
      : '';
    return `${kind} graph. Horizontal axis: ${p.t_label} (${p.t_unit}); vertical axis: ${p.v_label} (${p.v_unit}). The journey is a series of straight-line segments through the points ${pts}.${guides}`;
  },

  verify(p, context) {
    const issues: string[] = [];
    for (let i = 1; i < p.points.length; i++) {
      const dt = p.points[i].t - p.points[i - 1].t;
      if (dt <= 0) {
        issues.push(
          `travelGraph: t values must be strictly ascending (t=${p.points[i - 1].t} then t=${p.points[i].t})`,
        );
      }
      if (p.mode === 'distance-time' && dt === 0 && p.points[i].v !== p.points[i - 1].v) {
        issues.push('travelGraph: vertical jump (teleport) in a distance-time graph');
      }
    }
    for (const pt of p.points) {
      if (pt.t < 0 || pt.v < 0) {
        issues.push(`travelGraph: point (${pt.t}, ${pt.v}) has a negative value`);
      }
    }
    if (p.mode === 'distance-time') {
      const slopes: number[] = [];
      for (let i = 1; i < p.points.length; i++) {
        const dt = p.points[i].t - p.points[i - 1].t;
        if (dt <= 0) continue;
        const slope = (p.points[i].v - p.points[i - 1].v) / dt;
        if (!Number.isFinite(slope)) {
          issues.push('travelGraph: non-finite speed implied by a segment');
          continue;
        }
        slopes.push(Math.abs(slope));
      }
      const allText = [context.stimulus ?? '', context.stem, ...context.partPrompts]
        .join(' ')
        .toLowerCase();
      if (allText.includes('constant speed') && slopes.length > 0) {
        const nums = numbersInText(context).filter((n) => n > 0);
        const matched = nums.some((n) => slopes.some((s) => Math.abs(s - n) <= 0.01 * n));
        if (!matched) {
          issues.push(
            'travelGraph: the text states a constant speed but no segment of the distance-time graph has that slope (within 1%)',
          );
        }
      }
    }
    return issues;
  },
};
