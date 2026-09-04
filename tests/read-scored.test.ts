import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');

// ROUND_4 post-smoke: once a page is read, reasoning rows are marked from it
// and the score is out of the whole question — on the card, in the look
// back, and in every fold.
describe('a read marks the whole question', () => {
  it('tells the marker how a reasoning row is earned', () => {
    const prompt = at('lib', 'grade', 'mark-method.ts');
    expect(prompt).toMatch(/A REASONING ROW \(profile R\) IS EARNED WHEN THE REASONING THE SCHEME NAMES/);
    expect(prompt).toMatch(/IN ANY WORDING/);
  });

  it('scores out of the full total wherever a read exists', () => {
    const card = at('app', 'study', 'session', '[id]', 'question-card.tsx');
    expect(card).toMatch(/const outOf = readExists \? question\.marks : question\.auto/);
    expect(card).toMatch(/\{earned\}\/\{outOf\}/);
    expect(at('lib', 'study', 'state.ts')).toMatch(/read \? a\.question_id!\.marks : markSplit/);
    expect(at('lib', 'study', 'reviewable.ts')).toMatch(/reads\.length \? a\.question_id\.marks : markSplit/);
  });

  it('drops the "mark it yourself" copy once a read exists', () => {
    const card = at('app', 'study', 'session', '[id]', 'question-card.tsx');
    expect(card).toMatch(/readExists\s*\?\s*'Work this one on paper — it is marked from your photograph\.'/);
    expect(card).toMatch(/question\.self > 0 && !readExists/);
  });
});
