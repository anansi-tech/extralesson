import { z } from 'zod';
import { hatchDefs, hatchFill, INK, line, pathArc, polar, polygon, round, svgOpen, text } from '../svg';
import { valueStatedInText, type VisualTemplate } from '../types';

// Compound plane figures and simple solids with dimension arrows. 3-D shapes
// use an oblique projection (receding edges at 32°, foreshortened) with
// dashed hidden edges.

const PosZ = z.number().positive().max(100000);
const UnitZ = z.enum(['cm', 'm', 'mm']);

export const CompositeShapeParamsZ = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('rect-plus-semicircle'),
    width: PosZ,
    height: PosZ,
    unit: UnitZ,
    // R1.6 §6: "find the area of the shaded region" needs the region shaded.
    shaded: z.boolean().default(false),
  }),
  z.object({
    kind: z.literal('rect-minus-rect'),
    outerWidth: PosZ,
    outerHeight: PosZ,
    innerWidth: PosZ,
    innerHeight: PosZ,
    unit: UnitZ,
    shaded: z.boolean().default(false),
  }),
  z.object({ kind: z.literal('l-shape'), width: PosZ, height: PosZ, cutWidth: PosZ, cutHeight: PosZ, unit: UnitZ }),
  z.object({ kind: z.literal('cuboid'), length: PosZ, width: PosZ, height: PosZ, unit: UnitZ }),
  z.object({ kind: z.literal('cylinder'), radius: PosZ, height: PosZ, unit: UnitZ }),
  z.object({ kind: z.literal('triangular-prism'), base: PosZ, height: PosZ, length: PosZ, unit: UnitZ }),
]);

export type CompositeShapeParams = z.infer<typeof CompositeShapeParamsZ>;

const W = 640;
const H = 430;
const OBLIQUE_K = 0.55; // foreshortening of receding edges
const OBLIQUE_DEG = 32;
const OB_COS = Math.cos((OBLIQUE_DEG * Math.PI) / 180) * OBLIQUE_K;
const OB_SIN = Math.sin((OBLIQUE_DEG * Math.PI) / 180) * OBLIQUE_K;

function arrowHead(x: number, y: number, deg: number): string {
  const a = polar(x, y, 9, deg + 163);
  const b = polar(x, y, 9, deg - 163);
  return `<polygon points="${round(x)},${round(y)} ${round(a[0])},${round(a[1])} ${round(b[0])},${round(b[1])}" fill="${INK}" stroke="none" />`;
}

// Double-headed dimension arrow with a label offset from the midpoint.
function dimSeg(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string,
  lox: number,
  loy: number,
  anchor: 'start' | 'middle' | 'end' = 'middle',
): string {
  const deg = (Math.atan2(y1 - y2, x2 - x1) * 180) / Math.PI;
  return [
    line(x1, y1, x2, y2),
    arrowHead(x1, y1, deg + 180),
    arrowHead(x2, y2, deg),
    text((x1 + x2) / 2 + lox, (y1 + y2) / 2 + loy, label, { size: 13, anchor }),
  ].join('');
}

function dimH(x1: number, x2: number, y: number, label: string, above = false): string {
  return dimSeg(x1, y, x2, y, label, 0, above ? -8 : 18);
}

function dimV(x: number, y1: number, y2: number, label: string, side: 'left' | 'right' = 'left'): string {
  return dimSeg(x, y1, x, y2, label, side === 'left' ? -10 : 10, 4, side === 'left' ? 'end' : 'start');
}

function fmt(v: number, unit: string): string {
  return `${v} ${unit}`;
}

// Named dimensions of a shape, for verify() and describe().
function dimensions(p: CompositeShapeParams): [string, number][] {
  switch (p.kind) {
    case 'rect-plus-semicircle':
      return [['width', p.width], ['height', p.height]];
    case 'rect-minus-rect':
      return [
        ['outer width', p.outerWidth],
        ['outer height', p.outerHeight],
        ['inner width', p.innerWidth],
        ['inner height', p.innerHeight],
      ];
    case 'l-shape':
      return [['width', p.width], ['height', p.height], ['cut width', p.cutWidth], ['cut height', p.cutHeight]];
    case 'cuboid':
      return [['length', p.length], ['width', p.width], ['height', p.height]];
    case 'cylinder':
      return [['radius', p.radius], ['height', p.height]];
    case 'triangular-prism':
      return [['base', p.base], ['height', p.height], ['length', p.length]];
  }
}

