// Black-line exam aesthetic: ink strokes, no decorative color, serif labels.

import { protectMoney, restoreMoney } from '@/lib/money';

export const INK = '#1E2430';
// Paper, for haloing text over a grid. Matches --paper in the design tokens.
export const PAPER = '#FBF7EE';
export const FONT = 'Georgia, "Times New Roman", serif';

export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Figure labels are plain SVG text, never KaTeX, so an exponent has to be
// written with the characters unicode provides. Converted only when EVERY
// character of the script has a form: half-converted is worse than a caret.
const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ',
};
const SUBSCRIPT: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎', n: 'ₙ',
};

function toScript(body: string, table: Record<string, string>): string | null {
  const out = [...body].map((ch) => table[ch]);
  return out.every(Boolean) ? out.join('') : null;
}

function applyScripts(text: string, marker: '^' | '_', table: Record<string, string>): string {
  const pattern = new RegExp(`\\${marker}(?:\\{([^{}]+)\\}|([^\\s{}^_]))`, 'g');
  return text.replace(pattern, (whole, braced?: string, single?: string) => {
    const converted = toScript(braced ?? single ?? '', table);
    return converted ?? whole;
  });
}

/**
 * Combining low line: underlines the character BEFORE it, with no markup at
 * all, so one authored form (\underline{}) works in KaTeX prose, in SVG text
 * and in an HTML table cell alike.
 */
const COMBINING_LOW_LINE = '\u0332';

export function svgPlainLabel(raw: string): string {
  const cleaned = protectMoney(raw)
    .replaceAll('$', '')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√$1')
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    // The underline is the QUESTION — "the value of the underlined digit" —
    // not decoration, so dropping it leaves a cell that cannot be answered.
    // Handled before backslashes are stripped, which would leave the word.
    .replace(/\\underline\{([^{}]*)\}/g, (_m, inner: string) =>
      [...inner].map((ch) => `${ch}${COMBINING_LOW_LINE}`).join(''),
    )
    .replace(/\^\{?\\circ\}?/g, '°')
    .replace(/\\angle/g, '∠')
    .replace(/\\perp/g, '⊥')
    .replace(/\\parallel/g, '∥')
    .replace(/\\times/g, '×')
    .replace(/\\vec\{([^{}]+)\}/g, '$1⃗')
    // Relations, BEFORE the backslashes are stripped, or \le reads as the word
    // "le". The guard is "not followed by a letter" rather than a word
    // boundary: \le25 has no space, and \left must not be caught.
    .replace(/\\leq(?![a-zA-Z])/g, '≤')
    .replace(/\\le(?![a-zA-Z])/g, '≤')
    .replace(/\\geq(?![a-zA-Z])/g, '≥')
    .replace(/\\ge(?![a-zA-Z])/g, '≥')
    .replace(/\\neq(?![a-zA-Z])/g, '≠')
    .replace(/\\approx(?![a-zA-Z])/g, '≈')
    .replace(/\\pm(?![a-zA-Z])/g, '±')
    .replace(/\\lt(?![a-zA-Z])/g, '<')
    .replace(/\\gt(?![a-zA-Z])/g, '>')
    .replace(/\\/g, '');
  const withMoney = restoreMoney(cleaned);

  const scripted = applyScripts(applyScripts(withMoney, '^', SUPERSCRIPT), '_', SUBSCRIPT);
  // Any braces still standing belonged to a script we could not convert.
  return scripted.replace(/[{}]/g, '').trim();
}

export function svgOpen(width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" font-family="${FONT}" fill="none" stroke="${INK}" stroke-width="1.5">`;
}

export function text(
  x: number,
  y: number,
  label: string,
  opts: {
    size?: number;
    anchor?: 'start' | 'middle' | 'end';
    italic?: boolean;
    /**
     * Paint a paper-coloured outline behind the glyphs. On a ruled grid a bare
     * label has gridlines, axes and tick numerals printing through it — which
     * is how "f: y = 2x - 3" came to read as "y² = 2x³ - 3" on a review card.
     */
    halo?: boolean;
  } = {},
): string {
  const { size = 14, anchor = 'middle', italic = false, halo = false } = opts;
  const paint = halo
    ? ` stroke="${PAPER}" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke fill"`
    : ' stroke="none"';
  return `<text x="${round(x)}" y="${round(y)}" font-size="${size}" text-anchor="${anchor}"${
    italic ? ' font-style="italic"' : ''
  } fill="${INK}"${paint}>${esc(svgPlainLabel(label))}</text>`;
}

