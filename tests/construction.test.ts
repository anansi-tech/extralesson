import { describe, expect, it, vi } from 'vitest';

// The reader is mocked: what is under test is our comparison, not the model's
// eyesight — the model's eyesight is what the golden set measures.
const reads: unknown[] = [];
const calls: unknown[] = [];
vi.mock('ai', () => ({
  generateObject: async (opts: unknown) => {
    calls.push(opts);
    return { object: reads.shift() };
  },
}));

import { canGroundTruth, constructionChecks } from '@/lib/grade/construction';
import type { ConstructionCheck } from '@/lib/grade/construction';
import { checkConstruction } from '@/lib/grade/check-construction';
import { MAX_BYTES } from '@/lib/grade/transcribe';

// R2 §8. A construction's correct answer is a known set of coordinates, so a
// photographed graph is checked by comparison rather than judged. The ground
// truth is the figure's OWN declared params — the same structure it is rendered
// from — so the drawing and the check cannot drift apart.
describe('constructionChecks — ground truth from the declared params', () => {
  it('turns a declared line into an intercept and a second point', () => {
    const checks = constructionChecks({
      template: 'coordinateGrid',
      params: { x_range: [0, 5], y_range: [0, 18], lines: [{ m: 3, c: 2, label: 'Delivery charge' }] },
    } as never);
    expect(checks.find((c) => c.kind === 'intercept')?.expected.y).toBe(2);
    // The gradient is fixed by a second point rather than read off the page:
    // a slope measured from a photograph is the least reliable thing to ask for.
    expect(checks.find((c) => c.kind === 'point')?.expected).toMatchObject({ x: 1, y: 5 });
  });

  it('turns a declared curve into its shape, turning point and plotted points', () => {
    const checks = constructionChecks({
      template: 'coordinateGrid',
      params: { curves: [{ a: 1, b: -8, c: 16, domain: [0, 8], plotted: [0, 4, 8] }] },
    } as never);
    expect(checks.find((c) => c.kind === 'shape')?.expected.shape).toBe('opens-up');
    expect(checks.find((c) => c.describes.includes('turning point'))?.expected).toMatchObject({ x: 4, y: 0 });
    expect(checks.filter((c) => c.describes.startsWith('the curve passes')).length).toBe(3);
  });

  it('reads a travel graph as points and the segments between them', () => {
    const checks = constructionChecks({
      template: 'travelGraph',
      params: { points: [{ t: 0, v: 0 }, { t: 1, v: 12 }, { t: 3, v: 12 }, { t: 4, v: 0 }] },
    } as never);
    expect(checks.filter((c) => c.kind === 'point').length).toBe(4);
    expect(checks.filter((c) => c.kind === 'segment').map((c) => c.expected.shape)).toEqual([
      'rising',
      'horizontal',
      'falling',
    ]);
  });

  // The act an ogive is marked on, and the one candidates get wrong.
  it('plots an ogive at the upper boundary, and says so', () => {
    const checks = constructionChecks({
      template: 'cumulativeFrequency',
      params: { table: [{ upper: 10, cf: 4 }, { upper: 20, cf: 15 }] },
    } as never);
    expect(checks[0].describes).toContain('upper boundary, not the midpoint');
    expect(checks.find((c) => c.expected.shape === 'increasing')).toBeTruthy();
  });

  // WHERE THE PARAMS DO NOT LOCATE SOMETHING, THERE IS NO GROUND TRUTH.
  // Four grids in the bank name their vertices A, B, C and put the coordinates
  // in the question's wording. Reading those would be a second source that can
  // drift from the figure, so the slot keeps the self-check list instead.
  it('returns nothing when the vertices are named but not located', () => {
    const named = {
      template: 'coordinateGrid',
      params: { named: { polygons: [{ points: ['A', 'B', 'C'], name: 'ABC' }], sketch: false } },
    } as never;
    expect(constructionChecks(named)).toEqual([]);
    expect(canGroundTruth(named)).toBe(false);
  });

  it('grounds nothing for a family outside the plotted scope', () => {
    expect(canGroundTruth({ template: 'patternFigure', params: { counts: [1, 4, 9] } } as never)).toBe(false);
  });
});

// The comparison is done here, in code, from the figure's params. What the
// reader returns is only what it could see, so these tests pin the two rules
// that keep §8 asymmetric: silence never earns, and an unreadable page falls
// back to the self-check list rather than failing the student.
describe('checkConstruction — reading is not marking', () => {
  const checks: ConstructionCheck[] = [
    { kind: 'intercept', describes: 'a straight line crossing the y-axis at 3', expected: { y: 3 } },
    { kind: 'point', describes: 'that line passing through (1, 5)', expected: { x: 1, y: 5 } },
  ];
  const args = { image: new Uint8Array([1]), contentType: 'image/jpeg', checks, questionStem: 'Draw it.' };

  const reading = (o: unknown) => {
    reads.length = 0;
    calls.length = 0;
    reads.push(o);
  };

  it('completes only when every check is seen', async () => {
    reading({
      legible: true,
      axesDrawn: true,
      observations: [
        { index: 0, visible: true, note: 'crosses at 3' },
        { index: 1, visible: true, note: 'passes through (1,5)' },
      ],
    });
    const v = await checkConstruction(args);
    expect(v.complete).toBe(true);
    expect(v.satisfied).toHaveLength(2);
  });

  it('withholds when one check is unseen, and says which', async () => {
    reading({
      legible: true,
      axesDrawn: true,
      observations: [
        { index: 0, visible: true, note: 'crosses at 3' },
        { index: 1, visible: false, note: 'the line stops before x = 1' },
      ],
    });
    const v = await checkConstruction(args);
    expect(v.complete).toBe(false);
    expect(v.missing[0].check.describes).toBe('that line passing through (1, 5)');
    expect(v.missing[0].note).toBe('the line stops before x = 1');
  });

  it('counts an observation the reader omitted as not satisfied', async () => {
    reading({ legible: true, axesDrawn: true, observations: [{ index: 0, visible: true, note: 'yes' }] });
    const v = await checkConstruction(args);
    expect(v.complete).toBe(false);
    expect(v.missing.map((m) => m.check)).toEqual([checks[1]]);
  });

  it('awards nothing when the axes cannot be read, however many checks look right', async () => {
    reading({
      legible: true,
      axesDrawn: false,
      observations: [
        { index: 0, visible: true, note: 'a line at about 3' },
        { index: 1, visible: true, note: 'looks right' },
      ],
    });
    const v = await checkConstruction(args);
    expect(v.legible).toBe(false);
    expect(v.complete).toBe(false);
  });

  it('never calls the reader when the params state no checks', async () => {
    reads.length = 0;
    calls.length = 0;
    const v = await checkConstruction({ ...args, checks: [] });
    expect(v.complete).toBe(false);
    expect(calls).toHaveLength(0);
  });
});

// The two caps have to agree or the feature fails on exactly the dense pages
// worth reading: capture accepts 1.5MB of JPEG, which is ~2MB base64 inside a
// server action, and server actions default to a 1MB body.
describe('the photograph fits through the door', () => {
  it('allows a server-action body larger than the base64 of the biggest photo', async () => {
    const { default: config } = await import('../next.config');
    const limit = config.experimental?.serverActions?.bodySizeLimit;
    expect(typeof limit).toBe('string');
    const mb = Number(String(limit).replace(/mb$/i, ''));
    expect(mb).toBeGreaterThan((MAX_BYTES * 4) / 3 / 1_000_000);
  });
});
