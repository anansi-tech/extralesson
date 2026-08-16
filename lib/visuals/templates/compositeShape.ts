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
  // The running track / belt / capsule: a rectangle capped by a semicircle at
  // EACH end. rect-plus-semicircle caps one end and cannot express it, and the
  // shape carries a perimeter question the one-ended version does not — the two
  // half-circumferences make a whole one.
  // A sector: two radii and the arc between them, the figure behind every
  // "length of arc AB" and "area of the shaded sector". circleCenter draws the
  // circle THEOREMS — chords, tangents, angles subtended — and has no sector,
  // so this mensuration item had no figure at all.
  z.object({
    kind: z.literal('sector'),
    radius: PosZ,
    angle: z.number().min(1).max(359), // the angle at the centre, in degrees
    unit: UnitZ,
    shaded: z.boolean().default(false),
  }),
  z.object({
    kind: z.literal('stadium'),
    length: PosZ, // the straight section
    width: PosZ, // the diameter of each semicircular end
    unit: UnitZ,
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
  // R1.8 §4.3: the 2024 gold-bar shape — a prism whose cross-section is a
  // trapezium, drawn in perspective with that face shaded.
  z.object({
    kind: z.literal('trapezoidal-prism'),
    parallelA: PosZ,
    parallelB: PosZ,
    depth: PosZ,
    length: PosZ,
    unit: UnitZ,
    shaded: z.boolean().default(true),
  }),
  // R1.8 §4.6: on the 2027 formulae sheet, and a formula is put on the sheet
  // because it will be examined.
  z.object({ kind: z.literal('cone'), radius: PosZ, height: PosZ, slant: PosZ.optional(), unit: UnitZ }),
  z.object({ kind: z.literal('sphere'), radius: PosZ, unit: UnitZ }),
  z.object({ kind: z.literal('hemisphere'), radius: PosZ, unit: UnitZ }),
  // A cone sitting on a cylinder, and a cylinder capped by a hemisphere: the
  // composite solids a volume question is built from.
  z.object({ kind: z.literal('cone-on-cylinder'), radius: PosZ, coneHeight: PosZ, cylinderHeight: PosZ, unit: UnitZ }),
  z.object({ kind: z.literal('cylinder-plus-hemisphere'), radius: PosZ, height: PosZ, unit: UnitZ }),
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
    case 'stadium':
      return [['length', p.length], ['width', p.width]];
    case 'sector':
      return [['radius', p.radius], ['angle', p.angle]];
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
    case 'trapezoidal-prism':
      return [['parallel side a', p.parallelA], ['parallel side b', p.parallelB], ['depth', p.depth], ['length', p.length]];
    case 'cone':
      return p.slant
        ? [['radius', p.radius], ['height', p.height], ['slant height', p.slant]]
        : [['radius', p.radius], ['height', p.height]];
    case 'sphere':
    case 'hemisphere':
      return [['radius', p.radius]];
    case 'cone-on-cylinder':
      return [['radius', p.radius], ['cone height', p.coneHeight], ['cylinder height', p.cylinderHeight]];
    case 'cylinder-plus-hemisphere':
      return [['radius', p.radius], ['height', p.height]];
  }
}

// R1.8 §4.6 — the round solids the 2027 formulae sheet supplies. Drawn the way
// the papers draw them: an ellipse for a circular base seen in perspective,
// the hidden half of that ellipse dashed, and every stated dimension labelled.
type RoundSolid = Extract<
  CompositeShapeParams,
  { kind: 'cone' | 'sphere' | 'hemisphere' | 'cone-on-cylinder' | 'cylinder-plus-hemisphere' }
>;

