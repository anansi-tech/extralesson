import { z } from 'zod';
import { INK, polar, round, svgOpen, text } from '../svg';
import type { VisualTemplate } from '../types';

// Pie chart with labeled sectors. `mode` fixes the value semantics:
// 'degrees' (sector angles), 'percent', or 'count' (raw frequencies; angles
// derived). Data usually lives ONLY in the chart, so sector values are not
// required to appear in the question text.
export const PieChartParamsZ = z.object({
  title: z.string().max(60).optional(),
  mode: z.enum(['degrees', 'percent', 'count']),
  sectors: z
    .array(
      z.object({
        label: z.string().min(1).max(24),
        value: z.number().positive().max(10000),
      }),
    )
    .min(2)
    .max(8),
});

export type PieChartParams = z.infer<typeof PieChartParamsZ>;

const W = 640;
const H = 440;
const CX = 320;
const CY = 232;
const R = 140;

function sectorAngles(p: PieChartParams): number[] {
  if (p.mode === 'degrees') return p.sectors.map((s) => s.value);
  if (p.mode === 'percent') return p.sectors.map((s) => s.value * 3.6);
  const total = p.sectors.reduce((acc, s) => acc + s.value, 0);
  return p.sectors.map((s) => (total > 0 ? (s.value / total) * 360 : 0));
}

function valueLabel(mode: PieChartParams['mode'], value: number): string {
  if (mode === 'degrees') return `${value}°`;
  if (mode === 'percent') return `${value}%`;
  return String(value);
}

export const pieChart: VisualTemplate<PieChartParams> = {
  name: 'pieChart',
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    "2-8 sectors with unique labels and positive values",
    "in degrees mode the sectors must sum to exactly 360; in percent mode to exactly 100",
  ],
  paramsSchema: PieChartParamsZ,

  render(p) {
    const parts: string[] = [svgOpen(W, H)];
    // Light monochrome hatching for alternating sectors (still black-line).
    parts.push(
      `<defs><pattern id="pieHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${INK}" stroke-width="0.5" /></pattern></defs>`,
    );
    if (p.title) parts.push(text(W / 2, 24, p.title, { size: 15 }));

    const angles = sectorAngles(p);
    let cum = 0;
    p.sectors.forEach((s, i) => {
      const a0 = 90 - cum; // clockwise from the top
      const a1 = 90 - (cum + angles[i]);
      const st = polar(CX, CY, R, a0);
      const en = polar(CX, CY, R, a1);
      const large = angles[i] > 180 ? 1 : 0;
      const fill = i % 2 === 1 ? 'url(#pieHatch)' : 'none';
      parts.push(
        `<path d="M ${CX} ${CY} L ${round(st[0])} ${round(st[1])} A ${R} ${R} 0 ${large} 1 ${round(
          en[0],
        )} ${round(en[1])} Z" fill="${fill}" />`,
      );
      // Sector + value labels outside, near the mid-angle.
      const mid = 90 - (cum + angles[i] / 2);
      const lp = polar(CX, CY, R + 22, mid);
      const dx = Math.cos((mid * Math.PI) / 180);
      const anchor = dx > 0.3 ? 'start' : dx < -0.3 ? 'end' : 'middle';
      parts.push(text(lp[0], lp[1], s.label, { size: 12, anchor }));
      parts.push(text(lp[0], lp[1] + 15, valueLabel(p.mode, s.value), { size: 12, anchor }));
      cum += angles[i];
    });
    parts.push('</svg>');
    return parts.join('');
  },

  describe(p) {
    const unit =
      p.mode === 'degrees' ? 'sector angles' : p.mode === 'percent' ? 'percentages' : 'counts';
    const data = p.sectors.map((s) => `${s.label}: ${valueLabel(p.mode, s.value)}`).join(', ');
    const total =
      p.mode === 'count'
        ? ` Total count: ${p.sectors.reduce((acc, s) => acc + s.value, 0)}.`
        : '';
    return `Pie chart${p.title ? ` titled "${p.title}"` : ''} showing ${unit} — ${data}.${total}`;
  },

  verify(p) {
    const issues: string[] = [];
    if (p.sectors.length < 2 || p.sectors.length > 8) {
      issues.push('pieChart: sector count must be between 2 and 8');
    }
    const labels = new Set(p.sectors.map((s) => s.label));
    if (labels.size !== p.sectors.length) issues.push('pieChart: duplicate sector labels');
    if (p.sectors.some((s) => !Number.isFinite(s.value) || s.value <= 0)) {
      issues.push('pieChart: sector values must be finite and positive');
    }
    const sum = p.sectors.reduce((acc, s) => acc + s.value, 0);
    if (p.mode === 'degrees' && Math.abs(sum - 360) > 0.01) {
      issues.push(`pieChart: sector angles sum to ${sum}, expected 360`);
    }
    if (p.mode === 'percent' && Math.abs(sum - 100) > 0.01) {
      issues.push(`pieChart: percentages sum to ${sum}, expected 100`);
    }
    return issues;
  },
};
