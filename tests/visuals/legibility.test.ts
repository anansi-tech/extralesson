import { describe, expect, it } from 'vitest';
import {
  legibleMinWidth,
  smallestLabelUnits,
  viewBoxWidth,
  MIN_LABEL_PX,
} from '@/lib/visuals/legibility';

// Reading a value off a graph is the exam task, so a figure may exceed the
// screen and scroll, but it may never shrink below the size its labels stop
// being readable at. Measured before this existed: coordinateGrid rendered its
// 9-unit labels at 4.0px on a 360px phone.
describe('legibleMinWidth — a figure may scroll, but not shrink past reading', () => {
  const svg = (vb: number, ...fonts: number[]) =>
    `<svg viewBox="0 0 ${vb} 490">${fonts.map((f) => `<text font-size="${f}">1</text>`).join('')}</svg>`;

  it('asks for the width that puts the SMALLEST label at the floor', () => {
    // 640 units wide with 9-unit labels: 640 * 10 / 9
    expect(legibleMinWidth(svg(640, 14, 9, 13))).toBe(712);
    expect(legibleMinWidth(svg(640, 14))).toBe(Math.ceil((640 * MIN_LABEL_PX) / 14));
  });

  it('reads the parts it needs out of the figure', () => {
    expect(smallestLabelUnits(svg(640, 14, 9))).toBe(9);
    expect(viewBoxWidth(svg(640, 14))).toBe(640);
  });

  // A schematic with no numbers on it has nothing to read, so it may shrink.
  it('leaves an unlabelled figure alone', () => {
    expect(legibleMinWidth('<svg viewBox="0 0 640 490"><line/></svg>')).toBe(null);
    expect(smallestLabelUnits('<svg viewBox="0 0 640 490"></svg>')).toBe(null);
  });
});
