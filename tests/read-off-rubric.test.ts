import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { readOffSlots } from '@/lib/generation/read-off';

const slot = (rows: [string, string, number?][]) => ({
  rubric: rows.map(([code, criterion, m]) => ({ code, slot_ref: 'a.i', mark_value: m ?? 1, criterion })),
});

/**
 * DETERMINISTIC, BECAUSE THE MODEL FLAG WAS NOT. Asking the solver whether an
 * answer was "readable off the figure" agreed with itself on 42 of 63 slots
 * across three runs of the whole bank — a third of what it refused was noise,
 * and a gate needs a reason that does not change between two presses of Save.
 */
describe('a slot whose whole rubric is reading', () => {
  it('is found when it pays two marks or more', () => {
    expect(readOffSlots(slot([['CK1', 'Identifies that the $y$-intercept occurs when $x=0$'], ['R1', 'CAO $(0,12)$']]))).toHaveLength(1);
    expect(readOffSlots(slot([['R1', 'Reads the fare corresponding to $4$ km from the graph'], ['AK1', 'CAO \\$22']]))).toHaveLength(1);
    expect(readOffSlots(slot([['CK1', 'Identifies red, blue and green as the possible colours'], ['AK1', 'States a valid sample space']]))).toHaveLength(1);
  });

  it('and left alone at one mark, which the papers set constantly', () => {
    expect(readOffSlots(slot([['R1', 'Reads the $y$-intercept as $(0,12)$']]))).toEqual([]);
  });

  it('a row that names WORK is not a row that names reading', () => {
    // "CAO" is a marking convention and attaches to any final-answer row,
    // including one that was earned. These three are the cases it must not fire
    // on, and each is a one-step calculation over a value the figure supplies.
    expect(readOffSlots(slot([['CK1', 'Substitutes $x=2$ into $f(x)$'], ['AK1', 'Evaluates $-2^2+8(2)$ to obtain $12$']]))).toEqual([]);
    expect(readOffSlots(slot([['CK1', 'Identifies $g(2) = -(2)^2 + 8(2)$'], ['AK1', 'Evaluates $g(2) = 12$']]))).toEqual([]);
    expect(readOffSlots(slot([['CK1', 'Substitutes $t=1$ into the mapping for $f$'], ['AK1', 'CAO $5$']]))).toEqual([]);
    expect(readOffSlots(slot([['CK3', 'Recognises that $gf(x) = g(f(x))$'], ['AK4', 'Substitutes "their" $f(x)$ into $g$ and simplifies, CAO $2x + 7$']]))).toEqual([]);
  });

  it('but not every reading rubric is one this can see', () => {
    // 6a528f pays two marks for a vector read off a grid, one row per
    // component. Neither row reads, states nor awards CAO — they say "uses" —
    // so the rule does not reach it, and the same shape is why it could not be
    // reduced to one mark mechanically either.
    expect(readOffSlots(slot([
      ['CK1', 'Uses $-3$ as the first component of $\\overrightarrow{OA}$'],
      ['CK2', 'Uses $2$ as the second component of $\\overrightarrow{OA}$'],
    ]))).toEqual([]);
  });
});

describe('the generation recipe', () => {
  it('tells the writer a figure read is worth one mark', () => {
    const prompt = readFileSync('lib/prompts/question-gen.ts', 'utf8');
    expect(prompt).toContain('READING A VALUE OFF THE FIGURE IS WORTH ONE MARK, NEVER TWO');
    expect(prompt).toMatch(/an intercept on a drawn line, a labelled point, a component read off a grid/);
  });
});
