import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readInputShape, isMultiValue } from '@/lib/grade/input-shape';

const CARD = readFileSync(
  join(process.cwd(), 'app', 'study', 'session', '[id]', 'question-card.tsx'),
  'utf8',
);

// ONE RENDERER FOR HOW A SLOT IS ANSWERED.
//
// A question card lays a slot out two ways — a stacked box under the prompt,
// and a gap inside a cloze statement — and that is a difference of presentation
// only. When they were separate code paths the cloze gap rendered its own plain
// input into partAnswers, while filled() and the submit serialiser read
// boxValues: a coordinate, column vector, list or set inside a statement showed
// one box, always counted as blank, and had whatever was typed dropped on
// submit. Sixteen live slots could not be answered at all.
//
// There is no DOM here to render, so the invariant is pinned where the bug
// actually lived: in there being two places that decide this instead of one.
describe('a slot is answered the same way wherever it is laid out', () => {
  it('constructs the multi-box input in exactly one place', () => {
    expect(CARD.split('<TypedInput').length - 1).toBe(1);
  });

  it('routes the cloze gap through the shared renderer', () => {
    expect(CARD).toMatch(/statementHtml[\s\S]{0,900}slotAnswerInput\(p\.slots\[i\]/);
  });

  it('routes the stacked layout through it too', () => {
    expect(CARD).toMatch(/slotAnswerInput\(slot, \{/);
  });

  it('reads and writes multi-box answers through boxValues, single ones through partAnswers', () => {
    // The two stores are what diverged. Both must be reached from the one
    // renderer, on the same slot.input condition.
    const renderer = CARD.slice(CARD.indexOf('const slotAnswerInput'), CARD.indexOf('const canSubmit'));
    expect(renderer).toContain('slot.input ?');
    expect(renderer).toContain('boxValues[slot.ref]');
    expect(renderer).toContain('partAnswers[slot.ref]');
  });
});

// The shapes that were uncapturable in a statement. Kept as data so the reason
// the fix exists stays legible: these are not exotic, they are coordinates and
// column vectors, and they sit in cloze parts across the live bank.
describe('the shapes this affected', () => {
  it('treats a coordinate, a column vector, a list and a set as multi-value', () => {
    for (const answer of ['(4,0)', '\\begin{pmatrix}2\\\\-1\\end{pmatrix}', '$1, 7$', '$\\{(P,1),(P,2)\\}$']) {
      expect(isMultiValue(readInputShape(answer).shape), answer).toBe(true);
    }
  });

  it('does not treat a single word or number that way', () => {
    for (const answer of ['I', '260', '20%']) {
      expect(isMultiValue(readInputShape(answer).shape), answer).toBe(false);
    }
  });
});
