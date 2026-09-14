import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { QuestionDraftZ } from '@/lib/validation/question';
import { explainDraftError } from '@/lib/admin/draft-error';

/**
 * A SAVE REFUSED WITH NO WAY TO KNOW WHAT IS WRONG.
 *
 * QuestionDraftZ is a union of the two question shapes, and Zod reports a fault
 * inside either branch as one `invalid_union` issue at the root, message
 * "Invalid input", path empty. The editor showed `path || 'question'`, so an
 * emptied answer, a missing rubric code, a part label out of sequence and an
 * unknown archetype were all "question: Invalid input".
 */
const draft = (over: (d: Record<string, unknown>) => void = () => {}) => {
  const d: Record<string, unknown> = {
    kind: 'structured',
    objective_ids: ['M1.1.1'],
    module: 1,
    stem: 'A shirt is reduced by 15%. Find the new price.',
    archetype: 'direct-procedure',
    representation: 'prose',
    difficulty: 1,
    marks: 4,
    parts: [{ label: 'a', prompt: 'Find the price.', marks: 4, slots: [{ label: 'i', answer: '68' }] }],
    rubric: [{ code: 'AK1', profile: 'AK', criterion: 'Computes it', mark_value: 4, slot_ref: 'a.i', part_label: 'a' }],
    final_answer: '68',
    worked_solution: 'It is 68.',
    misconceptions: [],
  };
  over(d);
  return d;
};

const refusal = (over: (d: Record<string, unknown>) => void) => {
  const res = QuestionDraftZ.safeParse(draft(over));
  expect(res.success, 'the fixture must actually be refused').toBe(false);
  return explainDraftError((res as { error: Parameters<typeof explainDraftError>[0] }).error);
};

describe('a refused save names the field and the reason', () => {
  it('accepts a draft that is fine, so the fixture is not refusing for another reason', () => {
    expect(QuestionDraftZ.safeParse(draft()).success).toBe(true);
  });

  it('names a fault buried inside the union branch', () => {
    // Each of these arrived as "question: Invalid input".
    expect(refusal((d) => { (d.parts as { slots: { answer: string }[] }[])[0].slots[0].answer = ''; }))
      .toBe('parts.0.slots.0.answer: String must contain at least 1 character(s)');
    expect(refusal((d) => { delete (d.rubric as Record<string, unknown>[])[0].code; }))
      .toBe('rubric.0.code: Required');
    expect(refusal((d) => { (d.archetype as unknown) = 'not-a-thing'; }))
      .toMatch(/^archetype: Invalid enum value/);
  });

  it('ignores the branch that disagrees about kind, whose complaints are noise', () => {
    // The MCQ branch objects that this is not an MCQ; that is not the fault.
    const said = refusal((d) => { (d.parts as { label: string }[])[0].label = 'z'; });
    expect(said).toContain('parts.0.label');
    expect(said, 'never reported as a kind problem').not.toContain('kind');
    expect(said).not.toContain('Invalid input');
  });

  it('keeps a message that already named its field', () => {
    expect(refusal((d) => { d.stem = 'hi'; })).toBe('stem: String must contain at least 10 character(s)');
    expect(refusal((d) => { (d.rubric as { mark_value: number }[])[0].mark_value = 99; }))
      .toBe('question: rubric mark_values must sum to marks');
  });

  it('says several faults, then how many more, rather than one at a time', () => {
    const said = refusal((d) => {
      (d.parts as { slots: { answer: string }[] }[])[0].slots[0].answer = '';
      d.stem = 'hi';
      d.worked_solution = '';
    });
    expect(said.split(' · ').length).toBeGreaterThan(1);
    expect(said).toContain('stem');
  });

  it('the editor uses it, and no longer reads issues[0] by hand', () => {
    const actions = readFileSync(join(process.cwd(), 'app', 'admin', 'review', 'actions.ts'), 'utf8');
    expect(actions).toContain('explainDraftError(validated.error)');
    expect(actions, 'the bare fallback is gone').not.toMatch(/\|\| 'question'/);
  });
});
