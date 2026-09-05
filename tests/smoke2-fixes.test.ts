import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyFormatDependency } from '@/lib/grade/method-marks';
import { renderVisual } from '@/lib/visuals';
import { legibleMinWidth } from '@/lib/visuals/legibility';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');

// Smoke #2. The fish-vendor page: every value and method row withheld, and
// the marker awarded R3 for writing a percent sign after a wrong number.
const fishVendor = [
  { code: 'CK2', slot_ref: 'c.i' },
  { code: 'AK3', slot_ref: 'c.i' },
  { code: 'R2', slot_ref: 'c.i' },
  { code: 'AK4', slot_ref: 'c.i' },
  { code: 'R3', slot_ref: 'c.i', for_format: true },
  { code: 'R1', slot_ref: 'b.i' },
];
const d = (code: string, awarded: boolean) => ({ code, awarded, reason: awarded ? 'seen' : 'not seen' });

describe('(1) a form row depends on the value or a method row on its slot', () => {
  it('withholds R3 on the fish-vendor page', () => {
    const out = applyFormatDependency([d('CK2', false), d('AK3', false), d('R2', false), d('R3', true)], fishVendor, []);
    expect(out.find((x) => x.code === 'R3')).toMatchObject({ awarded: false, reason: /form is right, but the value/ });
  });

  it('lets R3 stand when a method row on the slot is earned, by the marker or the grader', () => {
    const byMarker = applyFormatDependency([d('R2', true), d('R3', true)], fishVendor, []);
    expect(byMarker.find((x) => x.code === 'R3')?.awarded).toBe(true);
    const byGrader = applyFormatDependency([d('R3', true)], fishVendor, ['AK4']);
    expect(byGrader.find((x) => x.code === 'R3')?.awarded).toBe(true);
  });

  it('is ignored by a row on another slot, and by a withheld form row', () => {
    const other = applyFormatDependency([d('R1', true), d('R3', true)], fishVendor, []);
    expect(other.find((x) => x.code === 'R3')?.awarded).toBe(false);
    const withheld = applyFormatDependency([d('R3', false)], fishVendor, ['AK4']);
    expect(withheld[0].awarded).toBe(false);
  });

  it('runs on the marking path and in the eval', () => {
    expect(at("app", "study", "session", "[id]", "mark-working.ts")).toMatch(/applyFormatDependency\(\s*requireEvidence\(oneDecisionPerRow\(result\.decisions[\s\S]*question\.rubric \?\? \[\],\s*settled,?\s*\)/);
    expect(at('scripts', 'eval-marker.ts')).toMatch(/decisions = applyFormatDependency\(/);
  });
});

describe('(3) the admin page sets criterion TeX', () => {
  it('renders the criterion through renderMathHtml', () => {
    expect(at('app', 'admin', 'disputes', 'page.tsx')).toMatch(/__html: renderMathHtml\(rubric\.criterion\)/);
  });
});

describe('(4) the pattern figure fits a phone', () => {
  const three = { template: 'patternFigure' as const, params: { kind: 'dots', arrangement: 'square', figure_numbers: [1, 2, 3], counts: [1, 4, 9] } };
  it('is legible inside a 320px screen’s card, so the frame never scrolls', () => {
    const html = renderVisual(three as never, { stimulus: '', stem: '', partPrompts: [] });
    // 320px minus the page's and the card's padding is 237px of frame.
    expect(legibleMinWidth(html)).toBeLessThanOrEqual(237);
    expect(html).toMatch(/viewBox="0 0 340 /);
  });
  it('puts three figures on two rows, every figure drawn', () => {
    const html = renderVisual(three as never, { stimulus: '', stem: '', partPrompts: [] });
    const ys = [...html.matchAll(/>Figure \d<\/text>/g)].length;
    expect(ys).toBe(3);
    const labelYs = [...html.matchAll(/<text[^>]*y="([\d.]+)"[^>]*>Figure \d/g)].map((m) => Number(m[1]));
    expect(new Set(labelYs).size).toBe(2); // two rows
    expect((html.match(/<circle/g) ?? []).length).toBe(14); // 1 + 4 + 9 dots
  });
  it('shows the drawing checklist on the look back only where a construct slot exists', () => {
    const page = at('app', 'study', 'session', '[id]', 'page.tsx');
    expect(page).toMatch(/constructActs\(question\.visual as never\)\.length &&\s*\(question\.parts \?\? \[\]\)\.some\(\(p\) => \(p\.slots \?\? \[\]\)\.some\(\(sl\) => sl\.response_mode === 'construct'\)\)/);
  });
});
