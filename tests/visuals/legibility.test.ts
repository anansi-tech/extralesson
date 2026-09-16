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

/**
 * THE EXTERNAL POINT IS A THIRD PLACE AN ANGLE CAN BE. circleCenter described
 * every angle as at the centre or on the circumference, so the angle between
 * two tangents came out as "at P on the circumference" one sentence after "P,
 * a point outside the circle". The solve gate read both, called the figure
 * self-contradicting, and refused every edit to fe84c4 — including the repair
 * that would have fixed it.
 */
describe('circleCenter describes an angle at the external point', () => {
  const visual = {
    template: 'circleCenter' as const,
    params: {
      points: [{ label: 'A', bearing: 156, radius: true }, { label: 'B', bearing: 24, radius: true }],
      chords: [{ from: 'A', to: 'B' }],
      externalPoint: { label: 'P', tangentTo: ['A', 'B'] },
      angles: [{ vertex: 'P', arc: ['A', 'B'], value: 48 }, { vertex: 'A', arc: ['B', 'A'], value: 42 }],
    },
  };

  it('as between the tangents, never as on the circle it is outside', async () => {
    const { describeVisual } = await import('@/lib/visuals');
    const text = describeVisual(visual as never);
    expect(text).toContain('The angle at P between the tangents PA and PB is marked 48°');
    expect(text).not.toContain('at P on the circumference');
  });

  it('and an angle at a point that IS on the circle still says so', async () => {
    const { describeVisual } = await import('@/lib/visuals');
    expect(describeVisual(visual as never)).toContain('at A on the circumference');
  });
});
