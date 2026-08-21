/**
 * HOW WIDE A FIGURE HAS TO BE DRAWN TO BE READ.
 *
 * Reading a value off a graph is the exam task. A figure scaled down until its
 * axis labels are four pixels tall has not been made smaller, it has been made
 * useless, and pinch-zooming to read it is a broken question rather than an
 * inconvenience.
 *
 * The floor is expressed as the SMALLEST RENDERED LABEL, not as a scale factor:
 * scale says nothing on its own, because a template with 9-unit labels and one
 * with 14-unit labels are legible at quite different scales. Measured on the
 * live bank, the smallest label runs from 9 units (coordinateGrid, and 144
 * questions use it) to 14 (vennDiagram), all in a 640-unit viewBox — so at a
 * full-bleed 360px phone they render between 5.1px and 7.9px. None of that is
 * readable, which is why the figure is allowed to exceed the screen and scroll
 * inside its own frame instead of shrinking to fit.
 */
export const MIN_LABEL_PX = 10;

/** The figure is never drawn wider than this, however much room there is. */
export const MAX_FIGURE_PX = 760;

/** The smallest label in a rendered figure, in viewBox units. */
export function smallestLabelUnits(svgHtml: string): number | null {
  const sizes = [...svgHtml.matchAll(/font-size="(\d+(?:\.\d+)?)"/g)].map((m) => Number(m[1]));
  return sizes.length ? Math.min(...sizes) : null;
}

/** The viewBox width of a rendered figure. */
export function viewBoxWidth(svgHtml: string): number | null {
  const m = svgHtml.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  return m ? Number(m[1]) : null;
}

/**
 * The narrowest this figure may be drawn while its smallest label still reaches
 * MIN_LABEL_PX. Null when the figure carries no labels — a schematic with no
 * numbers on it has nothing to read, so it may shrink freely.
 */
export function legibleMinWidth(svgHtml: string): number | null {
  const units = smallestLabelUnits(svgHtml);
  const width = viewBoxWidth(svgHtml);
  if (!units || !width) return null;
  return Math.ceil((width * MIN_LABEL_PX) / units);
}
