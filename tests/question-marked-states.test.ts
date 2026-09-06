import { describe, expect, it, vi } from 'vitest';
import { MARKED, renderMarked, visibleText } from './helpers/marked-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study/session/s1' }));

// ROUND_8 Task 3: the marked question says what the design says in each of
// its three states, in the DOM's order — the outcome line, the verdict, the
// question, the figure, the parts with their rows, the solution, then the
// rail: what we read and the codes. Rendered through the look back, which carries the same
// reads, rows, disputes and retry as the just-marked screen.
const text = Object.fromEntries(Object.entries(MARKED).map(([k, q]) => [k, visibleText(renderMarked(q))])) as Record<keyof typeof MARKED, string>;

const QUESTION = 'The diagram shows triangle ABC, right-angled at B, with AB = 8 cm and angle ACB = 34°. [7 marks] Not drawn to scale ';
const PART_A = '(a) Calculate the length of BC. [3] Answer to (a) 11.9 ✓ ';
const PART_B = '(b) Calculate the area of triangle ABC. [2] Answer to (b) 95.2 ✗ You wrote 8 × 11.9 and stopped — the half is missing. Area of a triangle is ½ × base × height. The multiplication earned the method mark; the value did not earn the accuracy mark. ';
const ROWS_B = '✓ Correct base and height used – Area correct to 1 d.p. — 95.2 is twice the area ';
const PART_C = '(c) Show that the perimeter is less than 35 cm. [2] Work this one on paper — it is marked from your photograph. ';
const LOOK_BACK = 'This question is handed in Answers close once a question is marked, the way a paper does. If a mark looks wrong, query it — a person looks before anything changes. Read your marking 6 of 7 marks · with the reasons ';
const SOLUTION = 'Worked solution (a) tan 34° = AB / BC, so BC = 8 / tan 34° = 11.9 cm (1 d.p.). (b) Area = ½ × BC × AB = ½ × 11.9 × 8 = 47.6 cm² . (c) AC = 8 / sin 34° = 14.3 cm, so the perimeter is 8 + 11.9 + 14.3 = 34.2 cm, which is less than 35 cm. Back to where you were → ';
const READ = 'This is what we read (a) tan 34 = 8 / BC BC = 8 / tan 34 = 11.9 (b) 8 × 11.9 = 95.2 P = 8 + 11.9 + 14.3 = 34.2 < 35 ';
const READ_EARNED = 'What this earned ✓ Perimeter formed from all three sides ✓ Comparison with 35 cm stated These are added to what you had already earned. Nothing here can take a mark away. ';
const CODES = 'CXC gives marks three ways: CK for knowing what to do, AK for doing the working, and R for explaining why. (a) CK1 ✓ (a) AK1 ✓ (a) AK2 ✓ (b) AK3 ✓ (b) AK4 ✗ ';
const NAV = '← previous 2 / 3 next →';

describe('the marked question, three states', () => {
  it('A · marked', () => {
    expect(text.marked).toBe(
      'Question 2 of 3 12 of 21 marks done 6 of 7 marks · 3 from your page Your marking Question Solution Worked solution 6/7 ' +
        QUESTION + PART_A + PART_B + ROWS_B + 'Query this mark ' + PART_C + LOOK_BACK + SOLUTION + READ + READ_EARNED + CODES + '(c) R1 ✓ (c) R2 ✓ ' + NAV,
    );
  });

  it('B · queried, line struck: the queried line where the link was, the struck line with no toggle', () => {
    expect(text.queried).toBe(
      'Question 2 of 3 12 of 21 marks done 6 of 7 marks · 3 from your page · 1 queried Your marking Question Solution Worked solution 6/7 ' +
        QUESTION + PART_A + PART_B + ROWS_B + 'Queried. A person will look before anything changes. ' + PART_C + LOOK_BACK + SOLUTION +
        'This is what we read (a) tan 34 = 8 / BC BC = 8 / tan 34 = 11.9 (b) 8 × 11.9 = 95.2 P = 8 + 11.9 + 14.3 = 34.2 < 35 you said this wasn’t yours ' +
        READ_EARNED + CODES + '(c) R1 ✓ (c) R2 ✓ ' + NAV,
    );
    const html = renderMarked(MARKED.queried);
    expect(html).toMatch(/<s class="text-dim">P = 8 \+ 11\.9 \+ 14\.3 = 34\.2 &lt; 35<\/s>/);
    expect(html).not.toMatch(/Put it back|Not what I wrote|Query this mark/);
  });

  it('C · marking failed: the panel under the outcome line, the read kept', () => {
    expect(text.failed).toBe(
      'Question 2 of 3 12 of 21 marks done 4 of 5 marks · 2 unassessed Your marking Question Solution Worked solution 4/5 marking did not finish — try again below ' +
        'Marking did not finish. Your marks so far are unchanged, and what we read is kept. Try marking again No new photograph — the same page is marked again ' +
        QUESTION + PART_A +
        '(b) Calculate the area of triangle ABC. [2] Answer to (b) 95.2 ✗ Area of a triangle is ½ × base × height. The multiplication earned the method mark; the value did not earn the accuracy mark. ' +
        PART_C + LOOK_BACK.replace('6 of 7', '4 of 5') + SOLUTION + READ + 'The read is kept. Only the marking has to run again. ' + CODES + '(c) R1 — not assessed (c) R2 — not assessed ' + NAV,
    );
    expect(renderMarked(MARKED.failed).match(/Try marking again/g)).toHaveLength(1);
  });

  it('the just-marked screen goes on to the next question with what is left', () => {
    const card = readFileSync(join(process.cwd(), 'app', 'study', 'session', '[id]', 'question-card.tsx'), 'utf8');
    expect(card).toMatch(/Next question →[\s\S]{0,200}\{questionsLeft === 1 \? 'ONE MORE' : `\$\{questionsLeft\} MORE`\} · \{marksLeft\} MARK/);
    expect(card).toMatch(/questionsLeft <= 0 \? \(\s*'Finish session'/);
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
