// Shared SVG helpers for the visual templates. Black-line exam aesthetic:
// ink strokes, no decorative color, serif labels, viewBox-scaled.

export const INK = '#1E2430';
export const FONT = 'Georgia, "Times New Roman", serif';

export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// SVG <text> does not run through KaTeX. Convert the small supported math
// subset of a label to readable Unicode. (Carried from the research branch —
// renderer-agnostic utility.)
export function svgPlainLabel(raw: string): string {
  return raw
    .replace(/EC\$/g, 'EC¤')
    .replaceAll('$', '')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√$1')
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\^\{?\\circ\}?/g, '°')
    .replace(/\\angle/g, '∠')
    .replace(/\\perp/g, '⊥')
    .replace(/\\parallel/g, '∥')
    .replace(/\\times/g, '×')
    .replace(/\\vec\{([^{}]+)\}/g, '$1⃗')
    .replace(/_\{([^{}]+)\}/g, '_$1')
    .replace(/[{}]/g, '')
    .replace(/\\/g, '')
    .replaceAll('EC¤', 'EC$')
    .trim();
}

export function svgOpen(width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" font-family="${FONT}" fill="none" stroke="${INK}" stroke-width="1.5">`;
}

export function text(
  x: number,
  y: number,
  label: string,
  opts: { size?: number; anchor?: 'start' | 'middle' | 'end'; italic?: boolean } = {},
): string {
  const { size = 14, anchor = 'middle', italic = false } = opts;
  return `<text x="${round(x)}" y="${round(y)}" font-size="${size}" text-anchor="${anchor}"${
    italic ? ' font-style="italic"' : ''
  } fill="${INK}" stroke="none">${esc(svgPlainLabel(label))}</text>`;
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

// Nice tick positions between min and max inclusive.
export function ticks(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  const first = Math.ceil(min / step) * step;
  for (let v = first; v <= max + step / 1e6 && out.length < 100; v += step) {
    out.push(Number(v.toFixed(8)));
  }
  return out;
}