function roundSolid(p: RoundSolid, u: string): string[] {
  const out: string[] = [];
  const cx = W / 2;
  const ellipse = (ex: number, ey: number, rx: number, ry: number, hiddenDashed = true) => {
    out.push(`<path d="M ${round(ex - rx)} ${round(ey)} A ${round(rx)} ${round(ry)} 0 0 0 ${round(ex + rx)} ${round(ey)}" />`);
    out.push(
      `<path d="M ${round(ex - rx)} ${round(ey)} A ${round(rx)} ${round(ry)} 0 0 1 ${round(ex + rx)} ${round(ey)}"${hiddenDashed ? ' stroke-dasharray="6 4"' : ''} />`,
    );
  };

  if (p.kind === 'sphere' || p.kind === 'hemisphere') {
    const r = Math.min(150, 150);
    const cy = H / 2;
    if (p.kind === 'sphere') {
      out.push(`<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(r)}" />`);
      ellipse(cx, cy, r, r * 0.28); // the equator, to read it as a ball
    } else {
      out.push(`<path d="M ${round(cx - r)} ${round(cy)} A ${round(r)} ${round(r)} 0 0 1 ${round(cx + r)} ${round(cy)}" />`);
      ellipse(cx, cy, r, r * 0.28);
    }
    out.push(line(cx, cy, cx + r, cy));
    out.push(arrowHead(cx + r, cy, 0));
    out.push(text(cx + r / 2, cy - 10, fmt(p.radius, u), { size: 13 }));
    return out;
  }

  // cone, cone-on-cylinder, cylinder-plus-hemisphere all stack around one axis
  const radius = p.radius;
  const coneH = p.kind === 'cone' ? p.height : p.kind === 'cone-on-cylinder' ? p.coneHeight : 0;
  const cylH = p.kind === 'cone-on-cylinder' ? p.cylinderHeight : p.kind === 'cylinder-plus-hemisphere' ? p.height : 0;
  const hemiH = p.kind === 'cylinder-plus-hemisphere' ? radius : 0;
  const total = coneH + cylH + hemiH;
  const s = Math.min(150 / radius, 300 / Math.max(total, 1));
  const rx = radius * s;
  const ry = rx * 0.3;
  const top = (H - (total * s + ry)) / 2;
  let y = top;

  if (coneH > 0) {
    const apex = y;
    y += coneH * s;
    out.push(line(cx - rx, y, cx, apex));
    out.push(line(cx + rx, y, cx, apex));
    ellipse(cx, y, rx, ry, cylH === 0); // the base ellipse, hidden half dashed
    out.push(dimV(cx + rx + 34, apex, y, fmt(coneH, u), 'right'));
    if (p.kind === 'cone' && p.slant) {
      out.push(text((cx + (cx + rx)) / 2 + 12, (apex + y) / 2, fmt(p.slant, u), { size: 13, anchor: 'start' }));
    }
  }
  if (cylH > 0) {
    const yTop = y;
    y += cylH * s;
    out.push(line(cx - rx, yTop, cx - rx, y));
    out.push(line(cx + rx, yTop, cx + rx, y));
    ellipse(cx, y, rx, ry, hemiH === 0);
    out.push(dimV(cx - rx - 30, yTop, y, fmt(cylH, u)));
  }
  if (hemiH > 0) {
    out.push(`<path d="M ${round(cx - rx)} ${round(y)} A ${round(rx)} ${round(rx)} 0 0 0 ${round(cx + rx)} ${round(y)}" />`);
    y += hemiH * s;
  }
  out.push(line(cx, y - ry, cx + rx, y - ry));
  out.push(arrowHead(cx + rx, y - ry, 0));
  out.push(text(cx + rx / 2, y - ry - 10, fmt(radius, u), { size: 13 }));
  return out;
}

