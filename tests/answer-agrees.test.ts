import { describe, expect, it } from 'vitest';
import { answersEquivalent } from '@/lib/grade/equivalence';
import { componentsEquivalent } from '@/lib/grade/components';
import { readInputShape } from '@/lib/grade/input-shape';
import { slotDisagreements, questionDisagreements } from '@/lib/grade/answer-agrees';
import { approvalGate } from '@/lib/generation/approve-gate';

/**
 * Found on a live attempt: a unit vector written `2/√29` was refused against a
 * canonical of `\frac{2}{\sqrt{29}}`, and all three marks went with it. A surd
 * evaluated, a fraction evaluated, and the two together did not — the braces
 * nest and one pass of `[^{}]+` cannot see past them.
 */
const UNIT_VECTOR = '\\begin{pmatrix}\\frac{2}{\\sqrt{29}}\\\\\\frac{5}{\\sqrt{29}}\\end{pmatrix}';
const RATIONALISED = '\\begin{pmatrix}\\frac{2\\sqrt{29}}{29}\\\\\\frac{5\\sqrt{29}}{29}\\end{pmatrix}';

describe('a surd inside a fraction', () => {
  it('evaluates, however the same value is written', () => {
    for (const written of ['2/√29', '2/sqrt(29)', '2/\\sqrt{29}', '\\frac{2}{\\sqrt{29}}', '\\frac{2\\sqrt{29}}{29}']) {
      expect(answersEquivalent(written, '\\frac{2}{\\sqrt{29}}'), written).toBe(true);
    }
    expect(answersEquivalent('\\frac{2}{\\sqrt{29}}', '0.371390676')).toBe(true);
  });

  it('is still wrong when it is wrong', () => {
    expect(answersEquivalent('\\frac{3}{\\sqrt{29}}', '\\frac{2}{\\sqrt{29}}')).toBe(false);
    expect(answersEquivalent('2/√28', '\\frac{2}{\\sqrt{29}}')).toBe(false);
  });

  it('nests further than one level', () => {
    expect(answersEquivalent('\\frac{1}{\\sqrt{\\frac{4}{9}}}', '1.5')).toBe(true);
  });

  it('marks the attempt that found it: the boxes the student typed', () => {
    const boxes = ['2/√29', '5/√29'];
    expect(readInputShape(UNIT_VECTOR).boxes).toBe(2);
    expect(componentsEquivalent(boxes, UNIT_VECTOR, [RATIONALISED], null)).toBe(true);
  });

  it('and the two forms that question declares agree with each other', () => {
    expect(componentsEquivalent(readInputShape(UNIT_VECTOR).values, RATIONALISED, undefined, null)).toBe(true);
  });
});

const slot = (over: Record<string, unknown> = {}) => ({ label: 'i', response_mode: 'answer', ...over });

describe('a slot that disagrees with itself', () => {
  it('passes when the accept list means what the canonical means', () => {
    expect(slotDisagreements('d.i', slot({ answer: UNIT_VECTOR, accept: [RATIONALISED] }))).toEqual([]);
  });

  it('reports an accept entry that is a different value', () => {
    const found = slotDisagreements('a.i', slot({ answer: '12', accept: ['13'] }));

    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ ref: 'a.i', kind: 'accept', failure: '13' });
  });

  it('does not check a prose alternative, which is a phrasing and not a value', () => {
    // "No" beside "cannot" is doing real work at marking time and will never
    // compare equal; a check that flagged it would refuse good questions.
    expect(slotDisagreements('d.i', slot({ answer: 'cannot', accept: ['No'] }))).toEqual([]);
    expect(slotDisagreements('b.i', slot({ answer: '1 h 15 min', accept: ['75 min'] }))).toEqual([]);
  });

  it('reports a canonical that does not survive a value-preserving rewrite', () => {
    const found = slotDisagreements('a.i', slot({ answer: '18\\ 000' }));
    expect(found.map((f) => f.failure)).toContain('spacing commands removed');
  });

  it('leaves a matrix alone: \\\\ is a row separator, not a space', () => {
    expect(slotDisagreements('c.i', slot({ answer: '\\begin{pmatrix}40 \\\\ 50\\end{pmatrix}' }))).toEqual([]);
  });

  it('says nothing about a slot the student does not type into', () => {
    expect(slotDisagreements('a.i', slot({ answer: 'a straight line', response_mode: 'construct', accept: ['a line'] }))).toEqual([]);
  });

  it('groups a finding by the notation that caused it', () => {
    const found = slotDisagreements('a.i', slot({ answer: '\\frac{1}{\\sqrt{2}}', accept: ['\\frac{1}{\\sqrt{3}}'] }));
    expect(found[0].notation).toEqual(['\\frac', '\\sqrt']);
  });
});

describe('the approval gate', () => {
  const draft = (slots: Record<string, unknown>[]) =>
    ({ parts: [{ label: 'a', prompt: 'p', marks: 1, slots }], stem: 's' }) as never;
  const solved = async () => ({ agrees: true }) as never;

  it('refuses a question whose accept list disagrees with its answer', async () => {
    const res = await approvalGate(draft([slot({ answer: '12', accept: ['13'] })]), solved);

    expect(res.ok).toBe(false);
    expect(res.reason).toContain('disagrees with itself');
    expect(res.reason).toContain('(a.i)');
  });

  it('lets a question through when it agrees with itself', async () => {
    expect(await approvalGate(draft([slot({ answer: UNIT_VECTOR, accept: [RATIONALISED] })]), solved)).toEqual({ ok: true });
  });

  it('refuses before it asks a model anything', async () => {
    let asked = false;
    await approvalGate(draft([slot({ answer: '12', accept: ['13'] })]), async () => {
      asked = true;
      return { agrees: true } as never;
    });

    expect(asked, 'a broken question costs no model call').toBe(false);
  });

  it('finds a disagreement in any part, not only the first', async () => {
    const two = { parts: [{ label: 'a', prompt: 'p', marks: 1, slots: [slot({ answer: '12' })] }, { label: 'b', prompt: 'p', marks: 1, slots: [slot({ answer: '5', accept: ['6'] })] }], stem: 's' } as never;
    expect(questionDisagreements((two as { parts: never[] }).parts)).toHaveLength(1);
    expect((await approvalGate(two, solved)).reason).toContain('(b.i)');
  });
});
