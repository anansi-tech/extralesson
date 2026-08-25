import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { methodMarksEarned } from '@/lib/grade/method-marks';

const SRC = readFileSync(join(process.cwd(), 'lib', 'study', 'reviewable.ts'), 'utf8');
const SESSION_PAGE = readFileSync(
  join(process.cwd(), 'app', 'study', 'session', '[id]', 'page.tsx'),
  'utf8',
);

// LOOKING BACK IS SURFACING, NOT A NEW FEATURE.
//
// The read-only view already exists: a session page serves any answered
// question at ?q=<index>, which is what paging back inside a live session
// gives. A finished session simply stopped linking to it. So the rules worth
// pinning are that nothing new is written, and that the mark shown beside a
// question is the same mark that moved the student's mastery.
describe('reviewable questions', () => {
  it('writes nothing — it is a fold over what is already stored', () => {
    for (const write of ['.create(', '.updateOne(', '.updateMany(', '.deleteOne(', '.save(']) {
      expect(SRC, write).not.toContain(write);
    }
  });

  it('folds method marks with the same function mastery uses', () => {
    // Not a reimplementation: one row is paid once across takes, here too.
    expect(SRC).toContain('methodMarksEarned');
    expect(methodMarksEarned([
      { method_marks: [{ code: 'R1', awarded: true, mark_value: 1 }] },
      { method_marks: [{ code: 'R1', awarded: true, mark_value: 1 }] },
    ])).toBe(1);
  });

  it('uses the same denominator as mastery, not the question total', () => {
    // markSplit().auto — self-marked slots are out of the denominator, exactly
    // as lib/study/state.ts has them.
    expect(SRC).toContain('markSplit');
  });

  it('opens the sitting the attempt records, not another session holding it', () => {
    // A question can sit in several sessions. The attempt names its own, so
    // there is nothing to infer and no way to link to the wrong one.
    expect(SRC).toContain('a.session_id');
  });
});

describe('the read-only view it links to', () => {
  it('still renders a finished session when a question is named', () => {
    // reviewing short-circuits the summary: without this, every link from the
    // list would bounce to the summary page instead of the question.
    expect(SESSION_PAGE).toMatch(/const reviewing = index < answered/);
    expect(SESSION_PAGE).toMatch(/if \(answered >= total && !reviewing\)/);
  });
});

// THE CAPTURE CONTROL IS WHAT A FINISHED QUESTION DOES NOT GET.
//
// The transcription and the per-row reasons were gated on !reviewing along with
// the camera, so looking back showed neither. What was read is kept — the image
// is not, after the TTL — and it is the part a student most wants to reread.
describe('a reviewed question shows what the photograph earned', () => {
  const CARD = readFileSync(
    join(process.cwd(), 'app', 'study', 'session', '[id]', 'question-card.tsx'),
    'utf8',
  );

  it('offers the camera only when not reviewing', () => {
    expect(CARD).toMatch(/!reviewing && feedback\.earnableByMethod > 0 && \(\s*<WorkingPhoto/);
  });

  it('renders the stored takes when reviewing', () => {
    expect(CARD).toMatch(/reviewing &&\s*question\.prior\?\.working\?\.map/);
  });

  it('shows what was read through the same renderer the live path uses', () => {
    // One renderer, two moments — the live capture and the look back. A second
    // copy of this markup is how the two drift.
    expect(CARD.split('<WorkingRead').length - 1).toBe(1);
    const photo = readFileSync(
      join(process.cwd(), 'app', 'study', 'session', '[id]', 'working-photo.tsx'),
      'utf8',
    );
    expect(photo.split('<WorkingRead').length - 1).toBe(1);
  });

  it('keeps the transcription when the image is already gone', () => {
    // The 7-day TTL is on the image alone. Deliberate: see ROUND_2_EXAMINER §9.
    const db = readFileSync(join(process.cwd(), 'lib', 'db', 'transcription.ts'), 'utf8');
    const transcriptionSchema = db.slice(0, db.indexOf('CapturedImageSchema'));
    expect(transcriptionSchema).not.toContain('expireAfterSeconds');
    expect(db.slice(db.indexOf('CapturedImageSchema'))).toContain('expireAfterSeconds');
  });
});
