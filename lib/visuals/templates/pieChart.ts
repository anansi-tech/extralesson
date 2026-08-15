import { z } from 'zod';
import { INK, polar, round, svgOpen, text } from '../svg';
import type { VisualTemplate } from '../types';

// Pie chart with labeled sectors. `mode` fixes the value semantics:
// 'degrees' (sector angles), 'percent', or 'count' (raw frequencies; angles
// derived). Data usually lives ONLY in the chart, so sector values are not
// required to appear in the question text.
//
// A sector value may also be a simple linear expression in one unknown —
// "the angles are x, 2x, 3x and 90°; calculate x" is a standard paper 02
// item. The chart is still drawn to scale: the sum of all sectors gives one
// linear equation, which fixes the unknown, but each sector is LABELLED with
// the expression the student sees, not the solved number.

// Linear value a*<unknown> + b. `unknown` is null for a plain number.
export interface LinearValue {
  coefficient: number;
  constant: number;
  unknown: string | null;
}

// "2x+10" -> {2, 10}; "x" -> {1, 0}; "90" -> {0, 90}. Returns null when the
// text is not a simple linear expression in at most one unknown.
export function parseSectorValue(raw: number | string): LinearValue | null {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? { coefficient: 0, constant: raw, unknown: null } : null;
  }
  const s = raw.replace(/[\s$]/g, '').replace(/[−–—]/g, '-');
  if (s === '') return null;
  // Split into signed terms: "2x-5" -> ["2x", "-5"].
  const terms = s.match(/[+-]?[^+-]+/g);
  if (!terms) return null;
  let coefficient = 0;
  let constant = 0;
  let unknown: string | null = null;
  for (const term of terms) {
    const m = term.match(/^([+-]?)(\d+(?:\.\d+)?)?([a-zA-Z])?$/);
    if (!m) return null;
    const [, signRaw, numRaw, letter] = m;
    if (numRaw === undefined && letter === undefined) return null;
    const sign = signRaw === '-' ? -1 : 1;
    if (letter === undefined) {
      constant += sign * Number(numRaw);
    } else {
      if (unknown !== null && unknown !== letter) return null; // two unknowns
      unknown = letter;
      coefficient += sign * (numRaw === undefined ? 1 : Number(numRaw));
    }
  }
  return { coefficient, constant, unknown };
}

const SectorValueZ = z.union([
  z.number().positive().max(10000),
  z
    .string()
    .min(1)
    .max(20)
    .refine((s) => parseSectorValue(s) !== null, {
      message: 'must be a simple linear expression in one unknown, e.g. "x", "2x", "x + 10"',
    }),
]);

export const PieChartParamsZ = z.object({
  title: z.string().max(60).optional(),
  mode: z.enum(['degrees', 'percent', 'count']),
  sectors: z
    .array(
      z.object({
        label: z.string().min(1).max(24),
        value: SectorValueZ,
      }),
    )
    .min(2)
    .max(8),
});

export type PieChartParams = z.infer<typeof PieChartParamsZ>;
export type SectorValue = PieChartParams['sectors'][number]['value'];

const W = 640;
const H = 440;
const CX = 320;
const CY = 232;
const R = 140;

function isSymbolic(v: SectorValue): boolean {
  const parsed = parseSectorValue(v);
  return parsed !== null && parsed.unknown !== null;
}

function hasSymbolic(p: PieChartParams): boolean {
  return p.sectors.some((s) => isSymbolic(s.value));
}

// Total the sector values must reach, or null when the mode derives it.
function targetTotal(mode: PieChartParams['mode']): number | null {
  if (mode === 'degrees') return 360;
  if (mode === 'percent') return 100;
  return null;
}

// The value of the unknown implied by "all sectors total `target`", or null
// when there is no unique positive solution.
export function solveUnknown(p: PieChartParams): number | null {
  const target = targetTotal(p.mode);
  if (target === null) return null;
  const parsed = p.sectors.map((s) => parseSectorValue(s.value));
  if (parsed.some((v) => v === null)) return null;
  const values = parsed as LinearValue[];
  const sumCoef = values.reduce((acc, v) => acc + v.coefficient, 0);
  if (Math.abs(sumCoef) < 1e-9) return null;
  const sumConst = values.reduce((acc, v) => acc + v.constant, 0);
  return (target - sumConst) / sumCoef;
}

// Numeric value of each sector once any unknown is resolved; null when the
// chart cannot be resolved at all.
function resolvedValues(p: PieChartParams): number[] | null {
  const parsed = p.sectors.map((s) => parseSectorValue(s.value));
  if (parsed.some((v) => v === null)) return null;
  const values = parsed as LinearValue[];
  if (values.every((v) => v.unknown === null)) return values.map((v) => v.constant);
  const x = solveUnknown(p);
  if (x === null || !Number.isFinite(x)) return null;
  return values.map((v) => v.coefficient * x + v.constant);
}

function sectorAngles(p: PieChartParams): number[] {
  const values = resolvedValues(p);
  // A chart whose unknown has no solution is rejected by verify(); draw equal
  // sectors so a rejected draft still renders as a legible placeholder.
  if (!values) return p.sectors.map(() => 360 / p.sectors.length);
  if (p.mode === 'degrees') return values;
  if (p.mode === 'percent') return values.map((v) => v * 3.6);
  const total = values.reduce((acc, v) => acc + v, 0);
  return values.map((v) => (total > 0 ? (v / total) * 360 : 0));
}

