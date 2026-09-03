import { z } from 'zod';
import { circle, svgOpen, text } from '../svg';
import type { VisualTemplate } from '../types';
import { numbersInText, valueStatedInText } from '../types';

// Two or three overlapping labelled set circles inside a universal-set
// rectangle. Region values are strings so they can be counts ("12") or
// expressions ("x - 3"), and an empty string shows the region blank. In the
// 3-set layout aAndB means "A and B only", not C.
const RegionZ = z.string().max(16);

export const VennDiagramParamsZ = z.object({
  universe_label: z.string().min(1).max(8).default('U'),
  set_a: z.string().min(1).max(12),
  set_b: z.string().min(1).max(12),
  set_c: z.string().min(1).max(12).optional(),
  regions: z.object({
    onlyA: RegionZ,
    onlyB: RegionZ,
    aAndB: RegionZ,
    outside: RegionZ,
    onlyC: RegionZ.optional(),
    aAndC: RegionZ.optional(),
    bAndC: RegionZ.optional(),
    allThree: RegionZ.optional(),
  }),
});

export type VennDiagramParams = z.infer<typeof VennDiagramParamsZ>;

const W = 640;

const THREE_SET_KEYS = ['onlyC', 'aAndC', 'bAndC', 'allThree'] as const;

function isPlainNumber(s: string): boolean {
  return /^-?\d+(?:\.\d+)?$/.test(s.trim());
}

function definedRegionValues(p: VennDiagramParams): string[] {
  const base = [p.regions.onlyA, p.regions.onlyB, p.regions.aAndB, p.regions.outside];
  if (p.set_c) {
    for (const k of THREE_SET_KEYS) {
      const v = p.regions[k];
      if (v !== undefined) base.push(v);
    }
  }
  return base;
}

export const vennDiagram: VisualTemplate<VennDiagramParams> = {
  name: 'vennDiagram',
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    "set labels must be unique",
    "a three-set diagram must supply all seven region values",
    "numeric region values must be non-negative",
  ],
  paramsSchema: VennDiagramParamsZ,

  render(p) {
    const three = Boolean(p.set_c);
    const H = three ? 460 : 400;
    const parts: string[] = [svgOpen(W, H)];
    parts.push(
      `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="none" />`,
    );
    parts.push(text(30, 36, p.universe_label, { size: 15, anchor: 'start', italic: true }));

    const put = (x: number, y: number, v: string | undefined) => {
      if (v !== undefined && v !== '') parts.push(text(x, y, v, { size: 14 }));
    };

    if (!three) {
      parts.push(circle(240, 210, 125));
      parts.push(circle(400, 210, 125));
      parts.push(text(140, 105, p.set_a, { size: 15, italic: true }));
      parts.push(text(500, 105, p.set_b, { size: 15, italic: true }));
      put(185, 215, p.regions.onlyA);
      put(455, 215, p.regions.onlyB);
      put(320, 215, p.regions.aAndB);
      put(560, 365, p.regions.outside);
    } else {
      parts.push(circle(245, 180, 110));
      parts.push(circle(395, 180, 110));
      parts.push(circle(320, 300, 110));
      parts.push(text(150, 88, p.set_a, { size: 15, italic: true }));
      parts.push(text(490, 88, p.set_b, { size: 15, italic: true }));
      parts.push(text(418, 400, p.set_c ?? '', { size: 15, italic: true }));
      put(195, 165, p.regions.onlyA);
      put(445, 165, p.regions.onlyB);
      put(320, 140, p.regions.aAndB);
      put(320, 220, p.regions.allThree);
      put(250, 270, p.regions.aAndC);
      put(390, 270, p.regions.bAndC);
      put(320, 360, p.regions.onlyC);
      put(575, 430, p.regions.outside);
    }
    parts.push('</svg>');
    return parts.join('');
  },

  describe(p) {
    const v = (s: string | undefined) => (s === undefined || s === '' ? '(blank)' : s);
    const a = p.set_a;
    const b = p.set_b;
    if (!p.set_c) {
      return (
        `Venn diagram: universal set ${p.universe_label} containing two overlapping sets ${a} and ${b}. ` +
        `Region values — ${a} only: ${v(p.regions.onlyA)}; ${b} only: ${v(p.regions.onlyB)}; ` +
        `${a} and ${b}: ${v(p.regions.aAndB)}; outside both sets: ${v(p.regions.outside)}.`
      );
    }
    const c = p.set_c;
    return (
      `Venn diagram: universal set ${p.universe_label} containing three overlapping sets ${a}, ${b} and ${c}. ` +
      `Region values — ${a} only: ${v(p.regions.onlyA)}; ${b} only: ${v(p.regions.onlyB)}; ${c} only: ${v(
        p.regions.onlyC,
      )}; ${a} and ${b} only: ${v(p.regions.aAndB)}; ${a} and ${c} only: ${v(
        p.regions.aAndC,
      )}; ${b} and ${c} only: ${v(p.regions.bAndC)}; all three sets: ${v(
        p.regions.allThree,
      )}; outside all sets: ${v(p.regions.outside)}.`
    );
  },

  verify(p, context) {
    const issues: string[] = [];
    const labels = [p.set_a, p.set_b, ...(p.set_c ? [p.set_c] : [])];
    if (new Set(labels).size !== labels.length) issues.push('vennDiagram: duplicate set labels');
    if (p.set_c) {
      for (const k of THREE_SET_KEYS) {
        if (p.regions[k] === undefined) {
          issues.push(`vennDiagram: three-set diagram is missing region "${k}"`);
        }
      }
    } else {
      for (const k of THREE_SET_KEYS) {
        if (p.regions[k] !== undefined) {
          issues.push(`vennDiagram: region "${k}" given but there is no third set`);
        }
      }
    }
    const values = definedRegionValues(p);
    for (const v of values) {
      if (isPlainNumber(v) && Number(v) < 0) {
        issues.push(`vennDiagram: negative region value ${v}`);
      }
    }
    // When every region is a plain number and the text states numbers, the
    // region sum must match one of them (the total/universal count).
    const nonEmpty = values.filter((v) => v !== '');
    if (nonEmpty.length === values.length && values.every(isPlainNumber)) {
      const sum = values.reduce((acc, v) => acc + Number(v), 0);
      if (numbersInText(context).length > 0 && !valueStatedInText(sum, context)) {
        issues.push(
          `vennDiagram: region values sum to ${sum}, which does not match any total stated in the question text`,
        );
      }
    }
    return issues;
  },
};
