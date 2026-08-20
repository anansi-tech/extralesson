import { describe, expect, it } from 'vitest';
import { markSplit } from '@/lib/grade/assessable';

// Two places asked "how many marks do we actually award" and both answered
// wrong: the card divided by the question TOTAL, and mastery approximated by
// slot proportion. The rubric already knew — every row names a slot.

const q = (over: Partial<Parameters<typeof markSplit>[0]> = {}) => ({
  marks: 12,
  parts: [
    {
      label: 'a',
      marks: 5,
      slots: [
        { label: 'i', response_mode: 'answer' },
        { label: 'ii', response_mode: 'answer' },
      ],
    },
    {
      label: 'b',
      marks: 7,
      slots: [
        { label: 'i', response_mode: 'answer' },
        { label: 'ii', response_mode: 'explain' },
      ],
    },
  ],
  rubric: [
    { slot_ref: 'a.i', mark_value: 3 },
    { slot_ref: 'a.ii', mark_value: 2 },
    { slot_ref: 'b.i', mark_value: 6 },
    { slot_ref: 'b.ii', mark_value: 1 },
  ],
  ...over,
});

describe('how many marks we actually award', () => {
  it('sums the rubric rows on auto-marked slots', () => {
    // Not 12 (the total), and not 8.5 (5 + 7/2, the slot-proportion guess).
    expect(markSplit(q())).toEqual({ auto: 11, self: 1 });
  });

  it('does not assume a part spreads its marks evenly across its slots', () => {
    // b is 7 marks over two slots, but the rubric puts 6 on the marked one.
    // Proportion says 3.5; the rubric says 6, and the rubric is the mark scheme.
    const split = markSplit(q());
    expect(split.auto).not.toBe(8.5);
    expect(split.auto + split.self).toBe(12);
  });

  it('is the whole question when everything is auto-marked', () => {
    expect(markSplit(q({ rubric: [{ slot_ref: 'a.i', mark_value: 12 }] })).auto).toBe(12);
  });

  it('falls back to whole parts when there is no rubric to read', () => {
    // An MCQ, or a question stored before rows named their slots. A part that
    // mixes marked and self-marked slots is counted rather than split into a
    // fraction nothing supports.
    const noRubric = q({ rubric: [] });
    expect(markSplit(noRubric)).toEqual({ auto: 12, self: 0 });
  });

  it('never reports a negative self-marked total', () => {
    // A rubric that sums past the question's own marks is a data error, not a
    // reason to show a student a negative number.
    expect(markSplit(q({ marks: 8 })).self).toBe(0);
  });
});
