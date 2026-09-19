import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { claimsFor, deriveTemplate, questionText, renderClaim, scopeOf, type ScopeSlot } from '@/lib/grade/claim-template';

// ROUND_5 Task 1: a criterion becomes a claim by replacing every literal that
// is a canonical value in scope with a reference. Constants stay; anything
// two-faced is reported, not guessed.
const cocoa = new Map<string, ScopeSlot>([
  ['a.i', { ref: 'a.i', answer: '144 000' }],
  ['b.i', { ref: 'b.i', answer: '1 056 000', depends_on: ['a.i'] }],
  ['b.ii', { ref: 'b.ii', answer: '88%', depends_on: ['b.i'] }],
  ['c.ii', { ref: 'c.ii', answer: '$2.4 \\times 10^4$', depends_on: ['b.i'] }],
]);
const text = 'A cocoa farmer sorts a harvest of 1 200 000 cocoa beans. 12% are rejected. at least 90% suitable';

describe('deriveTemplate', () => {
  it('references the value of a slot in scope and keeps question constants', () => {
    const d = deriveTemplate({ criterion: 'Subtracts "their" 144 000 from 1 200 000', slotRef: 'b.i', slots: cocoa, questionText: text });
    expect(d.template).toBe('Subtracts "their" {a.i} from 1 200 000');
    expect(d.refs).toEqual(['a.i']);
  });

  it('reads a percentage against a slot stored as one', () => {
    const d = deriveTemplate({ criterion: 'CAO $88\\%$', slotRef: 'b.ii', slots: cocoa, questionText: text });
    expect(d.template).toBe('CAO ${b.ii}\\%$');
  });

  it('never reaches outside the depends_on chain', () => {
    // c.ii depends on b.i, not on b.ii: 88 in a row on c.ii stays literal.
    const d = deriveTemplate({ criterion: 'Uses 88% and 1 056 000', slotRef: 'c.ii', slots: cocoa, questionText: text });
    expect(d.template).toBe('Uses 88% and {b.i}');
  });

  it('reports a literal that is both a constant and an answer', () => {
    const slots = new Map<string, ScopeSlot>([['a.i', { ref: 'a.i', answer: '12' }]]);
    const d = deriveTemplate({ criterion: 'Obtains 12', slotRef: 'a.i', slots, questionText: 'Twelve is written as 12 here.' });
    expect(d.template).toBe('Obtains 12');
    expect(d.ambiguous).toMatch(/12 is a question constant and the value of a\.i/);
  });

  it('reports a literal that matches two slots', () => {
    const slots = new Map<string, ScopeSlot>([
      ['a.i', { ref: 'a.i', answer: '5' }],
      ['b.i', { ref: 'b.i', answer: '5', depends_on: ['a.i'] }],
    ]);
    const d = deriveTemplate({ criterion: 'Obtains 5', slotRef: 'b.i', slots, questionText: '' });
    expect(d.ambiguous).toMatch(/5 matches (a\.i and b\.i|b\.i and a\.i)/);
    expect(d.template).toBe('Obtains 5');
  });

  it('is the spec example: the divisor and the result are the same digit', () => {
    const slots = new Map<string, ScopeSlot>([
      ['b.iqr', { ref: 'b.iqr', answer: '4' }],
      ['c.i', { ref: 'c.i', answer: '2', depends_on: ['b.iqr'] }],
    ]);
    const d = deriveTemplate({ criterion: 'Halves "their" interquartile range: $4\\div2=2$', slotRef: 'c.i', slots, questionText: 'Show that the semi-interquartile range is 2 minutes.' });
    expect(d.ambiguous).toMatch(/2 is a question constant/);
  });

  it('leaves a multi-value slot alone: a component is not the slot', () => {
    const slots = new Map<string, ScopeSlot>([['a.i', { ref: 'a.i', answer: '18 kg, 27 kg, 36 kg' }]]);
    const d = deriveTemplate({ criterion: 'Gives 18', slotRef: 'a.i', slots, questionText: '' });
    expect(d.template).toBe('Gives 18');
    expect(d.refs).toEqual([]);
  });

  it('walks depends_on transitively', () => {
    expect(scopeOf('c.ii', cocoa).map((s) => s.ref)).toEqual(['c.ii', 'b.i', 'a.i']);
  });
});

/**
 * WHAT COUNTS AS A QUESTION CONSTANT. Both of these refused real questions:
 * four of six refusals were a figure's own numbers, and the fifth was an
 * inequality reduced to the bound the stem had given it.
 */
