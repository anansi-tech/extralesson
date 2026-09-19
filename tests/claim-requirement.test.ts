import { describe, expect, it } from 'vitest';
import { deriveTemplate, questionText, renderClaim, type ScopeSlot } from '@/lib/grade/claim-template';

/**
 * ONLY THE STUDENT'S VALUE IS A REFERENCE. A requirement the question fixes is
 * a constant and stays literal — templated, it makes the claim true of any
 * number: "an amount equal to 67.3% satisfies the condition at least 67.3%".
 *
 * d16f3a said exactly that. deriveTemplate would have refused: it reports a
 * literal that is both a question constant and a slot's value as ambiguous and
 * leaves it alone. It never saw 55 as a constant because the requirement is
 * written in part (c)'s cloze STATEMENT, which questionText did not collect.
 */
const QUESTION = {
  stem: 'Answer the questions using the Venn diagram.',
  stimulus: '',
  parts: [
    { label: 'b', prompt: 'Calculate the percentage of all customers who ordered cement.', slots: [{ label: 'i', answer: '55%' }] },
    {
      label: 'c',
      prompt: 'Complete the statement below.',
      statement: 'Since the percentage is {} the required $55\\%$, a cement delivery {} be arranged.',
      slots: [{ label: 'comparison', answer: 'equal to' }, { label: 'difference', answer: '0' }],
    },
  ],
};

const slots = new Map<string, ScopeSlot>([
  ['b.i', { ref: 'b.i', answer: '55%' }],
  ['c.comparison', { ref: 'c.comparison', answer: 'equal to', depends_on: ['b.i'] }],
  ['c.difference', { ref: 'c.difference', answer: '0', depends_on: ['b.i'] }],
]);

const CRITERION = 'Recognises that an amount equal to $55\\%$ satisfies the condition “at least $55\\%$”.';

describe('a fixed requirement stays literal', () => {
  it('the cloze statement counts as question text, which is why this happened', () => {
    expect(questionText(QUESTION as never), 'the requirement is only in the statement').toContain('55');
    const withoutStatement = { ...QUESTION, parts: QUESTION.parts.map((p) => ({ ...p, statement: undefined })) };
    expect(questionText(withoutStatement as never)).not.toContain('55\\%');
  });

  it('is reported as ambiguous once the statement is read, and left alone', () => {
    const derived = deriveTemplate({ criterion: CRITERION, slotRef: 'c.comparison', slots, questionText: questionText(QUESTION as never) });
    expect(derived.ambiguous).toContain('55');
    expect(derived.refs, 'nothing templated').toEqual([]);
    expect(derived.template, 'the criterion, untouched').toBe(CRITERION);
  });

  it('was templated only because the statement was invisible', () => {
    const blind = { ...QUESTION, parts: QUESTION.parts.map((p) => ({ ...p, statement: undefined })) };
    const derived = deriveTemplate({ criterion: CRITERION, slotRef: 'c.comparison', slots, questionText: questionText(blind as never) });
    expect(derived.ambiguous, 'the guard never fired').toBeUndefined();
    expect(derived.template).toContain('{b.i}');
  });

  it('the repaired templates make a claim that can be false', () => {
    const canonical = { 'b.i': '55%', 'c.difference': '0' };
    const theirs = { 'b.i': '67.3%', 'c.difference': '12.3' };
    const ck3 = 'Recognises that an amount equal to ${b.i}\\%$ satisfies the condition “at least $55\\%$”.';
    const ak4 = 'Calculates the difference between "their" percentage and $55\\%$ as ${c.difference}$ percentage points.';

    // Their value is theirs; the requirement is the question's.
    expect(renderClaim(ck3, theirs, canonical)).toBe(
      'Recognises that an amount equal to $67.3\\%$ satisfies the condition “at least $55\\%$”.',
    );
    expect(renderClaim(ak4, theirs, canonical)).toBe(
      'Calculates the difference between "their" percentage and $55\\%$ as $12.3$ percentage points.',
    );
    // The fault it replaces: both halves moved together, so nothing was claimed.
    const tautology = 'Recognises that an amount equal to ${b.i}\\%$ satisfies the condition “at least ${b.i}\\%$”.';
    const said = renderClaim(tautology, theirs, canonical);
    expect(said.match(/67\.3/g), 'the requirement moved with their answer').toHaveLength(2);
  });
});

/**
 * A CAO ROW MUST NOT FOLLOW THROUGH. "Divides 72 by 30, CAO {a.i}" renders as
 * "CAO <whatever they wrote>", which every answer satisfies — the one thing
 * CAO exists to refuse. d16fbd AK2 said exactly that, because 2.4 is both the
 * answer to (a) and a constant printed in part (c)'s statement.
 */
describe('a CAO row states the answer, not theirs', () => {
  const canonical = { 'a.i': '2.4' };

  it('renders the same claim whatever the student wrote', () => {
    const fixed = 'Divides $72$ by $30$, CAO $2.4$';
    expect(renderClaim(fixed, { 'a.i': '3.1' }, canonical)).toBe(fixed);
    expect(renderClaim(fixed, {}, canonical)).toBe(fixed);
  });

  it('the fault it replaces agreed with any answer at all', () => {
    const templated = 'Divides $72$ by $30$, CAO ${a.i}$';
    expect(renderClaim(templated, { 'a.i': '3.1' }, canonical)).toContain('3.1');
    expect(renderClaim(templated, { 'a.i': '999' }, canonical)).toContain('999');
  });
});

/**
 * A REFERENCE ON THE ROW'S OWN SLOT IS STILL THEIRS. c0bf0b AK1 was flagged by
 * the same re-derivation, and is right as it stands: the 24 is the result of
 * 3x8, which IS a.i, so a student who answers 20 gets a claim that is false and
 * can be refused.
 */
describe('the row own slot keeps its reference', () => {
  it('makes a claim that fails when their value is wrong', () => {
    const ak1 = 'Calculates $3\\times8={a.i}$.';
    expect(renderClaim(ak1, { 'a.i': '20' }, { 'a.i': '24' })).toBe('Calculates $3\\times8=20$.');
  });

  it('and a follow-through reference beside a constant still can be false', () => {
    // c0bf0b AK4: their H.C.F. stays a reference, the 24 and 36 do not.
    const ak4 = 'Substitutes ${b.iii}$ and calculates $\\frac{24\\times36}{{b.iii}}=72$.';
    const said = renderClaim(ak4, { 'b.iii': '6' }, { 'b.iii': '12' });
    expect(said).toContain('24\\times36');
    expect(said).toContain('{6}');
    expect(said, 'the target stays the question own').toContain('=72');
  });
});
