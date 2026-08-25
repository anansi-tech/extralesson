import { describe, expect, it } from 'vitest';
import { earnableByMethod, methodMarksEarned } from '@/lib/grade/method-marks';
import { MethodDecisionZ } from '@/lib/grade/mark-method';
import type { RubricItem } from '@/lib/types';

const row = (code: string, slot_ref: string, criterion: string): RubricItem =>
  ({ code, profile: 'AK', criterion, mark_value: 1, slot_ref, part_label: slot_ref[0] }) as RubricItem;

const q = {
  parts: [
    { label: 'a', slots: [{ label: 'i' }] },
    { label: 'b', slots: [{ label: 'i', response_mode: 'explain' }] },
  ],
  rubric: [
    row('AK1', 'a.i', 'Divides 16.8 by "their" slab area'),
    row('AK2', 'a.i', 'CAO $0.050\\text{ m}$'),
    row('R1', 'b.i', 'Explains why the delivery does not guarantee it'),
  ],
};

// R2 §4 — the marking pass runs only over rows deterministic marking left
// unearned, and never over rows it could not settle anyway.
describe('earnableByMethod — what a photograph could still be worth', () => {
  it('offers a method row the grader did not award', () => {
    expect(earnableByMethod(q, []).map((r) => r.code)).toEqual(['AK1']);
  });

  it('never offers a CAO row: the answer is what it marks', () => {
    expect(earnableByMethod(q, []).map((r) => r.code)).not.toContain('AK2');
  });

  it('never offers a row on a slot the student marks themselves', () => {
    expect(earnableByMethod(q, []).map((r) => r.code)).not.toContain('R1');
  });

  it('offers nothing once the row is already earned', () => {
    expect(earnableByMethod(q, ['AK1'])).toEqual([]);
  });

  // Zero is what keeps the camera off a question with nothing to gain — the
  // student's time and a model call both saved.
  it('returns nothing for a question that is fully marked', () => {
    expect(earnableByMethod(q, ['AK1', 'AK2', 'R1'])).toEqual([]);
  });
});

// R2 §5 and §1.1 together: this pass may only ADD marks, and a row it withholds
// must say why. A student who is told "we could not see where you divided by
// the scale factor" can go and look at their page; a struck-through code tells
// them nothing and is indistinguishable from a marker that is simply wrong.
//
// The marker is measurably more conservative than a human examiner — across
// five runs it withheld rows David awarded — and that is the direction §1.1
// chose, because the comparison is not against a perfect examiner but against
// today, where a student earns no method marks at all on 424 of 427 questions.
describe('the method decision contract', () => {
  it('requires a reason on every decision, awarded or not', () => {
    const ok = MethodDecisionZ.safeParse({
      code: 'AK3',
      awarded: false,
      reason: 'we could not see where you divided by the scale factor',
      confidence: 0.8,
    });
    expect(ok.success).toBe(true);

    const noReason = MethodDecisionZ.safeParse({ code: 'AK3', awarded: false, confidence: 0.8 });
    expect(noReason.success).toBe(false);
  });
});

// A RETAKE MUST NOT PAY TWICE.
//
// Two takes are offered so a blurry photograph can be replaced, which means the
// second take usually reads THE SAME WORKING as the first and earns the same
// rows again. Summing the takes turned an 8-mark paper into 12/12. A rubric row
// is worth its marks once, however many photographs of it we read.
describe('methodMarksEarned — one row, one payment', () => {
  const take = (codes: string[]) => ({
    method_marks: codes.map((code) => ({ code, awarded: true, mark_value: 1 })),
  });

  it('counts a row once when both takes earn it', () => {
    expect(methodMarksEarned([take(['R1', 'R2']), take(['R1', 'R2'])])).toBe(2);
  });

  it('adds a row the second take earned and the first did not', () => {
    expect(methodMarksEarned([take(['R1']), take(['R1', 'AK5'])])).toBe(2);
  });

  it('keeps the first take marks when the second earns nothing', () => {
    expect(methodMarksEarned([take(['R1', 'R2', 'R3', 'AK5']), { method_marks: [] }])).toBe(4);
  });

  it('never lets a withheld row on a later take remove an earned one', () => {
    const earned = { method_marks: [{ code: 'R1', awarded: true, mark_value: 1 }] };
    const withheld = { method_marks: [{ code: 'R1', awarded: false, mark_value: 1 }] };
    expect(methodMarksEarned([earned, withheld])).toBe(1);
  });

  it('respects a row worth more than one mark, once', () => {
    const two = { method_marks: [{ code: 'AK1', awarded: true, mark_value: 2 }] };
    expect(methodMarksEarned([two, two])).toBe(2);
  });
});
