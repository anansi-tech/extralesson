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

  it('no longer reports digit grouping, which is what the comparator fix was', () => {
    // `18\ 000` is eighteen thousand however the space is written. This case
    // failed before the spacing commands were stripped ahead of the grouper.
    expect(slotDisagreements('a.i', slot({ answer: '18\\ 000' }))).toEqual([]);
    expect(slotDisagreements('a.i', slot({ answer: '$3\\ 080\\text{ L}$' }))).toEqual([]);
  });

  it('runs every rewrite, and each one preserves the value', () => {
    // The rewrites are notations a student may type. A canonical that stops
    // meaning the same thing under one of them is a slot nobody can answer, so
    // each is exercised here on a value that uses it.
    for (const answer of ['\\left(2 \\times 3\\right)', '12 \\div 4', 'x^2 + x^3', '18\\ 000', '2\\,000']) {
      expect(slotDisagreements('a.i', slot({ answer })), answer).toEqual([]);
    }
  });

  it('leaves a matrix alone: \\\\ is a row separator, not a space', () => {
    expect(slotDisagreements('c.i', slot({ answer: '\\begin{pmatrix}40 \\\\ 50\\end{pmatrix}' }))).toEqual([]);
  });

  it('says nothing about a slot the student does not type into', () => {
    expect(slotDisagreements('a.i', slot({ answer: 'a straight line', response_mode: 'construct', accept: ['a line'] }))).toEqual([]);
  });

  /**
   * A VALUE NOTHING CAN EVALUATE IS SAID, NEVER ABSTAINED ON. It falls through
   * to a STRING comparison, where it equals itself and nothing else — so the
   * checks above pass for the wrong reason, and the sweep called the question
   * fine. \sqrt[3]{X} sat there for the life of the bank.
   */
  it('reports a canonical the comparator cannot evaluate', () => {
    const found = slotDisagreements('a.i', slot({ answer: '$a \\star b = 2a + b$' }));

    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ ref: 'a.i', kind: 'unparseable' });
    expect(found[0].failure).toContain('the answer cannot be evaluated');
    expect(found[0].failure, 'and how it was read').toContain('expression');
  });

  it('reports an accept entry it cannot evaluate, beside a canonical it can', () => {
    const found = slotDisagreements('a.i', slot({ answer: '12', accept: ['$a \\star b = 2a + b$'] }));
    expect(found.filter((f) => f.kind === 'unparseable')).toHaveLength(1);
    expect(found.find((f) => f.kind === 'unparseable')!.failure).toContain('accept');
  });

  it('says nothing about prose, which is compared as words on purpose', () => {
    // "No" beside "cannot" is doing real work at marking time; a value read as
    // a word is not an abstention, it is a different comparison.
    expect(slotDisagreements('d.i', slot({ answer: 'cannot', accept: ['No'] }))).toEqual([]);
    expect(slotDisagreements('d.i', slot({ answer: 'a straight line' }))).toEqual([]);
  });

  it('says nothing about a value it can evaluate, of any shape', () => {
    for (const answer of ['42', '5 cm', '(2, 5)', '\\begin{pmatrix}3\\\\-2\\end{pmatrix}', 'y = 2x + 3', '$\\sqrt[3]{27}$',
      '$2 \\le x \\le 7$', '$\\{x \\in \\mathbb{R} : 0 < x \\le 12\\}$', '$2\\mathbf{b}-\\mathbf{a}$', 'non-square']) {
      expect(slotDisagreements('a.i', slot({ answer })).filter((f) => f.kind === 'unparseable'), answer).toEqual([]);
    }
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
    expect(await approvalGate(draft([slot({ answer: UNIT_VECTOR, accept: [RATIONALISED] })]), solved))
      .toEqual({ ok: true, failed: [], tolerated: [] });
  });

  it('refuses before it asks a model anything', async () => {
    let asked = false;
    await approvalGate(draft([slot({ answer: '12', accept: ['13'] })]), async () => {
      asked = true;
      return { agrees: true } as never;
    });

    expect(asked, 'a broken question costs no model call').toBe(false);
  });

  it('refuses a question whose own answers nothing here can check', async () => {
    const res = await approvalGate(draft([slot({ answer: '$a \\star b = 2a + b$' })]), solved);

    expect(res.ok).toBe(false);
    expect(res.reason).toContain('cannot evaluate');
    expect(res.reason, 'and not as a disagreement, which it is not').not.toContain('disagrees with itself');
  });

  it('says which fault it is when a question has both', async () => {
    const res = await approvalGate(draft([slot({ answer: '12', accept: ['13'] }), slot({ label: 'ii', answer: '$a \\star b = 2a + b$' })]), solved);
    // A wrong accept list is the stronger claim and is said first.
    expect(res.reason).toContain('disagrees with itself');
  });

  /**
   * WHOSE FAULT THE REFUSAL IS. The last check is a model answering the
   * question and comparing, so it can refuse on one run and pass on the next.
   * An operator shown only "disagreed" reads it as a verdict on their edit, and
   * the card can only say otherwise if the gate says which kind it is.
   */
  it('names the independent solve as a model check, not a rule', async () => {
    const disagreed = async () => ({ agrees: false, draftAnswer: '12', solveAnswer: '13' }) as never;
    const res = await approvalGate(draft([slot({ answer: '12' })]), disagreed);

    expect(res.ok).toBe(false);
    expect(res.kind).toBe('model');
    expect(res.reason).toContain('independent solve disagreed');
  });

  it('and every other refusal as the question, which does not vary', async () => {
    for (const bad of [
      draft([slot({ answer: '12', accept: ['13'] })]),
      draft([slot({ answer: '$a \\star b = 2a + b$' })]),
    ]) {
      const res = await approvalGate(bad, solved);
      expect(res.ok).toBe(false);
      expect(res.kind, res.reason).toBe('question');
    }
  });

  /**
   * A FAULT THAT WAS ALREADY THERE DOES NOT REFUSE AN EDIT IT HAS NOTHING TO DO
   * WITH. 804a29 could not take a one-mark correction on part (b) because a
   * slot accepted a reordered pair; four more could not because a cloze blank
   * restates a value. The gate refused the whole save on a fault the save did
   * not introduce and did not touch.
   */
  it('a question with a known self-disagreement takes an edit to another part', async () => {
    const broken = draft([
      slot({ answer: '12', accept: ['13'] }),
      slot({ label: 'ii', answer: '5' }),
    ]);

    expect((await approvalGate(broken, solved)).ok, 'refused when nothing is known').toBe(false);

    const res = await approvalGate(broken, solved, ['self_disagreement']);
    expect(res.ok, 'and allowed when the last run already found it').toBe(true);
    expect(res.tolerated, 'said, never silently').toContain('self_disagreement');
    expect(res.failed).toContain('self_disagreement');
  });

  it('but a fault the edit introduces still refuses', async () => {
    const res = await approvalGate(draft([slot({ answer: '12', accept: ['13'] })]), solved, ['unparseable']);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('disagrees with itself');
  });

  it('names every check that failed, not only the one that refused', async () => {
    const res = await approvalGate(
      draft([slot({ answer: '12', accept: ['13'] }), slot({ label: 'ii', answer: '$a \\star b = 2a + b$' })]),
      solved,
    );
    expect(res.failed).toEqual(expect.arrayContaining(['self_disagreement', 'unparseable']));
  });

  it('and the solve is not excused by a result that never recorded it', async () => {
    const disagreed = async () => ({ agrees: false, draftAnswer: '12', solveAnswer: '13' }) as never;
    const res = await approvalGate(draft([slot({ answer: '12' })]), disagreed, ['self_disagreement']);
    expect(res.ok, 'we have not asked is not we know it was broken').toBe(false);
    expect(res.kind).toBe('model');

    const excused = await approvalGate(draft([slot({ answer: '12' })]), disagreed, ['solve']);
    expect(excused.ok, 'once a run has recorded it, it reports instead').toBe(true);
    expect(excused.tolerated).toContain('solve');
  });

  it('finds a disagreement in any part, not only the first', async () => {
    const two = { parts: [{ label: 'a', prompt: 'p', marks: 1, slots: [slot({ answer: '12' })] }, { label: 'b', prompt: 'p', marks: 1, slots: [slot({ answer: '5', accept: ['6'] })] }], stem: 's' } as never;
    expect(questionDisagreements((two as { parts: never[] }).parts)).toHaveLength(1);
    expect((await approvalGate(two, solved)).reason).toContain('(b.i)');
  });
});

describe('a probe must not break the answer it is probing', () => {
  it('stripping \\left and \\right leaves \\rightarrow alone', () => {
    // The rewrite asked whether "f: x arrow (x-60)/25" is the same answer, and
    // reported the question when it was not.
    expect(slotDisagreements('a.i', slot({ answer: 'f^{-1}: x \\rightarrow \\frac{x-60}{25}' }))).toEqual([]);
  });
});
