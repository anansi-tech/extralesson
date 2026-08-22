import { describe, expect, it } from 'vitest';
import { earnableByMethod } from '@/lib/grade/method-marks';
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
