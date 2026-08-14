import { describe, expect, it } from 'vitest';
import { venn2, Venn2ParamsZ } from '@/lib/visuals/templates/venn2';

// ORIGINAL fixture data only.
const params = Venn2ParamsZ.parse({
  universe_label: 'U',
  set_a: 'C',
  set_b: 'S',
  regions: { onlyA: '14', onlyB: '9', aAndB: '6', outside: '7' },
});

const exprParams = Venn2ParamsZ.parse({
  set_a: 'M',
  set_b: 'P',
  regions: { onlyA: 'x', onlyB: 'x - 3', aAndB: '5', outside: '2' },
});

describe('venn2 template', () => {
  it('renders deterministic SVG (snapshot)', () => {
    const svg = venn2.render(params);
    expect(svg).toContain('<svg');
    expect((svg.match(/<circle/g) || []).length).toBe(2);
    expect((svg.match(/<rect/g) || []).length).toBe(1);
    expect(svg).toMatchSnapshot();
  });

  it('renders a three-circle layout when set_c is given', () => {
    const three = Venn2ParamsZ.parse({
      set_a: 'A',
      set_b: 'B',
      set_c: 'D',
      regions: {
        onlyA: '4',
        onlyB: '5',
        aAndB: '2',
        outside: '1',
        onlyC: '6',
        aAndC: '3',
        bAndC: '2',
        allThree: '1',
      },
    });
    const svg = venn2.render(three);
    expect((svg.match(/<circle/g) || []).length).toBe(3);
    expect(venn2.describe(three)).toContain('all three sets: 1');
  });

  it('describe() lists every region value for the solver', () => {
    const d = venn2.describe(params);
    for (const s of ['C only: 14', 'S only: 9', 'C and S: 6', 'outside both sets: 7']) {
      expect(d).toContain(s);
    }
    const de = venn2.describe(exprParams);
    expect(de).toContain('M only: x');
    expect(de).toContain('P only: x - 3');
  });

  it('verify passes when the numeric region sum matches a stated total', () => {
    const ctx = { stem: 'There are 36 students in a class.', partPrompts: [] };
    expect(venn2.verify(params, ctx)).toEqual([]);
    // expressions present: sum check does not apply
    expect(venn2.verify(exprParams, ctx)).toEqual([]);
  });

  it('verify rejects a region sum that contradicts the stated total', () => {
    const ctx = { stem: 'There are 40 students in a class.', partPrompts: [] };
    expect(venn2.verify(params, ctx).length).toBeGreaterThan(0);
  });

  it('verify rejects duplicate set labels and negative region values', () => {
    const dup = { ...params, set_b: 'C' };
    expect(venn2.verify(dup, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
    const neg = { ...params, regions: { ...params.regions, onlyB: '-2' } };
    expect(venn2.verify(neg, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
  });

  it('verify rejects three-set regions without a third set (and vice versa)', () => {
    const orphan = { ...params, regions: { ...params.regions, onlyC: '3' } };
    expect(venn2.verify(orphan, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
    const missing = { ...params, set_c: 'D' };
    expect(venn2.verify(missing, { stem: 'x', partPrompts: [] }).length).toBeGreaterThan(0);
  });
});
