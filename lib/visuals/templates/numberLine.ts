import { z } from 'zod';
import { line, polygon, round, svgOpen, text, ticks } from '../svg';
import { valueStatedInText, type VisualTemplate } from '../types';

export const NumberLineParamsZ = z.object({
  // Not integers: an inequality line from -2.5 to 2.5 is ordinary, and `step`
  // already carries the tick spacing.
  min: z.number().min(-100).max(100),
  max: z.number().min(-100).max(100),
  step: z.number().positive().max(50).default(1),
  points: z
    .array(
      z.object({
        value: z.number(),
        label: z.string().max(12).optional(),
        filled: z.boolean().default(true), // open circle = strict inequality
      }),
    )
    .max(8)
    .default([]),
  // Optional highlighted interval; null bound = ray to infinity.
  interval: z
    .object({
      from: z.number().nullable(),
      to: z.number().nullable(),
    })
    .optional(),
});

export type NumberLineParams = z.infer<typeof NumberLineParamsZ>;

const W = 640;
const H = 120;
const PAD = 40;
const Y = 70;

function xFor(v: number, min: number, max: number): number {
  return PAD + ((v - min) / (max - min)) * (W - 2 * PAD);
}

export const numberLine: VisualTemplate<NumberLineParams> = {
  name: 'numberLine',
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    "min must be less than max and points must lie within [min, max]",
    "keep (max - min) / step under ~60 so the ticks stay readable",
    "an interval's from must be less than its to",
  ],
  paramsSchema: NumberLineParamsZ,

  render(p) {
    const parts: string[] = [svgOpen(W, H)];
    parts.push(line(PAD - 14, Y, W - PAD + 14, Y));
    parts.push(polygon([[W - PAD + 20, Y], [W - PAD + 10, Y - 4], [W - PAD + 10, Y + 4]], true));
    parts.push(polygon([[PAD - 20, Y], [PAD - 10, Y - 4], [PAD - 10, Y + 4]], true));
    for (const t of ticks(p.min, p.max, p.step)) {
      const x = xFor(t, p.min, p.max);
      parts.push(line(x, Y - 6, x, Y + 6));
      parts.push(text(x, Y + 24, String(t), { size: 12 }));
    }
    if (p.interval) {
      const from = p.interval.from ?? p.min - 1;
      const to = p.interval.to ?? p.max + 1;
      const x1 = Math.max(PAD - 14, xFor(from, p.min, p.max));
      const x2 = Math.min(W - PAD + 14, xFor(to, p.min, p.max));
      parts.push(
        `<line x1="${round(x1)}" y1="${Y - 16}" x2="${round(x2)}" y2="${Y - 16}" stroke-width="4" />`,
      );
    }
    for (const pt of p.points) {
      const x = xFor(pt.value, p.min, p.max);
      parts.push(
        `<circle cx="${round(x)}" cy="${Y}" r="5" ${pt.filled ? 'fill="#1E2430"' : 'fill="white"'} />`,
      );
      if (pt.label) parts.push(text(x, Y - 26, pt.label, { size: 13 }));
    }
    parts.push('</svg>');
    return parts.join('');
  },

  describe(p) {
    const pts = p.points
      .map((pt) => `${pt.filled ? 'filled' : 'open'} point at ${pt.value}${pt.label ? ` labeled ${pt.label}` : ''}`)
      .join('; ');
    const interval = p.interval
      ? `highlighted interval from ${p.interval.from ?? '-infinity'} to ${p.interval.to ?? 'infinity'}`
      : '';
    return `Number line from ${p.min} to ${p.max} in steps of ${p.step}. ${pts}${pts && interval ? '. ' : ''}${interval}`.trim();
  },

  verify(p, context) {
    const issues: string[] = [];
    if (p.min >= p.max) issues.push('numberLine: min must be less than max');
    if ((p.max - p.min) / p.step > 60) issues.push('numberLine: too many ticks to read');
    for (const pt of p.points) {
      if (pt.value < p.min || pt.value > p.max) {
        issues.push(`numberLine: point ${pt.value} outside [${p.min}, ${p.max}]`);
      }
      // Given values shown on the line should be stated in the question text
      // (integers of magnitude > 1 only — small bounds appear incidentally).
      if (Math.abs(pt.value) > 1 && !valueStatedInText(pt.value, context)) {
        issues.push(`numberLine: point ${pt.value} never appears in the question text`);
      }
    }
    if (p.interval) {
      const { from, to } = p.interval;
      if (from !== null && to !== null && from >= to) {
        issues.push('numberLine: interval from must be less than to');
      }
    }
    return issues;
  },
};
