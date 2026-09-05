import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { reviewFlags } from '@/lib/admin/review-flags';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');

// ROUND_7 Task 3: review says the truth.
describe('the review card', () => {
  it('acts on a key only while the card has focus, and asks once before retiring an approved question', () => {
    const card = at('app', 'admin', 'review', 'review-card.tsx');
    expect(card).toMatch(/if \(!cardRef\.current\?\.contains\(document\.activeElement\)\) return;/);
    expect(card).toMatch(/<article ref=\{cardRef\} tabIndex=\{0\}/);
    expect(card).toMatch(/question\.status === 'approved' && !window\.confirm\(/);
    expect(card).toMatch(/onClick=\{retire\}/);
  });
  it('says "Overall totals met; N topic targets short" and opens each short topic in the search', () => {
    const page = at('app', 'admin', 'review', 'page.tsx');
    expect(page).toMatch(/const totalsMet = p1Short <= 0 && p2Short <= 0;/);
    expect(page).toMatch(/Overall totals met; <b className="text-red-pen">\{shortTopics\.length\}<\/b> topic target/);
    expect(page).toMatch(/href=\{`\/admin\/review\?find=\$\{encodeURIComponent\(`topic:\$\{r\.code\}`\)\}`\}/);
    expect(at('lib', 'admin', 'find-questions.ts')).toMatch(/\^topic:\(\[A-Z0-9-\]\+\)\$/);
  });
  it('no longer raises the self-marked flag', () => {
    const q = {
      kind: 'structured',
      stem: 's',
      marks: 2,
      parts: [{ label: 'a', prompt: 'p', marks: 2, slots: [{ label: 'i', answer: '10', response_mode: 'show_that' }] }],
      rubric: [{ code: 'R1', profile: 'R', criterion: 'c', mark_value: 2, slot_ref: 'a.i', part_label: 'a' }],
    };
    expect(reviewFlags(q as never).map((f) => f.text).join(' ')).not.toMatch(/self-marked/);
    expect(at('lib', 'admin', 'review-flags.ts')).not.toMatch(/self-marked/);
  });
});
