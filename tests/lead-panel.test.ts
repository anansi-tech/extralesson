import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { leadPanel, shouldLeadWithReachable } from '@/lib/study/lead-panel';

const leading = { reachableCount: 3, estimable: true, overallPercent: 30 };

// "WHERE YOUR MARKS ARE" NEEDS AN ESTIMATE, NOT AN ATTEMPT (ROUND_3, defect 2).
//
// The panel's own sentence is "the points your grade estimate could gain from
// that topic", so it is only true when a grade estimate exists. estimable is
// marksAttempted >= MIN_MARKS_FOR_PREDICTION, so it already implies attempts.
describe('shouldLeadWithReachable', () => {
  it('leads when the estimate exists and is below a pass — the case it was written for', () => {
    expect(shouldLeadWithReachable(leading)).toBe(true);
    expect(shouldLeadWithReachable({ ...leading, overallPercent: 49 })).toBe(true);
  });

  it('NEVER leads without an estimate, however grim or full the list', () => {
    // This was the defect: the panel claimed points off a grade estimate while
    // "Not yet estimated" rendered directly beneath it.
    expect(shouldLeadWithReachable({ ...leading, estimable: false })).toBe(false);
    expect(shouldLeadWithReachable({ reachableCount: 3, estimable: false, overallPercent: 0 })).toBe(
      false,
    );
    expect(
      shouldLeadWithReachable({ reachableCount: 10, estimable: false, overallPercent: 12 }),
    ).toBe(false);
  });

  it('stops leading once the estimate reaches a pass', () => {
    expect(shouldLeadWithReachable({ ...leading, overallPercent: 50 })).toBe(false);
    expect(shouldLeadWithReachable({ ...leading, overallPercent: 80 })).toBe(false);
  });

  it('does not lead with an empty list, whatever the estimate says', () => {
    expect(shouldLeadWithReachable({ ...leading, reachableCount: 0 })).toBe(false);
    expect(
      shouldLeadWithReachable({ reachableCount: 0, estimable: true, overallPercent: 10 }),
    ).toBe(false);
  });
});

// ROUND_4 Task 2: before the first question, the first question leads and the
// diagnostic sits beneath it; after it, the dashboard is as it was.
describe('leadPanel — the first question comes first', () => {

  it('leads with the first question until one exists, however new the student', () => {
    expect(leadPanel({ open: false, firstTaken: false, isNewStudent: true })).toBe('first');
    expect(leadPanel({ open: false, firstTaken: false, isNewStudent: false })).toBe('first');
  });

  it('is the dashboard as before once it exists', () => {
    expect(leadPanel({ open: false, firstTaken: true, isNewStudent: true })).toBe('diagnostic');
    expect(leadPanel({ open: false, firstTaken: true, isNewStudent: false })).toBe('session');
  });

  it('always resumes an open session, including the first question itself', () => {
    expect(leadPanel({ open: true, firstTaken: false, isNewStudent: true })).toBe('resume');
  });

  it('is what /study renders, with the diagnostic under the first question', () => {
    const page = readFileSync(join(process.cwd(), 'app', 'study', 'page.tsx'), 'utf8');
    expect(page).toMatch(/firstTaken: await firstQuestionTaken\(auth\.student_id\)/);
    const first = page.slice(page.indexOf("lead === 'first' ? ("), page.indexOf("lead === 'diagnostic' ? ("));
    expect(first).toMatch(/name="mode" value="first"[\s\S]*Mark one question now[\s\S]*name="mode" value="diagnostic"/);
    expect(page).toContain("error === 'first-taken'");
  });
});
