/**
 * The floor is the SMALLEST RENDERED LABEL, not a scale factor: labels run 9 to
 * 14 units in a 640-unit viewBox, so one scale is not one legibility. Below it a
 * figure scrolls inside its frame rather than shrinking to fit.
 */
export const MIN_LABEL_PX = 10;

export const MAX_FIGURE_PX = 760;

export function smallestLabelUnits(svgHtml: string): number | null {
  const sizes = [...svgHtml.matchAll(/font-size="(\d+(?:\.\d+)?)"/g)].map((m) => Number(m[1]));
  return sizes.length ? Math.min(...sizes) : null;
}

export function viewBoxWidth(svgHtml: string): number | null {
  const m = svgHtml.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  return m ? Number(m[1]) : null;
}

/**
 * Narrowest width at which the smallest label still reaches MIN_LABEL_PX. Null
 * when the figure carries no labels — nothing to read, so it may shrink freely.
 */
export function legibleMinWidth(svgHtml: string): number | null {
  const units = smallestLabelUnits(svgHtml);
  const width = viewBoxWidth(svgHtml);
  if (!units || !width) return null;
  return Math.ceil((width * MIN_LABEL_PX) / units);
}