export const compositeShape: VisualTemplate<CompositeShapeParams> = {
  name: 'compositeShape',
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    "every dimension must be positive",
    "an inner rectangle must fit strictly inside the outer one",
    "a cut rectangle must be strictly smaller than the main rectangle",
    "shaded: true hatches the region the question asks about — the semicircle on a rect-plus-semicircle, and the material left between the rectangles on a rect-minus-rect; set it whenever the question says \"shaded\"",
  ],
  paramsSchema: CompositeShapeParamsZ,

  render(p) {
    const parts: string[] = [svgOpen(W, H)];
    const u = p.unit;
    const shaded = 'shaded' in p && p.shaded;
    if (shaded) parts.push(hatchDefs('shapeHatch'));

    if (p.kind === 'rect-plus-semicircle') {
      const s = Math.min(420 / p.width, 280 / (p.height + p.width / 2));
      const rw = p.width * s;
      const rh = p.height * s;
      const r = rw / 2;
      const x0 = (W - rw) / 2;
      const yTop = (H - (rh + r)) / 2 + r; // top edge of the rectangle
      const yBot = yTop + rh;
      parts.push(line(x0, yTop, x0, yBot));
      parts.push(line(x0 + rw, yTop, x0 + rw, yBot));
      parts.push(line(x0, yBot, x0 + rw, yBot));
      if (shaded) {
        // the half-disc only: the shaded region in "rectangle topped by a semicircle"
        parts.push(
          `<path d="M ${round(x0)} ${round(yTop)} A ${round(r)} ${round(r)} 0 0 1 ${round(x0 + rw)} ${round(yTop)} Z" fill="${hatchFill('shapeHatch')}" stroke="none" />`,
        );
      }
      parts.push(line(x0, yTop, x0 + rw, yTop, true)); // diameter (dashed)
      parts.push(pathArc(x0 + r, yTop, r, 180, 0)); // semicircle on top
      parts.push(dimH(x0, x0 + rw, yBot + 26, fmt(p.width, u)));
      parts.push(dimV(x0 - 26, yTop, yBot, fmt(p.height, u)));
    } else if (p.kind === 'rect-minus-rect') {
      const s = Math.min(440 / p.outerWidth, 280 / p.outerHeight);
      const ow = p.outerWidth * s;
      const oh = p.outerHeight * s;
      const x0 = (W - ow) / 2;
      const y0 = (H - oh) / 2;
      const iw = p.innerWidth * s;
      const ih = p.innerHeight * s;
      const ix = x0 + (ow - iw) / 2;
      const iy = y0 + (oh - ih) / 2;
      if (shaded) {
        // even-odd fill leaves the removed rectangle clear, so the hatch shows
        // exactly the material whose area the question asks for
        const outer = `M ${round(x0)} ${round(y0)} H ${round(x0 + ow)} V ${round(y0 + oh)} H ${round(x0)} Z`;
        const inner = `M ${round(ix)} ${round(iy)} H ${round(ix + iw)} V ${round(iy + ih)} H ${round(ix)} Z`;
        parts.push(
          `<path d="${outer} ${inner}" fill-rule="evenodd" fill="${hatchFill('shapeHatch')}" stroke="none" />`,
        );
      }
      parts.push(polygon([[x0, y0], [x0 + ow, y0], [x0 + ow, y0 + oh], [x0, y0 + oh]], true));
      parts.push(polygon([[ix, iy], [ix + iw, iy], [ix + iw, iy + ih], [ix, iy + ih]], true));
      parts.push(dimH(x0, x0 + ow, y0 + oh + 26, fmt(p.outerWidth, u)));
      parts.push(dimV(x0 - 26, y0, y0 + oh, fmt(p.outerHeight, u)));
      parts.push(dimH(ix, ix + iw, iy + 20, fmt(p.innerWidth, u)));
      parts.push(dimV(ix + iw - 22, iy, iy + ih, fmt(p.innerHeight, u), 'right'));
    } else if (p.kind === 'l-shape') {
      const s = Math.min(440 / p.width, 280 / p.height);
      const w = p.width * s;
      const h = p.height * s;
      const cw = Math.min(p.cutWidth, p.width) * s;
      const ch = Math.min(p.cutHeight, p.height) * s;
      const x0 = (W - w) / 2;
      const y0 = (H - h) / 2;
      parts.push(
        polygon(
          [
            [x0, y0],
            [x0 + w - cw, y0],
            [x0 + w - cw, y0 + ch],
            [x0 + w, y0 + ch],
            [x0 + w, y0 + h],
            [x0, y0 + h],
          ],
          true,
        ),
      );
      parts.push(dimH(x0, x0 + w, y0 + h + 26, fmt(p.width, u)));
      parts.push(dimV(x0 - 26, y0, y0 + h, fmt(p.height, u)));
      parts.push(dimH(x0 + w - cw, x0 + w, y0 + ch - 14, fmt(p.cutWidth, u), true));
      parts.push(dimV(x0 + w - cw + 16, y0, y0 + ch, fmt(p.cutHeight, u), 'right'));
    } else if (p.kind === 'cuboid') {
      const ox0 = p.width * OB_COS;
      const oy0 = p.width * OB_SIN;
      const s = Math.min(420 / (p.length + ox0), 250 / (p.height + oy0));
      const fl = p.length * s;
      const fh = p.height * s;
      const ox = ox0 * s;
      const oy = oy0 * s;
      const x0 = (W - (fl + ox)) / 2;
      const yT = (H - (fh + oy)) / 2 + oy; // front top edge
      const yB = yT + fh;
      // solid edges
      parts.push(polygon([[x0, yT], [x0 + fl, yT], [x0 + fl, yB], [x0, yB]], true));
      parts.push(line(x0, yT, x0 + ox, yT - oy));
      parts.push(line(x0 + fl, yT, x0 + fl + ox, yT - oy));
      parts.push(line(x0 + fl, yB, x0 + fl + ox, yB - oy));
      parts.push(line(x0 + ox, yT - oy, x0 + fl + ox, yT - oy));
      parts.push(line(x0 + fl + ox, yT - oy, x0 + fl + ox, yB - oy));
      // hidden edges (dashed) via back-bottom-left vertex
      parts.push(line(x0 + ox, yB - oy, x0 + fl + ox, yB - oy, true));
      parts.push(line(x0 + ox, yB - oy, x0 + ox, yT - oy, true));
      parts.push(line(x0 + ox, yB - oy, x0, yB, true));
      parts.push(dimH(x0, x0 + fl, yB + 26, fmt(p.length, u)));
      parts.push(dimV(x0 - 26, yT, yB, fmt(p.height, u)));
      parts.push(dimSeg(x0 + fl + 14, yB + 8, x0 + fl + ox + 14, yB - oy + 8, fmt(p.width, u), 14, 14, 'start'));
    } else if (p.kind === 'cylinder') {
      const s = Math.min(340 / (2 * p.radius), 240 / p.height);
      const rx = p.radius * s;
      const ry = Math.max(10, rx * 0.3);
      const cx = W / 2 - 30;
      const yT = (H - (p.height * s + 2 * ry)) / 2 + ry; // top ellipse centre
      const yB = yT + p.height * s;
      parts.push(`<ellipse cx="${round(cx)}" cy="${round(yT)}" rx="${round(rx)}" ry="${round(ry)}" />`);
      parts.push(line(cx - rx, yT, cx - rx, yB));
      parts.push(line(cx + rx, yT, cx + rx, yB));
      parts.push(`<path d="M ${round(cx - rx)} ${round(yB)} A ${round(rx)} ${round(ry)} 0 0 0 ${round(cx + rx)} ${round(yB)}" />`);
      parts.push(`<path d="M ${round(cx - rx)} ${round(yB)} A ${round(rx)} ${round(ry)} 0 0 1 ${round(cx + rx)} ${round(yB)}" stroke-dasharray="6 4" />`);
      parts.push(`<circle cx="${round(cx)}" cy="${round(yT)}" r="2" fill="${INK}" stroke="none" />`);
      parts.push(line(cx, yT, cx + rx, yT));
      parts.push(arrowHead(cx + rx, yT, 0));
      parts.push(text(cx + rx / 2, yT - 10, fmt(p.radius, u), { size: 13 }));
      parts.push(dimV(cx + rx + 30, yT, yB, fmt(p.height, u), 'right'));
    } else {
      // triangular-prism
      const ox0 = p.length * OB_COS;
      const oy0 = p.length * OB_SIN;
      const s = Math.min(420 / (p.base + ox0), 250 / (p.height + oy0));
      const bs = p.base * s;
      const hs = p.height * s;
      const ox = ox0 * s;
      const oy = oy0 * s;
      const x0 = (W - (bs + ox)) / 2;
      const yBase = (H - (hs + oy)) / 2 + oy + hs; // front base edge
      const A: [number, number] = [x0, yBase];
      const B: [number, number] = [x0 + bs, yBase];
      const C: [number, number] = [x0 + bs / 2, yBase - hs];
      const off = (pt: [number, number]): [number, number] => [pt[0] + ox, pt[1] - oy];
      const A2 = off(A);
      const B2 = off(B);
      const C2 = off(C);
      parts.push(polygon([A, B, C], true));
      parts.push(line(B[0], B[1], B2[0], B2[1]));
      parts.push(line(C[0], C[1], C2[0], C2[1]));
      parts.push(line(B2[0], B2[1], C2[0], C2[1]));
      parts.push(line(A[0], A[1], A2[0], A2[1], true));
      parts.push(line(A2[0], A2[1], B2[0], B2[1], true));
      parts.push(line(A2[0], A2[1], C2[0], C2[1], true));
      // perpendicular height of the cross-section
      parts.push(line(C[0], C[1], C[0], yBase, true));
      parts.push(polygon([[C[0] - 9, yBase], [C[0] - 9, yBase - 9], [C[0], yBase - 9]], false));
      parts.push(text(C[0] + 9, yBase - hs / 2 + 4, fmt(p.height, u), { size: 13, anchor: 'start' }));
      parts.push(dimH(A[0], B[0], yBase + 26, fmt(p.base, u)));
      parts.push(dimSeg(B[0] + 14, B[1] + 8, B2[0] + 14, B2[1] + 8, fmt(p.length, u), 14, 14, 'start'));
    }

    parts.push('</svg>');
    return parts.join('');
  },

  describe(p) {
    const u = p.unit;
    switch (p.kind) {
      case 'rect-plus-semicircle':
        return `Compound shape: a rectangle ${p.width} ${u} wide and ${p.height} ${u} high, with a semicircle of diameter ${p.width} ${u} on top of the rectangle (flat side shared with the rectangle's top edge).${p.shaded ? ' The semicircle is shaded.' : ''}`;
      case 'rect-minus-rect':
        return `Compound shape: an outer rectangle ${p.outerWidth} ${u} by ${p.outerHeight} ${u} with an inner rectangle ${p.innerWidth} ${u} by ${p.innerHeight} ${u} removed from its centre.${p.shaded ? ' The region between the two rectangles is shaded.' : ''}`;
      case 'l-shape':
        return `L-shaped figure: a rectangle ${p.width} ${u} wide and ${p.height} ${u} high with a rectangle ${p.cutWidth} ${u} wide and ${p.cutHeight} ${u} high removed from its top-right corner.`;
      case 'cuboid':
        return `Cuboid of length ${p.length} ${u}, width ${p.width} ${u} and height ${p.height} ${u} (drawn in oblique projection with hidden edges dashed).`;
      case 'cylinder':
        return `Cylinder of radius ${p.radius} ${u} and height ${p.height} ${u}.`;
      case 'triangular-prism':
        return `Triangular prism of length ${p.length} ${u}; its triangular cross-section has base ${p.base} ${u} and perpendicular height ${p.height} ${u}.`;
    }
  },

  verify(p, context) {
    const issues: string[] = [];
    for (const [name, value] of dimensions(p)) {
      if (!(value > 0)) {
        issues.push(`compositeShape: ${name} must be positive (got ${value})`);
      } else if (!valueStatedInText(value, context)) {
        issues.push(`compositeShape: ${name} ${value} ${p.unit} never appears in the question text`);
      }
    }
    if (p.kind === 'rect-minus-rect') {
      if (p.innerWidth >= p.outerWidth || p.innerHeight >= p.outerHeight) {
        issues.push('compositeShape: inner rectangle must fit strictly inside the outer rectangle');
      }
    }
    if (p.kind === 'l-shape') {
      if (p.cutWidth >= p.width || p.cutHeight >= p.height) {
        issues.push('compositeShape: cut rectangle must be strictly smaller than the main rectangle');
      }
    }
    return issues;
  },
};
