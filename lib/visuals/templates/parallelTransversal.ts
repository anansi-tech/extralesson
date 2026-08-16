import { z } from 'zod';
import { line, pathArc, polar, polygon, svgOpen, text } from '../svg';
import { valueStatedInText, type VisualTemplate } from '../types';

// Two horizontal parallel lines (marked with matching arrows) cut by one or
// two transversals. Angles are marked at intersection slots: line 'top' or
// 'bottom' picks the intersection, slot NE/NW/SW/SE picks the quadrant formed
// by the parallel line and the transversal (8 slots per transversal).

const SlotZ = z.enum(['NE', 'NW', 'SW', 'SE']);

export const ParallelTransversalParamsZ = z.object({
  transversals: z
    .array(
      z.object({
        // Angle the transversal makes with the parallel lines, measured
        // anticlockwise from the eastward direction (= the NE slot's measure).
        angleDeg: z.number().min(25).max(155),
      }),
    )
    .min(1)
    .max(2),
  angles: z
    .array(
      z.object({
        transversal: z.number().int().min(0).max(1),
        line: z.enum(['top', 'bottom']),
        slot: SlotZ,
        value: z.number().gt(0).lt(180).optional(), // degrees
        variable: z.string().max(8).optional(), // e.g. "y°"
      }),
    )
    .max(6)
    .default([]),
});

export type ParallelTransversalParams = z.infer<typeof ParallelTransversalParamsZ>;

const W = 640;
const H = 360;
const Y_TOP = 120;
const Y_BOT = 260;
const X_TOP = [230, 430]; // where each transversal crosses the top line

// Geometric measure of a slot's angle for a transversal at angleDeg.
function slotMeasure(angleDeg: number, slot: z.infer<typeof SlotZ>): number {
  return slot === 'NE' || slot === 'SW' ? angleDeg : 180 - angleDeg;
}

// Arc start (polar deg) and clockwise coverage for each slot.
function slotArc(theta: number, slot: z.infer<typeof SlotZ>): { start: number; cover: number } {
  switch (slot) {
    case 'NE':
      return { start: theta, cover: theta };
    case 'NW':
      return { start: 180, cover: 180 - theta };
    case 'SW':
      return { start: 180 + theta, cover: theta };
    case 'SE':
      return { start: 360, cover: 180 - theta };
  }
}

function intersection(t: number, which: 'top' | 'bottom', theta: number): [number, number] {
  const xTop = X_TOP[t];
  if (which === 'top') return [xTop, Y_TOP];
  const cot = Math.cos((theta * Math.PI) / 180) / Math.sin((theta * Math.PI) / 180);
  return [xTop - (Y_BOT - Y_TOP) * cot, Y_BOT];
}

const SLOT_WORDS: Record<z.infer<typeof SlotZ>, string> = {
  NE: 'north-east (above the line, east of the transversal)',
  NW: 'north-west (above the line, west of the transversal)',
  SW: 'south-west (below the line, west of the transversal)',
  SE: 'south-east (below the line, east of the transversal)',
};

export const parallelTransversal: VisualTemplate<ParallelTransversalParams> = {
  name: 'parallelTransversal',
  placesOwnPoints: true,
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    "angles may only reference declared transversals",
    "two marked angles in the same measure class must have equal values; angles in opposite classes must sum to 180",
  ],
  paramsSchema: ParallelTransversalParamsZ,

  render(p) {
    const parts: string[] = [svgOpen(W, H)];
    // parallel lines with matching direction arrows
    for (const y of [Y_TOP, Y_BOT]) {
      parts.push(line(30, y, 610, y));
      parts.push(
        polygon([[122, y], [110, y - 5], [110, y + 5]], true).replace('<polygon', '<polygon fill="#1E2430" stroke="none"'),
      );
    }
    // transversals
    p.transversals.forEach((tr, i) => {
      const theta = tr.angleDeg;
      const cot = Math.cos((theta * Math.PI) / 180) / Math.sin((theta * Math.PI) / 180);
      const xAt = (y: number) => X_TOP[i] + (Y_TOP - y) * cot;
      parts.push(line(xAt(Y_TOP - 55), Y_TOP - 55, xAt(Y_BOT + 55), Y_BOT + 55));
    });
    // marked angles
    for (const a of p.angles) {
      if (a.transversal >= p.transversals.length) continue;
      const theta = p.transversals[a.transversal].angleDeg;
      const [ix, iy] = intersection(a.transversal, a.line, theta);
      const { start, cover } = slotArc(theta, a.slot);
      parts.push(pathArc(ix, iy, 20, start, start - cover));
      const label = a.variable ?? (a.value !== undefined ? `${a.value}°` : undefined);
      if (label !== undefined) {
        const [lx, ly] = polar(ix, iy, 40, start - cover / 2);
        parts.push(text(lx, ly + 4, label, { size: 13 }));
      }
    }
    parts.push('</svg>');
    return parts.join('');
  },

  describe(p) {
    const n = p.transversals.length;
    const out: string[] = [
      `Two horizontal parallel lines (marked with matching arrows) are cut by ${n === 1 ? 'a transversal' : 'two transversals'}.`,
    ];
    for (const a of p.angles) {
      const shown = a.variable ?? (a.value !== undefined ? `${a.value}°` : null);
      if (!shown) continue;
      const which = n === 1 ? 'the transversal' : `transversal ${a.transversal + 1}`;
      out.push(
        `At the intersection of ${which} with the ${a.line} parallel line, the angle in the ${SLOT_WORDS[a.slot]} position is marked ${shown}.`,
      );
    }
    return out.join(' ');
  },

  verify(p, context) {
    const issues: string[] = [];
    for (const a of p.angles) {
      if (a.transversal >= p.transversals.length) {
        issues.push(`parallelTransversal: angle refers to transversal ${a.transversal + 1} but only ${p.transversals.length} exist`);
      }
      if (a.value !== undefined && !valueStatedInText(a.value, context)) {
        issues.push(`parallelTransversal: angle ${a.value}° never appears in the question text`);
      }
    }
    const numeric = p.angles.filter((a) => a.value !== undefined && a.transversal < p.transversals.length);
    for (let i = 0; i < numeric.length; i++) {
      for (let j = i + 1; j < numeric.length; j++) {
        const a = numeric[i];
        const b = numeric[j];
        if (a.transversal !== b.transversal) continue; // no forced relation
        const classA = a.slot === 'NE' || a.slot === 'SW';
        const classB = b.slot === 'NE' || b.slot === 'SW';
        const va = a.value as number;
        const vb = b.value as number;
        if (classA === classB) {
          if (Math.abs(va - vb) > 0.01) {
            issues.push(
              `parallelTransversal: angles ${va}° and ${vb}° must be equal (corresponding, alternate or vertically opposite)`,
            );
          }
        } else if (Math.abs(va + vb - 180) > 0.01) {
          issues.push(
            `parallelTransversal: angles ${va}° and ${vb}° must sum to 180° (co-interior or on a straight line)`,
          );
        }
      }
    }
    return issues;
  },
};
