import { describe, expect, it } from 'vitest';
import { ANSWER_REF_RE, SLOT_REF_RE } from '@/lib/notation';

// A submitted answer is addressed either by slot ('a.ii') or, for an MCQ that
// has one answer and no slots to tell apart, by the bare part label ('a').
// Validating with SLOT_REF_RE alone rejected every MCQ submission there has
// ever been — the dot is not optional there — and the student saw "Invalid
// submission." 164 approved MCQs sat in the bank with no attempt against any of
// them, and nothing surfaced it until a diagnostic session put them in front of
// someone, because every other session had been structured questions.
describe('ANSWER_REF_RE — what a submitted answer may be addressed by', () => {
  it('accepts the bare part label an MCQ submits', () => {
    expect(ANSWER_REF_RE.test('a')).toBe(true);
    expect(SLOT_REF_RE.test('a')).toBe(false); // the regression, kept visible
  });

  it('still accepts every slot reference', () => {
    for (const ref of ['a.i', 'b.ii', 'd.carton_sizes', 'c.shares']) {
      expect(ANSWER_REF_RE.test(ref)).toBe(true);
    }
  });

  it('still rejects what is not a reference at all', () => {
    for (const junk of ['', 'a.', '.i', 'k', 'a b', '1']) {
      expect(ANSWER_REF_RE.test(junk)).toBe(false);
    }
  });
});
