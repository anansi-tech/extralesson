import { describe, expect, it } from 'vitest';
import { attemptOutcome, type OutcomeQuestion } from '@/lib/study/outcome';

// The audit's shape: five marks the grader settles, three the page has to earn.
const question: OutcomeQuestion = {
  parts: [
    { label: 'a', slots: [{ label: 'i', response_mode: 'answer' }] },
    { label: 'b', slots: [{ label: 'i', response_mode: 'answer' }] },
    { label: 'c', slots: [{ label: 'i', response_mode: 'show_that' }] },
  ],
  rubric: [
    { code: 'AK1', profile: 'AK', mark_value: 2, slot_ref: 'a.i' },
    { code: 'AK2', profile: 'AK', mark_value: 1, slot_ref: 'a.i' },
    { code: 'CK1', profile: 'CK', mark_value: 2, slot_ref: 'b.i' },
    { code: 'R1', profile: 'R', mark_value: 2, slot_ref: 'c.i' },
    { code: 'R2', profile: 'R', mark_value: 1, slot_ref: 'c.i' },
  ],
};
const allRight = { rubric_awarded: ['AK1', 'AK2', 'CK1'] };
const states = (o: ReturnType<typeof attemptOutcome>) => Object.fromEntries(o.rows.map((r) => [r.code, r.state]));

describe('attemptOutcome — one fold', () => {
  it('with no read, the grader’s rows are assessed and the page’s rows are not', () => {
    const o = attemptOutcome(allRight, question);
    expect(o).toMatchObject({ earned: 5, assessed: 5, unassessed: 2, unassessedMarks: 3 });
    expect(states(o)).toEqual({ AK1: 'awarded', AK2: 'awarded', CK1: 'awarded', R1: 'unassessed', R2: 'unassessed' });
  });

  it('an unreadable photo assesses nothing: 5/5 stays 5/5, three marks unassessed', () => {
    const illegible = {
      legible: false,
      marker_version: 'v3',
      method_marks: [
        { code: 'R1', awarded: false, reason: 'we could not read the page' },
        { code: 'R2', awarded: false, reason: 'we could not read the page' },
      ],
    };
    expect(attemptOutcome(allRight, question, [illegible])).toMatchObject({ earned: 5, assessed: 5, unassessedMarks: 3 });
  });

  it('a legible read the marker finished assesses the rows it decided', () => {
    const read = {
      legible: true,
      marker_version: 'v3',
      method_marks: [
        { code: 'R1', awarded: true, reason: 'the ratio is set up' },
        { code: 'R2', awarded: false, reason: 'we could not see the conclusion' },
      ],
    };
    const o = attemptOutcome(allRight, question, [read]);
    expect(o).toMatchObject({ earned: 7, assessed: 8, unassessed: 0 });
    expect(o.rows.find((r) => r.code === 'R2')).toMatchObject({ state: 'withheld', reason: 'we could not see the conclusion' });
    expect(o.byProfile).toEqual({ CK: 2, AK: 3, R: 2 });
  });

  it('a marking that failed decides nothing, whatever it left behind', () => {
    const failed = { legible: true, method_marks: [{ code: 'R1', awarded: false, reason: 'timed out' }] };
    expect(attemptOutcome(allRight, question, [failed])).toMatchObject({ assessed: 5, unassessedMarks: 3 });
  });

  it('a row the marker sent for review is unassessed, not withheld', () => {
    const read = { legible: true, marker_version: 'v3', method_marks: [{ code: 'R1', awarded: false, reason: 'unclear', needs_review: true }] };
    expect(states(attemptOutcome(allRight, question, [read]))).toMatchObject({ R1: 'unassessed', R2: 'unassessed' });
  });

  it('a wrong answer withholds its rows until the page earns one back', () => {
    const wrong = { rubric_awarded: ['CK1'] };
    expect(attemptOutcome(wrong, question)).toMatchObject({ earned: 2, assessed: 5 });
    const read = { legible: true, marker_version: 'v3', method_marks: [{ code: 'AK1', awarded: true, reason: 'the method is there' }] };
    const o = attemptOutcome(wrong, question, [read]);
    expect(o).toMatchObject({ earned: 4, assessed: 5 });
    expect(states(o)).toMatchObject({ AK1: 'awarded', AK2: 'withheld' });
  });

  it('a row is paid once across takes, and a later take never takes it back', () => {
    const first = { legible: true, marker_version: 'v3', method_marks: [{ code: 'R1', awarded: true, reason: 'seen' }] };
    const second = { legible: true, marker_version: 'v3', method_marks: [{ code: 'R1', awarded: false, reason: 'not seen this time' }] };
    expect(attemptOutcome(allRight, question, [first, second])).toMatchObject({ earned: 7, assessed: 7 });
  });

  it('a row on a slot the question no longer names belongs to the grader', () => {
    const legacy: OutcomeQuestion = { rubric: [{ code: 'CK1', profile: 'CK', mark_value: 1, slot_ref: 'a.i' }] };
    expect(attemptOutcome({ rubric_awarded: [] }, legacy)).toMatchObject({ earned: 0, assessed: 1, unassessed: 0 });
  });
});
