import { describe, expect, it } from 'vitest';
import { GRADER_VERSION, questionFingerprint } from '@/lib/grade/version';

// An attempt records a verdict. Without a stamp, a later marking change can be
// described but not audited: nothing says which marker produced the verdict, or
// whether the question has been edited since.

const question = {
  marks: 5,
  parts: [
    {
      label: 'a',
      slots: [
        { label: 'i', answer: '42', accept: ['forty-two'], answer_format: 'integer', response_mode: 'answer' },
        { label: 'ii', answer: 'because it is', response_mode: 'explain' },
      ],
    },
  ],
  rubric: [
    { slot_ref: 'a.i', mark_value: 4 },
    { slot_ref: 'a.ii', mark_value: 1 },
  ],
};

describe('the question fingerprint', () => {
  it('is stable for the same marking surface', () => {
    expect(questionFingerprint(question)).toBe(questionFingerprint(structuredClone(question)));
  });

  it('ignores everything a verdict does not depend on', () => {
    // A typo fixed in a stem cannot change how an answer was marked. Hashing
    // the whole document would invalidate the audit trail every time someone
    // corrected one.
    const reworded = { ...question, stem: 'entirely different wording', worked_solution: 'x' };
    expect(questionFingerprint(reworded as never)).toBe(questionFingerprint(question));
  });

  it('changes when anything the marker reads changes', () => {
    const base = questionFingerprint(question);
    const edit = (f: (q: typeof question) => void) => {
      const q = structuredClone(question);
      f(q);
      return questionFingerprint(q);
    };
    expect(edit((q) => (q.parts[0].slots[0].answer = '43'))).not.toBe(base);
    expect(edit((q) => q.parts[0].slots[0].accept!.push('42.0'))).not.toBe(base);
    expect(edit((q) => (q.parts[0].slots[0].answer_format = 'dp:1'))).not.toBe(base);
    expect(edit((q) => (q.parts[0].slots[1].response_mode = 'answer'))).not.toBe(base);
    expect(edit((q) => (q.rubric[0].mark_value = 3))).not.toBe(base);
    expect(edit((q) => (q.marks = 6))).not.toBe(base);
  });

  it('does not depend on the order things were written in', () => {
    const shuffled = structuredClone(question);
    shuffled.rubric.reverse();
    shuffled.parts[0].slots[0].accept = ['forty-two'];
    expect(questionFingerprint(shuffled)).toBe(questionFingerprint(question));
  });

  it('names a grader version that changes when marking does', () => {
    // Bumped whenever a verdict could change: v3 adds products typed with any
    // multiplication sign, and percent's omitted-unit leniency.
    expect(GRADER_VERSION).toBe('v3');
  });
});
