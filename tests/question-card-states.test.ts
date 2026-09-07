import { describe, expect, it, vi } from 'vitest';
import { STATES, readingPieces, renderBar, renderCard, visibleText } from './helpers/card-states';
import { MARKED } from './helpers/marked-states';
import QuestionCard from '@/app/study/session/[id]/question-card';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study/session/s1' }));

// ROUND_8 Task 2: the question card says what the design says in each of its
// four states, in the DOM's order — bar, stem, figure, camera, then the parts
// and the hand-in.
const text = Object.fromEntries(Object.entries(STATES).map(([k, q]) => [k, visibleText(renderBar(q) + renderCard(q))])) as Record<keyof typeof STATES, string>;

const STEM = 'Question 2 of 3 7 of 21 marks done The diagram shows triangle ABC, right-angled at B, with AB = 8 cm and angle ACB = 34°. [7 marks] Not drawn to scale ';
const CAMERA = 'Your working on paper Work it on paper, then photograph the page. We type up what we read and fill in the single-answer boxes; you check them, fill in the rest, and hand in. Photograph your working ';
const PARTS_AB = '(a) Calculate the length of BC. [3] Answer to (a) Give the length in cm to 1 decimal place. (b) Calculate the area of triangle ABC. [2] Answer to (b) Insert √ ° ² ';
const PART_C_PAPER = '(c) Show that the perimeter is less than 35 cm. [2] Work this on paper — it’s marked from your photograph. ';
const NAV = ' ← previous 2 / 3';

describe('the question card, four states', () => {
  it('1 · unanswered', () => {
    expect(text.unanswered).toBe(
      STEM + CAMERA + PARTS_AB + PART_C_PAPER +
        'Hand in as is 2 boxes left blank. Blanks score zero, like the exam. You still get the worked solution.' + NAV,
    );
  });

  it('2 · reading your page: the two pieces that change', () => {
    const p = readingPieces();
    expect(visibleText(p.camera)).toBe('Your working on paper Reading your page… Reading…');
    expect(p.camera).toMatch(/<img src="data:image\/gif;base64,[^"]+" alt=""/);
    expect(p.camera).toMatch(/<button[^>]*disabled=""[^>]*>Reading…<\/button>/);
    expect(visibleText(p.handIn)).toBe('Reading your page… Nothing is handed in until you press it');
    expect(p.handIn).toMatch(/<button[^>]*disabled=""/);
  });

  it('3 · read, boxes filled', () => {
    expect(text.read).toBe(
      STEM +
        'This is what we read (a) tan 34 = 8 / BC Not what I wrote BC = 8 / tan 34 = 11.9 hard to read Not what I wrote (b) ½ × 8 × 11.9 = 47.6 Not what I wrote Take it again 1 retake left ' +
        'We filled the single answers. ' +
        '(a) Calculate the length of BC. [3] Answer to (a) 11.9 From your page — check it Give the length in cm to 1 decimal place. (b) Calculate the area of triangle ABC. [2] Answer to (b) 47.6 From your page — check it Insert √ ° ² ' +
        '(c) Show that the perimeter is less than 35 cm. [2] Marked from your photograph — nothing to type. ' +
        'Hand in TWO BOXES FROM YOUR PAGE · CHECKED BY YOU' + NAV,
    );
    const html = renderCard(STATES.read);
    expect(html.match(/From your page — check it/g)).toHaveLength(2);
    expect(html.match(/hard to read/g)).toHaveLength(1);
  });

  it('4 · blanks left', () => {
    expect(text.blanks).toBe(
      STEM + CAMERA +
        '(a) Calculate the length of BC. [3] Answer to (a) 11.9 Give the length in cm to 1 decimal place. (b) Calculate the area of triangle ABC. [2] Answer to (b) Insert √ ° ² ' +
        PART_C_PAPER +
        'Hand in as is 1 box left blank. Blanks score zero, like the exam. You still get the worked solution.' + NAV,
    );
  });

  it('the camera sits above the boxes, and the typed/page label line appears once every box is filled', () => {
    const html = renderCard(STATES.unanswered);
    expect(html.indexOf('id="camera-box"')).toBeLessThan(html.indexOf('id="slot-a.i"'));
    const full = visibleText(renderCard({ ...STATES.blanks, draft: { answers: { 'a.i': '11.9', 'b.i': '47.6' }, values: {} } }));
    expect(full).toContain('Hand in 5 TYPED MARKS · 2 FROM YOUR PAGE');
    expect(full).not.toContain('left blank');
  });

  // A reasoning part is assessed once a read exists, so the copy never sends the
  // student to mark it themselves and never calls the marks left out.
  it('a reasoning part with no read says what marks it, before and after hand-in', () => {
    // No read anywhere: neither a photograph taken with the answers nor one taken since.
    const prior = MARKED.marked.prior!;
    const noPhoto = { ...MARKED.marked, prior: { ...prior, working: [], feedback: { ...prior.feedback!, working: undefined } } };
    const html = renderToStaticMarkup(createElement(QuestionCard, { question: noPhoto }));
    expect(visibleText(html)).toContain('Work this on paper — it’s marked from your photograph.');
    expect(visibleText(html)).not.toMatch(/mark it yourself|left out of your estimate/i);
    const src = readFileSync(join(process.cwd(), 'app', 'study', 'session', '[id]', 'question-card.tsx'), 'utf8');
    expect(src).not.toMatch(/Mark it yourself/);
    // The one clause that stays is the construction's, which nothing assesses.
    expect(src.match(/left out of your estimate/g)).toHaveLength(1);
  });
});
