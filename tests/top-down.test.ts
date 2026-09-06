import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const card = at('app', 'study', 'session', '[id]', 'question-card.tsx');
const order = (...needles: string[]) => needles.map((n) => card.indexOf(n));

// ROUND_7 Task 1: the marked question reads top-down.
describe('the marked question', () => {
  it('opens with one line — earned of assessed, unassessed — and three jump links', () => {
    expect(card).toMatch(/\{earned\} of \{outOf\} marks/);
    expect(card).toMatch(/\{outcome\.unassessedMarks\} unassessed/);
    for (const id of ['#your-marking', '#question', '#worked-solution']) expect(card).toContain(`href="${id}"`);
    for (const id of ['id="marking"', 'id="your-marking"', 'id="question"', 'id="worked-solution"']) expect(card).toContain(id);
  });
  it('on a marked part: sentence, then rows with reasons, then codes', () => {
    const [slip, hint, working, codes] = order('slipFor(p.label) && (', 'partFeedback.reasonHtml && (', 'question.prior?.working?.map((w) =>', 'question.rubricCodes.map((r) => {');
    expect(slip).toBeGreaterThan(0);
    expect(slip).toBeLessThan(hint);
    expect(hint).toBeLessThan(working);
    expect(working).toBeLessThan(codes);
  });
  it('names a failed marking beside the score and never blames the photo for it', () => {
    expect(card).toMatch(/markingFailed \? \(\s*<span[^>]*>marking did not finish — try again below<\/span>/);
    const failedIdx = card.indexOf('marking did not finish');
    const photoIdx = card.indexOf('could not be assessed from this photo');
    expect(failedIdx).toBeGreaterThan(0);
    expect(failedIdx).toBeLessThan(photoIdx);
  });
  it('history opens at your marking', () => {
    expect(at('app', 'study', 'history', 'history-view.tsx')).toMatch(/\?q=\$\{r\.index\}#marking/);
  });
});