export const compositeShape: VisualTemplate<CompositeShapeParams> = {
  name: 'compositeShape',
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    "every dimension must be positive",
    "an inner rectangle must fit strictly inside the outer one",
    "a cut rectangle must be strictly smaller than the main rectangle",
    "a trapezoidal prism needs parallel sides of different lengths, and its cross-section shades by default because the question asks for that area",
    "a cone's slant height, when stated, must be the hypotenuse of its radius and perpendicular height",
    "shaded: true hatches the region the question asks about — the semicircle on a rect-plus-semicircle, and the material left between the rectangles on a rect-minus-rect; set it whenever the question says \"shaded\"",
  ],
  paramsSchema: CompositeShapeParamsZ,

  render(p) {
    const parts: string[] = [svgOpen(W, H)];
    const u = p.unit;
    const shaded = 'shaded' in p && p.shaded;
    if (shaded) parts.push(hatchDefs('shapeHatch'));

    if (p.kind === 'sector') {
      const r = 150; // the sector is a labelled sketch, drawn at one size
      const cx = W / 2;
      const cy = H / 2 + r / 3;
      // Drawn from the positive x-direction, opening anticlockwise, so the
      // marked angle reads the way a protractor would.
      const a0 = 0;
      const a1 = (p.angle * Math.PI) / 180;
      const [x1, y1] = [cx + r * Math.cos(a0), cy - r * Math.sin(a0)];
      const [x2, y2] = [cx + r * Math.cos(a1), cy - r * Math.sin(a1)];
      const large = p.angle > 180 ? 1 : 0;
      const d = `M ${round(cx)} ${round(cy)} L ${round(x1)} ${round(y1)} A ${round(r)} ${round(r)} 0 ${large} 0 ${round(x2)} ${round(y2)} Z`;
      if (shaded) parts.push(`<path d="${d}" fill="${hatchFill('shapeHatch')}" stroke="none" />`);
      parts.push(`<path d="${d}" fill="none" />`);
      // The angle at the centre, and one radius labelled: what the question needs.
      parts.push(pathArc(cx, cy, 34, 0, p.angle));
      const mid = (a1 / 2);
      parts.push(
        text(cx + 56 * Math.cos(mid), cy - 56 * Math.sin(mid) + 4, `${round(p.angle)}°`, {
          size: 13,
          halo: true,
        }),
      );
      parts.push(text((cx + x1) / 2, cy + 18, fmt(p.radius, u), { size: 13, halo: true }));
      parts.push(text(cx - 12, cy + 16, 'O', { size: 13, italic: true }));
      parts.push('</svg>');
      return parts.join('');
    }

    if (p.kind === 'stadium') {
      const s = Math.min(360 / (p.length + p.width), 240 / p.width);
      const rw = p.length * s;
      const r = (p.width * s) / 2;
      const x0 = (W - rw) / 2;
      const yTop = (H - 2 * r) / 2;
      const yBot = yTop + 2 * r;
      if (shaded) {
        parts.push(
          `<path d="M ${round(x0)} ${round(yTop)} L ${round(x0 + rw)} ${round(yTop)} A ${round(r)} ${round(r)} 0 0 1 ${round(x0 + rw)} ${round(yBot)} L ${round(x0)} ${round(yBot)} A ${round(r)} ${round(r)} 0 0 1 ${round(x0)} ${round(yTop)} Z" fill="${hatchFill('shapeHatch')}" stroke="none" />`,
        );
      }
      // One outline: two straights and two semicircular ends.
      parts.push(
        `<path d="M ${round(x0)} ${round(yTop)} L ${round(x0 + rw)} ${round(yTop)} A ${round(r)} ${round(r)} 0 0 1 ${round(x0 + rw)} ${round(yBot)} L ${round(x0)} ${round(yBot)} A ${round(r)} ${round(r)} 0 0 1 ${round(x0)} ${round(yTop)} Z" fill="none" />`,
      );
      // The straight section and the end diameter, dimensioned with the arrowed
      // lines the papers draw rather than a bare label beside the edge.
      parts.push(line(x0, yTop, x0, yBot, true));
      parts.push(line(x0 + rw, yTop, x0 + rw, yBot, true));
      parts.push(dimH(x0, x0 + rw, yTop - 16, fmt(p.length, u), true));
      parts.push(dimV(x0 + 26, yTop, yBot, fmt(p.width, u), 'right'));
      parts.push('</svg>');
      return parts.join('');
    }

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
    } else if (p.kind === 'trapezoidal-prism') {
      // R1.8 §4.3 — a prism whose cross-section is a trapezium, drawn in the
      // oblique projection the rest of this template uses, with that face
      // shaded because the question asks for its area.
      const ox0 = p.length * OB_COS;
      const oy0 = p.length * OB_SIN;
      const wide = Math.max(p.parallelA, p.parallelB);
      const s = Math.min(400 / (wide + ox0), 240 / (p.depth + oy0));
      const a = p.parallelA * s; // bottom parallel side
      const b = p.parallelB * s; // top parallel side
      const d = p.depth * s;
      const ox = ox0 * s;
      const oy = oy0 * s;
      const x0 = (W - (a + ox)) / 2;
      const yB = (H - (d + oy)) / 2 + d + oy;
      // front trapezium: bottom-left, bottom-right, top-right, top-left
      const F: [number, number][] = [
        [x0, yB],
        [x0 + a, yB],
        [x0 + a - (a - b) / 2, yB - d],
        [x0 + (a - b) / 2, yB - d],
      ];
      const back = F.map(([x, y]) => [x + ox, y - oy] as [number, number]);
      if (p.shaded) {
        parts.push(hatchDefs('shapeHatch'));
        parts.push(
          `<polygon points="${F.map((q) => `${round(q[0])},${round(q[1])}`).join(' ')}" fill="${hatchFill('shapeHatch')}" stroke="none" />`,
        );
      }
      // hidden back edges first, then the visible solid
      parts.push(polygon(back, true));
      parts.push(polygon(F, true));
      for (let i = 0; i < 4; i++) parts.push(line(F[i][0], F[i][1], back[i][0], back[i][1]));
      parts.push(dimH(x0, x0 + a, yB + 26, fmt(p.parallelA, u)));
      parts.push(dimV(x0 - 26, yB - d, yB, fmt(p.depth, u)));
      parts.push(
        dimSeg(F[1][0] + 12, F[1][1] + 8, back[1][0] + 12, back[1][1] + 8, fmt(p.length, u), 14, 14, 'start'),
      );
    } else if (p.kind === 'cone' || p.kind === 'cone-on-cylinder' || p.kind === 'cylinder-plus-hemisphere' || p.kind === 'sphere' || p.kind === 'hemisphere') {
      parts.push(...roundSolid(p, u));
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
      case 'sector':
        return `A sector of a circle, centre O, with radius ${p.radius} ${u} and an angle of ${p.angle}° at the centre. The two straight edges are radii and the curved edge is the arc.${p.shaded ? ' The sector is shaded.' : ''}`;
      case 'stadium':
        return `Compound shape: a rectangle ${p.length} ${u} long with a semicircle of diameter ${p.width} ${u} on EACH end (the shape of a running track). The two semicircular ends together make one full circle of diameter ${p.width} ${u}.${p.shaded ? ' The region is shaded.' : ''}`;
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
      case 'trapezoidal-prism':
        return `Prism of length ${p.length} ${u} whose cross-section is a trapezium with parallel sides ${p.parallelA} ${u} and ${p.parallelB} ${u}, ${p.depth} ${u} apart${p.shaded ? '; that cross-section is shaded' : ''}.`;
      case 'cone':
        return `Right circular cone of base radius ${p.radius} ${u} and perpendicular height ${p.height} ${u}${p.slant ? `, slant height ${p.slant} ${u}` : ''}.`;
      case 'sphere':
        return `Sphere of radius ${p.radius} ${u}.`;
      case 'hemisphere':
        return `Hemisphere of radius ${p.radius} ${u}, flat face uppermost.`;
      case 'cone-on-cylinder':
        return `Solid of radius ${p.radius} ${u}: a cone of perpendicular height ${p.coneHeight} ${u} standing on a cylinder of height ${p.cylinderHeight} ${u}.`;
      case 'cylinder-plus-hemisphere':
        return `Solid of radius ${p.radius} ${u}: a cylinder of height ${p.height} ${u} closed by a hemisphere of the same radius.`;
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
    if (p.kind === 'trapezoidal-prism' && p.parallelA === p.parallelB) {
      issues.push('compositeShape: a trapezium needs parallel sides of different lengths — equal ones make it a rectangle');
    }
    // A cone's slant height is the hypotenuse of radius and height; a stated
    // one that disagrees would have the candidate compute a wrong surface area.
    if (p.kind === 'cone' && p.slant) {
      const expected = Math.sqrt(p.radius * p.radius + p.height * p.height);
      if (Math.abs(expected - p.slant) > 0.05 * Math.max(1, expected)) {
        issues.push(
          `compositeShape: slant height ${p.slant} disagrees with radius ${p.radius} and height ${p.height} (expected about ${Math.round(expected * 100) / 100})`,
        );
      }
    }
    return issues;
  },
};
