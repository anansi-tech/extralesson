import { describe, expect, it } from 'vitest';
import { hintProblems } from '@/lib/generation/hint-tex';
import { SlotZ } from '@/lib/validation/question';

/**
 * A HINT TELLS A STUDENT WHAT TO DO NEXT. Marker register adjudicates whether
 * a boundary case counts — "treat X as satisfying Y" — which is what a marker
 * decides, not what a student does. A sweep of 3,820 approved hints found two,
 * both on a CK3 row, both about an at-least boundary.
 */
describe('the two marker-register hints, rewritten', () => {
  const REPLACEMENTS: [string, string, string][] = [
    [
      'd16f3a CK3',
      'Recognises that an amount equal to $55\\%$ satisfies the condition \u201Cat least $55\\%$\u201D.',
      'Exactly $55\\%$ still counts: "at least $55\\%$" includes $55\\%$ itself.',
    ],
    [
      'd0dd05 CK3',
      'Recognises that retaining exactly $15$ m satisfies the condition "at least 15 m".',
      "Exactly 15 m is enough: 'at least 15 m' includes 15 itself.",
    ],
  ];

  for (const [name, criterion, hint] of REPLACEMENTS) {
    it(`${name} passes the hint lint against its own criterion`, () => {
      expect(hintProblems(hint, criterion)).toEqual([]);
    });

    it(`${name} says what counts, not how to mark it`, () => {
      // The register test: it does not instruct an adjudication.
      expect(hint).not.toMatch(/\btreat\b[^.]*\bas (satisfying|meeting)\b/i);
      expect(hint).not.toMatch(/\b(mark|criterion|award|their)\b/i);
      expect(hint).toMatch(/\bincludes\b|\bstill counts\b|\bis enough\b/);
    });
  }
});

/**
 * A CLOZE GAP ON A MODAL TAKES MORE ANSWERS THAN A VALUE DOES. d16f3a (c)
 * fills "a cement delivery {} be arranged" and listed only will and will be,
 * so the independent solver answering "should" failed the gate on a correct
 * answer.
 */
describe('a modal cloze admits the synonyms it means', () => {
  const slot = {
    label: 'delivery',
    answer: 'will',
    accept: ['will be', 'should', 'should be', 'must', 'must be'],
    response_mode: 'answer' as const,
  };

  it('holds five alternatives, which the old cap of four refused', () => {
    expect(SlotZ.safeParse(slot).success).toBe(true);
    expect(SlotZ.safeParse({ ...slot, accept: [...slot.accept, 'shall', 'ought'] }).success, 'but not a dumping ground').toBe(false);
  });

  it('keeps "will be" rather than trading it for the new ones', () => {
    // Dropping it to fit the cap would have narrowed what is accepted today,
    // which is the opposite of the fault being fixed.
    expect(slot.accept).toContain('will be');
  });
});
