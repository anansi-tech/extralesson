import { describe, expect, it } from 'vitest';
import { earnableByMethod } from '@/lib/grade/method-marks';
import { MethodDecisionZ } from '@/lib/grade/mark-method';
import type { RubricItem } from '@/lib/types';

const row = (code: string, slot_ref: string, criterion: string): RubricItem =>
  ({ code, profile: 'AK', criterion, mark_value: 1, slot_ref, part_label: slot_ref[0] }) as RubricItem;

const q = {
  parts: [
    { label: 'a', slots: [{ label: 'i' }] },
    { label: 'b', slots: [{ label: 'i', response_mode: 'explain' }] },
    { label: 'c', slots: [{ label: 'i', response_mode: 'construct' }] },
  ],
  rubric: [
    row('AK1', 'a.i', 'Divides 16.8 by "their" slab area'),
    row('AK2', 'a.i', 'CAO $0.050\\text{ m}$'),
    row('R1', 'b.i', 'Explains why the delivery does not guarantee it'),
    row('R2', 'c.i', 'Draws the line through both points'),
  ],
};

// R2 §4 — the marking pass runs only over rows deterministic marking left
// unearned, and never over rows it could not settle anyway.
describe('earnableByMethod — what a photograph could still be worth', () => {
  it('offers a method row the grader did not award', () => {
    expect(earnableByMethod(q, []).map((r) => r.code)).toEqual(['AK1', 'R1']);
  });

  it('never offers a CAO row: the answer is what it marks', () => {
    expect(earnableByMethod(q, []).map((r) => r.code)).not.toContain('AK2');
  });

  // ROUND_4 post-smoke: reasoning written on the page is read off it like
  // method; only a drawing needs the construction check instead.
  it('offers a reasoning row on a slot the student works on paper, never a construct row', () => {
    expect(earnableByMethod(q, []).map((r) => r.code)).toContain('R1');
    expect(earnableByMethod(q, []).map((r) => r.code)).not.toContain('R2');
  });

  it('offers nothing once the rows are already earned', () => {
    expect(earnableByMethod(q, ['AK1', 'R1'])).toEqual([]);
  });

  // Zero is what keeps the camera off a question with nothing to gain — the
  // student's time and a model call both saved.
  it('returns nothing for a question that is fully marked', () => {
    expect(earnableByMethod(q, ['AK1', 'AK2', 'R1', 'R2'])).toEqual([]);
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
