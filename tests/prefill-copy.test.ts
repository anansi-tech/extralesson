import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');

// ROUND_7 Task 2: honest prefill, and the phone.
describe('honest prefill', () => {
  it('names the boxes a read filled and the ones it did not, with a jump to each', () => {
    const card = at('app', 'study', 'session', '[id]', 'question-card.tsx');
    expect(card).toMatch(/We filled the single answers/);
    expect(card).toMatch(/Enter the rest yourself/);
    expect(card).toMatch(/href=\{`#slot-\$\{sl\.ref\}\$\{sl\.input \? '-0' : ''\}`\}/);
  });
  it('promises no universal prefill on the camera card or the landing', () => {
    expect(at('app', 'study', 'session', '[id]', 'working-photo.tsx')).not.toMatch(/We fill in the boxes/);
    expect(at('app', 'study', 'session', '[id]', 'working-photo.tsx')).toMatch(/single-answer boxes/);
    expect(at('app', 'page.tsx')).not.toMatch(/fill(s|ed)? in the boxes/i);
  });
  it('stacks the nav below 400px and wraps admin identifiers', () => {
    expect(at('app', 'study', 'study-chrome.tsx')).toMatch(/lg:hidden[\s\S]*hidden[\s\S]*lg:flex/);
    expect((at('app', 'admin', 'access', 'page.tsx').match(/break-all/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });
});