export function line(x1: number, y1: number, x2: number, y2: number, dashed = false): string {
  return `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}"${
    dashed ? ' stroke-dasharray="6 4"' : ''
  } />`;
}

export function polygon(points: [number, number][], closed = true): string {
  const d = points.map((p) => `${round(p[0])},${round(p[1])}`).join(' ');
  return closed ? `<polygon points="${d}" />` : `<polyline points="${d}" />`;
}

export function circle(cx: number, cy: number, r: number): string {
  return `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(r)}" />`;
}

export function pathArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) % 360 > 180 ? 1 : 0;
  return `<path d="M ${round(s[0])} ${round(s[1])} A ${round(r)} ${round(r)} 0 ${large} 1 ${round(e[0])} ${round(e[1])}" />`;
}

// Degrees measured counterclockwise from positive x-axis, y-down SVG space.
export function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}

export function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * The 2 mm mesh a real paper prints under its unit lines: reading a root at
 * x = 1.5 off a grid ruled only in units is guesswork. Tiled as a pattern, so
 * a dense grid costs the same as a sparse one.
 */
export function meshDefs(id: string, spacing: number, divisions = 5): string {
  const fine = spacing / divisions;
  return `<defs><pattern id="${id}" width="${round(spacing)}" height="${round(spacing)}" patternUnits="userSpaceOnUse"><path d="M ${round(fine)} 0 L ${round(fine)} ${round(spacing)} M 0 ${round(fine)} L ${round(spacing)} ${round(fine)}" stroke="${INK}" stroke-width="0.25" opacity="0.55" fill="none" /><path d="M ${round(fine * 2)} 0 L ${round(fine * 2)} ${round(spacing)} M 0 ${round(fine * 2)} L ${round(spacing)} ${round(fine * 2)}" stroke="${INK}" stroke-width="0.25" opacity="0.55" fill="none" /><path d="M ${round(fine * 3)} 0 L ${round(fine * 3)} ${round(spacing)} M 0 ${round(fine * 3)} L ${round(spacing)} ${round(fine * 3)}" stroke="${INK}" stroke-width="0.25" opacity="0.55" fill="none" /><path d="M ${round(fine * 4)} 0 L ${round(fine * 4)} ${round(spacing)} M 0 ${round(fine * 4)} L ${round(spacing)} ${round(fine * 4)}" stroke="${INK}" stroke-width="0.25" opacity="0.55" fill="none" /></pattern></defs>`;
}

/** A rectangle filled with that mesh, drawn under everything else. */
export function meshRect(id: string, x: number, y: number, w: number, h: number): string {
  return `<rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(h)}" fill="url(#${id})" stroke="none" />`;
}

/** A plotted point, as the papers mark them: a small cross or a filled dot. */
export function plotMark(x: number, y: number, style: 'cross' | 'dot' = 'dot'): string {
  if (style === 'cross') {
    const r = 4;
    return `<path d="M ${round(x - r)} ${round(y - r)} L ${round(x + r)} ${round(y + r)} M ${round(x - r)} ${round(y + r)} L ${round(x + r)} ${round(y - r)}" stroke="${INK}" stroke-width="1.4" fill="none" />`;
  }
  return `<circle cx="${round(x)}" cy="${round(y)}" r="2.6" fill="${INK}" stroke="none" />`;
}

export function hatchDefs(id: string): string {
  return `<defs><pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="${INK}" stroke-width="0.5" /></pattern></defs>`;
}

export function hatchFill(id: string): string {
  return `url(#${id})`;
}

export function ticks(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  const first = Math.ceil(min / step) * step;
  for (let v = first; v <= max + step / 1e6 && out.length < 100; v += step) {
    out.push(Number(v.toFixed(8)));
  }
  return out;
}
