import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { UNGROUNDED, groundedNumbers, numbersIn, requireGrounding } from '@/lib/grade/method-marks';
import { MethodDecisionZ } from '@/lib/grade/mark-method';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');

// Numbers in an award are grounded: every number the marker names on the
// quoted line must appear in the question, a confirmed answer, or an earlier
// line of the page, or the row is withheld with one reason.
const slab = {
  question: 'A plan is drawn to a scale of 1 cm to 2 m. The outer rectangle is 24 m by 16 m; the cut-out is 8 m by 6 m. 16.8 m^3 of concrete is delivered. Calculate the area of the concrete slab.',
  answers: ['24 m x 16 m', '8 m x 6 m', '336'],
  lines: ['24 x 16 = 384', '8 x 6 = 48', '384 - 48 = 336', '16.8 / 336 = 0.05'],
};
const award = (reason: string, quantities?: string[]) => ({ code: 'R1', awarded: true, reason, confidence: 0.9, quantities });

describe('numbersIn', () => {
  it('reads a number however it is spaced, and once', () => {
    expect([...numbersIn('1 200 000 - 144 000 = 1,056,000 and 0.050 m')]).toEqual(['1200000', '144000', '1056000', '0.05']);
  });
});

describe('requireGrounding', () => {
  it('keeps an award whose numbers are in the question, the answers or an earlier line', () => {
    const [d] = requireGrounding([award('"384 - 48 = 336" subtracts the cut-out', ['384', '48'])], slab);
    expect(d.awarded).toBe(true);
  });
  it('withholds an award on a number found nowhere, with the one reason', () => {
    const cocoa = { ...slab, lines: ['1200000 - 144000 = 156000', '156000 / 1200000 = 13%'] };
    const [d] = requireGrounding([award('"1200000 - 144000 = 156000" subtracts the cut-out from the outer area', ['1200000', '144000'])], cocoa);
    expect(d.awarded).toBe(false);
    expect(d.reason).toBe(UNGROUNDED);
  });
  it('carries grounding forward: a line earns its numbers only on grounded inputs', () => {
    const known = new Set(['24', '16', '8', '6', '16.8']);
    const earned = groundedNumbers(['24 x 16 = 384', '8 x 6 = 48', '384 - 48 = 336', '16.8 / 336 = 0.05'], known);
    expect([...earned].slice(5)).toEqual(['384', '48', '336', '0.05']);
    // The cocoa page on the slab question: its first line stands on nothing,
    // so no later line earns a number either, and (b)'s award is withheld.
    const cocoa = ['# of rejected = 12% x 1 200 000 = 144000', '1200000 - 144000 = 150000', '150000 / 1200000 = 12.5%'];
    expect([...groundedNumbers(cocoa, known)].length).toBe(known.size);
    const [d] = requireGrounding([award('"1200000 - 144000 = 150000" subtracts the cut-out from the outer area', ['1200000', '144000'])], { ...slab, lines: cocoa });
    expect(d.awarded).toBe(false);
    expect(d.reason).toBe(UNGROUNDED);
  });
  it('counts only the lines above the quoted one as earlier', () => {
    // 336 first appears on the quoted line itself: as a named quantity of a
    // LATER line it is grounded; named on its own line it is not.
    const later = requireGrounding([award('"16.8 / 336 = 0.05" divides by their area', ['16.8', '336'])], slab);
    expect(later[0].awarded).toBe(true);
    const own = requireGrounding([award('"384 - 48 = 336"', ['336'])], { ...slab, answers: [] });
    expect(own[0].awarded).toBe(false);
  });
  it('lets the constants of a method through, and leaves unnamed and withheld rows alone', () => {
    const page = { ...slab, lines: [...slab.lines, '48 / 384 x 100 = 12.5'] };
    const [pct] = requireGrounding([award('"48 / 384 x 100 = 12.5" finds the percentage', ['48', '384', '100'])], page);
    expect(pct.awarded).toBe(true);
    const [half] = requireGrounding([award('"336 / 2 = 168"', ['336', '2'])], slab);
    expect(half.awarded).toBe(true);
    const [unnamed] = requireGrounding([award('"1200000 - 144000" no quantities named')], slab);
    expect(unnamed.awarded).toBe(true);
    // Unquoted, the award's line is where its numbers first appear together;
    // a page that introduces them there has grounded none of them.
    const [unplaced] = requireGrounding([award('subtracts the cut-out from the outer area', ['1200000', '144000'])], { ...slab, lines: ['1200000 - 144000 = 156000'] });
    expect(unplaced.awarded).toBe(false);
    const [combined] = requireGrounding([award('subtracts the cut-out from the outer area', ['384', '48'])], { ...slab, answers: [] });
    expect(combined.awarded).toBe(true);
    const [withheld] = requireGrounding([{ ...award('nothing', ['999']), awarded: false }], slab);
    expect(withheld.awarded).toBe(false);
    expect(withheld.reason).toBe('nothing');
  });
  it('is part of the marker contract and its rule, and runs on both marking paths', () => {
    expect(MethodDecisionZ.safeParse({ code: 'R1', awarded: true, reason: 'r', confidence: 1, quantities: ['24', '16'] }).success).toBe(true);
    expect(at('lib', 'grade', 'mark-method.ts')).toMatch(/WHERE YOU AWARD, NAME THE NUMBERS/);
    expect(at('app', 'study', 'session', '[id]', 'mark-working.ts')).toMatch(/requireGrounding\(requireEvidence\(/);
    expect(at('scripts', 'eval-marker.ts')).toMatch(/requireGrounding\(/);
  });
  it('has the cocoa page on the slab question as a pipeline case, (b) withheld', () => {
    const c = JSON.parse(at('calibration', 'reads', 'cocoa-on-slab.json'));
    expect(c.image).toBe('cocoa-b1.jpg');
    expect(c.truth.map((t: { code: string; awarded: boolean }) => [t.code, t.awarded])).toEqual([['CK2', false], ['AK3', false], ['R1', false]]);
    expect(at('scripts', 'eval-pipeline.ts')).toMatch(/truth: c\.truth \?\? null/);
  });

  it('grounds a number on the figure’s labels and a given table’s cells', async () => {
    const { questionText } = await import('@/app/study/session/[id]/mark-working');
    const text = questionText({ stem: 'Use the diagram.', visual: { template: 'triangle', params: { base: 12, height: 5 } }, stimulus_table: { rows: [['Mango', 27]] } });
    expect([...numbersIn(text)]).toEqual(['12', '5', '27']);
  });
});
