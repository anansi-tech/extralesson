import { describe, expect, it } from 'vitest';
import { markStructuredParts, markableSlots } from '@/lib/grade/mark';
import { markSplit } from '@/lib/grade/assessable';
import type { RubricItem } from '@/lib/types';

/**
 * VERDICT, SCORE AND CHIPS CANNOT DISAGREE.
 *
 * A student saw all three contradict each other twice in one evening:
 *   d0dc6a  11 out of 11, every chip ticked, "Not quite" — two answers wrong
 *   c0c05d   9 out of 9,  every chip ticked, "Not quite" — nothing wrong
 *
 * They had three separate causes, and the invariant only holds once all three
 * are gone, which is why it is asserted rather than described:
 *   1. method marks awarded from a working box that belongs to the whole
 *      question, on slots the student got wrong
 *   2. a declared answer_format with no for_format row to pay for it: missing
 *      the form cost nothing and still failed the answer
 *   3. an auto-marked slot carrying no rubric row: a miss cost nothing and
 *      still failed the answer
 *
 * THE INVARIANT: an attempt is "correct" exactly when every mark on offer was
 * earned. Self-marked slots are on offer to nobody here and must not vote.
 */
const slot = (label: string, answer: string, extra: Record<string, unknown> = {}) => ({
  label,
  answer,
  ...extra,
});

function check(
  parts: { label: string; slots: { label: string; answer: string; response_mode?: string }[] }[],
  rubric: RubricItem[],
  inputs: { ref: string; answer: string; working: string }[],
) {
  const result = markStructuredParts(rubric, parts as never, inputs);
  const { auto } = markSplit({
    parts: parts.map((p) => ({ label: p.label, marks: 0, slots: p.slots })),
    rubric,
    marks: 0,
  } as never);
  const earned = rubric
    .filter((r) => result.rubric_awarded.includes(r.code))
    .reduce((sum, r) => sum + r.mark_value, 0);
  return { verdict: result.correct, earned, auto };
}

const row = (
  code: string,
  profile: 'CK' | 'AK' | 'R',
  slot_ref: string,
  extra: Partial<RubricItem> = {},
): RubricItem =>
  ({ code, profile, criterion: 'c', mark_value: 1, slot_ref, part_label: slot_ref[0], ...extra }) as RubricItem;

describe('verdict, score and chips agree', () => {
  it('calls it correct exactly when every mark on offer was earned', () => {
    const parts = [{ label: 'a', slots: [slot('i', '42')] }];
    const rubric = [row('CK1', 'CK', 'a.i')];
    const right = check(parts, rubric, [{ ref: 'a.i', answer: '42', working: '' }]);
    expect(right).toEqual({ verdict: true, earned: 1, auto: 1 });

    const wrong = check(parts, rubric, [{ ref: 'a.i', answer: '41', working: '' }]);
    expect(wrong.verdict).toBe(false);
    expect(wrong.earned).toBeLessThan(wrong.auto);
  });

  // Cause 1 — d0dc6a. One "=" typed anywhere used to award the method marks on
  // every slot, so the score read full while the verdict read wrong.
  it('never awards a mark for a wrong answer from another slot\'s working', () => {
    const parts = [{ label: 'a', slots: [slot('i', '8 m')] }, { label: 'b', slots: [slot('i', '5')] }];
    const rubric = [row('CK1', 'CK', 'a.i'), row('AK1', 'AK', 'a.i'), row('CK2', 'CK', 'b.i')];
    const r = check(parts, rubric, [
      { ref: 'a.i', answer: '8 cm', working: 'area = 40' },
      { ref: 'b.i', answer: '5', working: 'area = 40' },
    ]);
    expect(r.verdict).toBe(false);
    expect(r.earned).toBeLessThan(r.auto); // and the score says so too
  });

  // Cause 2 — c0c05d. A form nothing pays for cannot fail the answer.
  it('does not fail an answer for a form no rubric row pays for', () => {
    const parts = [{ label: 'a', slots: [slot('i', '$\\frac{3}{8}$', { answer_format: 'lowest_terms' })] }];
    const rubric = [row('CK1', 'CK', 'a.i')];
    const r = check(parts, rubric, [{ ref: 'a.i', answer: '37.5/100', working: '' }]);
    expect(r).toEqual({ verdict: true, earned: 1, auto: 1 });
  });

  it('does fail it when a row does pay for the form', () => {
    const parts = [{ label: 'a', slots: [slot('i', '$\\frac{3}{8}$', { answer_format: 'lowest_terms' })] }];
    const rubric = [row('CK1', 'CK', 'a.i'), row('R1', 'R', 'a.i', { for_format: true })];
    const r = check(parts, rubric, [{ ref: 'a.i', answer: '37.5/100', working: '' }]);
    expect(r.verdict).toBe(false);
    expect(r.earned).toBeLessThan(r.auto);
  });

  // Cause 3 — a slot nothing is on offer for cannot fail the attempt either.
  it('does not let a slot carrying no rubric row vote', () => {
    const parts = [{ label: 'a', slots: [slot('i', '42')] }, { label: 'b', slots: [slot('i', '7')] }];
    const rubric = [row('CK1', 'CK', 'a.i')]; // nothing on b.i
    const r = check(parts, rubric, [
      { ref: 'a.i', answer: '42', working: '' },
      { ref: 'b.i', answer: 'wrong', working: '' },
    ]);
    expect(r).toEqual({ verdict: true, earned: 1, auto: 1 });
  });

  // A self-marked slot is marked by the student against the solution.
  it('does not let a self-marked slot vote', () => {
    const parts = [
      { label: 'a', slots: [slot('i', '42')] },
      { label: 'b', slots: [slot('i', 'because...', { response_mode: 'explain' })] },
    ];
    const rubric = [row('CK1', 'CK', 'a.i'), row('R1', 'R', 'b.i')];
    const r = check(parts, rubric, [
      { ref: 'a.i', answer: '42', working: '' },
      { ref: 'b.i', answer: '', working: '' },
    ]);
    expect(r).toEqual({ verdict: true, earned: 1, auto: 1 });
    expect(markableSlots(parts as never)).toEqual(['a.i']);
  });
});