describe('the constants a criterion can collide with', () => {
  const drawn = {
    stem: 'The graph shows the delivery charge.',
    parts: [{ label: 'a', prompt: 'Calculate the gradient.', slots: [{ label: 'i', answer: '2' }] }],
    visual: { params: { points: [{ x: 0, y: 5 }, { x: 2, y: 9 }], lines: [{ m: 2, c: 5 }] } },
    stimulus_table: { rows: [['0', '$5'], ['2', '$9']] },
  };

  it('does not take a figure\u2019s coordinates, bar heights or table cells as constants', () => {
    // A gradient of 2 on a graph that passes through x = 2 collided every time,
    // and km collided with minutes: the figure has no units to tell them apart.
    expect(questionText(drawn)).not.toContain('points');
    expect(questionText(drawn)).not.toContain('rows');
    const d = deriveTemplate({
      criterion: 'CAO $2$',
      slotRef: 'a.i',
      slots: new Map([['a.i', { ref: 'a.i', answer: '2' }]]),
      questionText: questionText(drawn),
    });
    expect(d.ambiguous).toBeUndefined();
    expect(d.template).toBe('CAO ${a.i}$');
  });

  it('still reads the statement, the prompts and the stem', () => {
    const text = questionText({
      stem: 'A factory checks a batch.',
      parts: [{ label: 'a', prompt: 'Complete.', statement: 'The required proportion is $55\\%$. {}', slots: [{ label: 'i', answer: '55\\%', prompt: 'the batch' }] }],
    });
    expect(text).toContain('55');
    expect(text).toContain('the batch');
  });

  it('gives a relation no value of its own, so its bound stays the question\u2019s', () => {
    // "$18x - 36 \\ge 180$" read as 180, so forming the inequality collided
    // with the target the stem had already stated.
    const d = deriveTemplate({
      criterion: 'Forms $18x - 36 \\ge 180$',
      slotRef: 'a.i',
      slots: new Map([['a.i', { ref: 'a.i', answer: '$18x - 36 \\ge 180$' }]]),
      questionText: 'He wants his earnings to be at least \\$180.',
    });
    expect(d.ambiguous).toBeUndefined();
    expect(d.refs).toEqual([]);
    expect(d.template).toBe('Forms $18x - 36 \\ge 180$');
  });
});

describe('renderClaim', () => {
  const canonical = { 'a.i': '144 000', 'b.i': '1 056 000' };
  it('puts the student’s confirmed answer where the reference is', () => {
    expect(renderClaim('Subtracts "their" {a.i} from 1 200 000', { 'a.i': '140 000' }, canonical)).toBe(
      'Subtracts "their" 140 000 from 1 200 000',
    );
  });
  it('falls back to the canonical value where the student left the slot empty', () => {
    expect(renderClaim('Divides {b.i} by 1 200 000', { 'b.i': '' }, canonical)).toBe('Divides 1 056 000 by 1 200 000');
    expect(renderClaim('Divides {b.i} by 1 200 000', {}, canonical)).toBe('Divides 1 056 000 by 1 200 000');
  });
  it('gives the marker the claim and keeps the criterion for the record', () => {
    const rows = claimsFor([{ criterion: 'CAO 88%', template: 'CAO {b.ii}' }], { 'b.ii': '80%' }, { 'b.ii': '88%' });
    expect(rows[0]).toMatchObject({ criterion: 'CAO 88%', claim: 'CAO 80%' });
  });
  it('drops the student’s own delimiters and unit signs where the criterion writes them', () => {
    expect(renderClaim('Calculates $\\frac{\\text{their }{c.i}}{40} \\times 100 = {d.i}\\%$', { 'c.i': '$28$', 'd.i': '70%' }, {})).toBe(
      'Calculates $\\frac{\\text{their }28}{40} \\times 100 = 70\\%$',
    );
    expect(renderClaim('Solves to obtain $n={c.number}$', { 'c.number': '$6$' }, {})).toBe('Solves to obtain $n=6$');
    expect(renderClaim('CAO ${b.ii}\\%$', { 'b.ii': '80%' }, { 'b.ii': '88%' })).toBe('CAO $80\\%$');
    expect(renderClaim('an angle of {a.i}°', { 'a.i': '45°' }, {})).toBe('an angle of 45°');
  });

  // The fallback this replaced — claimsFor reading `template ?? criterion` —
  // marked a row against the author's literals and said nothing. A row with no
  // template is refused by the approval gate now, and the type here no longer
  // admits one, so the substitution cannot be written by accident.
  it('renders from the template, which every row must carry', () => {
    expect(claimsFor([{ criterion: 'Adds {a.i}', template: 'Adds {a.i}' }], { 'a.i': '7' }, {})[0].claim).toBe('Adds 7');
  });
});

describe('the marker prompt after ROUND_5', () => {
  it('states the one sentence and has lost the three rules it replaces', () => {
    const src = readFileSync(join(process.cwd(), 'lib', 'grade', 'mark-method.ts'), 'utf8');
    expect(src).toContain("A CRITERION IS ALREADY WRITTEN FOR THIS STUDENT'S OWN VALUES; DECIDE WHETHER\nTHE PAGE SHOWS IT.");
    expect(src).not.toMatch(/ANY NUMBER PRINTED IN A FOLLOW-THROUGH CRITERION|"THEIR", FULLY|NO QUOTE, NO AWARD/i);
    expect(src).toMatch(/A QUANTITY:[\s\S]*A CONCLUSION:[\s\S]*A COMPARISON DIRECTION:[\s\S]*A SCALAR:[\s\S]*A VALID ALTERNATIVE METHOD EARNS THE ROWS FOR THE STEP/);
    expect(src).toMatch(/CRITERION: \$\{r\.claim \?\? r\.criterion\}/);
    // The quote survives as output format.
    expect(src).toMatch(/the reason quotes the line that earned it/);
  });
});
