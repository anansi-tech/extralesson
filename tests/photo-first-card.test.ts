import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const at = (...p: string[]) => readFileSync(join(process.cwd(), 'app', 'study', 'session', '[id]', ...p), 'utf8');

// ROUND_4 Task 1, the card. No renderer in the suite, so the structure is
// pinned in source: where the camera sits, what a read does, what a reload
// restores. The behaviour behind it is tests/photo-first.test.ts.
describe('the photo-first card', () => {
  const card = at('question-card.tsx');
  const photo = at('working-photo.tsx');
  const page = at('page.tsx');

  it('puts the camera above the answer boxes on a structured question', () => {
    const camera = card.indexOf("question.kind === 'structured' && !reviewing && !feedback && (");
    const boxes = card.indexOf('question.parts.map((p) =>');
    expect(camera).toBeGreaterThan(0);
    expect(camera).toBeLessThan(boxes);
  });

  it('fills the boxes from a read, and leaves what the read did not touch', () => {
    expect(card).toMatch(/onRead=\{\(prefill\) => \{\s*setPartAnswers\(\(prev\) => \(\{ \.\.\.prev, \.\.\.prefill \}\)\);/);
    // Multi-value slots live in boxValues, which a read never writes.
    expect(card).not.toMatch(/onRead[\s\S]{0,120}setBoxValues/);
  });

  it('reads before submit and marks after it, through one control', () => {
    expect(photo).toMatch(/attemptId\s*\?\s*await captureWorking/);
    expect(photo).toMatch(/:\s*await readWorking/);
    expect(photo).toMatch(/if \('prefill' in res\) onRead\?\.\(res\.prefill\)/);
    expect(photo).toContain("'Take it again'");
    expect(photo).toContain('That is the second photograph, so it stands.');
  });

  it('shows the marked read after submit, even when nothing is left to earn', () => {
    expect(card).toMatch(/initial=\{feedback\.working\}/);
  });

  it('restores a read taken before a reload, with the takes that remain', () => {
    expect(page).toMatch(/Transcription\.find\(\{ session_id: id, question_index: index, pending: \{ \$ne: true \} \}\)/);
    expect(page).toMatch(/takesLeft: MAX_TAKES - reads\.length/);
    expect(card).toMatch(/initial=\{question\.draft\?\.read\}/);
  });
});