// The sector is labelled with what the student is shown: the ORIGINAL
// expression for symbolic sectors, never the solved angle.
function valueLabel(mode: PieChartParams['mode'], value: SectorValue): string {
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
    'a sector value may instead be a STRING holding a simple linear expression in one unknown — "x", "2x", "x + 10", "2x-5", "90" — for the "the angles are x, 2x and 3x; calculate x" archetype',
    "symbolic sector values are allowed in degrees and percent mode only, never in count mode",
    "every symbolic sector must use the SAME single-letter unknown",
    "the equation 'all sectors total 360' (or 100 in percent mode) must have a single solution with x > 0, and every resulting sector value must be > 0",
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
    let total = '';
    if (p.mode === 'count') {
      const values = resolvedValues(p);
      if (values) total = ` Total count: ${values.reduce((acc, v) => acc + v, 0)}.`;
    }
    // Symbolic charts: state the equation the labels encode, and the resolved
    // angles when it has a solution, so the solve pass has the full figure.
    let solved = '';
    if (hasSymbolic(p)) {
      const target = targetTotal(p.mode);
      const x = solveUnknown(p);
      const values = resolvedValues(p);
      const letter =
        p.sectors.map((s) => parseSectorValue(s.value)?.unknown).find((u) => u != null) ?? 'x';
      if (target !== null) {
        solved += ` The sector values total ${target}${p.mode === 'degrees' ? '°' : '%'}.`;
      }
      if (x !== null && values) {
        const resolved = p.sectors
          .map((s, i) => `${s.label}: ${round(values[i])}${p.mode === 'degrees' ? '°' : '%'}`)
          .join(', ');
        solved += ` This gives ${letter} = ${round(x)}, so the sectors are ${resolved}.`;
      }
    }
    return `Pie chart${p.title ? ` titled "${p.title}"` : ''} showing ${unit} — ${data}.${total}${solved}`;
  },

  verify(p) {
    const issues: string[] = [];
    if (p.sectors.length < 2 || p.sectors.length > 8) {
      issues.push('pieChart: sector count must be between 2 and 8');
    }
    const labels = new Set(p.sectors.map((s) => s.label));
    if (labels.size !== p.sectors.length) issues.push('pieChart: duplicate sector labels');

    const parsed = p.sectors.map((s) => parseSectorValue(s.value));
    parsed.forEach((v, i) => {
      if (v === null) {
        issues.push(
          `pieChart: sector "${p.sectors[i].label}" value "${p.sectors[i].value}" is not a number or a simple linear expression in one unknown`,
        );
      }
    });
    if (parsed.some((v) => v === null)) return issues;
    const values = parsed as LinearValue[];

    const symbolic = values.filter((v) => v.unknown !== null);
    if (symbolic.length === 0) {
      // All numeric — the original exact-sum rules, unchanged.
      if (values.some((v) => !Number.isFinite(v.constant) || v.constant <= 0)) {
        issues.push('pieChart: sector values must be finite and positive');
      }
      const sum = values.reduce((acc, v) => acc + v.constant, 0);
      if (p.mode === 'degrees' && Math.abs(sum - 360) > 0.01) {
        issues.push(`pieChart: sector angles sum to ${sum}, expected 360`);
      }
      if (p.mode === 'percent' && Math.abs(sum - 100) > 0.01) {
        issues.push(`pieChart: percentages sum to ${sum}, expected 100`);
      }
      return issues;
    }

    const letters = new Set(symbolic.map((v) => v.unknown as string));
    if (letters.size > 1) {
      issues.push(
        `pieChart: symbolic sectors use more than one unknown (${[...letters].sort().join(', ')}); a pie chart gives only one equation`,
      );
      return issues;
    }
    const letter = [...letters][0];

    if (p.mode === 'count') {
      issues.push(
        'pieChart: symbolic sector values are not allowed in count mode — counts must be numbers',
      );
      return issues;
    }

    const target = targetTotal(p.mode) as number;
    const unitName = p.mode === 'degrees' ? 'angles' : 'percentages';
    const sumCoef = values.reduce((acc, v) => acc + v.coefficient, 0);
    if (Math.abs(sumCoef) < 1e-9) {
      issues.push(
        `pieChart: the unknown ${letter} cancels out of the total, so the sector ${unitName} cannot determine it`,
      );
      return issues;
    }
    const x = solveUnknown(p) as number;
    if (!(x > 0)) {
      issues.push(
        `pieChart: sector ${unitName} cannot sum to ${target} for any positive ${letter} (the equation gives ${letter} = ${round(x)})`,
      );
      return issues;
    }
    values.forEach((v, i) => {
      const resolved = v.coefficient * x + v.constant;
      if (!(resolved > 0)) {
        issues.push(
          `pieChart: sector "${p.sectors[i].label}" resolves to ${round(resolved)} at ${letter} = ${round(x)}; every sector must be positive`,
        );
      }
    });
    return issues;
  },
};
