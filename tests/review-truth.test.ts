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
    // The sentence moved under the four facts in ROUND_13 Task 2; what it says
    // and where it goes are unchanged.
    expect(page).toMatch(/Totals met, <b className="text-red-pen">\{shortTopics\.length\}<\/b> topic target/);
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

// ROUND_13 Task 2: four facts, above the card, in a fixed order. The strip ran
// them into one sentence with an "everything on target" branch, so which fact
// you were reading depended on which branch had fired.
describe('the deficits strip', () => {
  const page = at('app', 'admin', 'review', 'page.tsx');

  it('is four facts in a fixed order, and sits above the card', () => {
    const facts = page.slice(page.indexOf('const facts = ['), page.indexOf('];', page.indexOf('const facts = [')));
    for (const label of ['objectives with no approved question', 'more below the floor of ${OBJECTIVE_FLOOR}', 'P1 items short', 'P2 marks short']) {
      expect(facts, label).toContain(label);
    }
    expect([...facts.matchAll(/label:/g)]).toHaveLength(4);
    expect(page.indexOf('{facts.map('), 'above the card').toBeLessThan(page.indexOf('<ReviewCard'));
  });

  it('says a met target rather than dropping it, so the four are always four', () => {
    const facts = page.slice(page.indexOf('const facts = ['), page.indexOf('];', page.indexOf('const facts = [')));
    expect(facts).toContain("met: 'P1 on target'");
    expect(facts).toContain("met: 'P2 on target'");
    // A count of zero on the two objective facts still reads as a number: "0
    // short" and "not measured" are different answers.
    expect(page).toMatch(/f\.n > 0 \|\| !f\.met \?/);
  });

  it('the card leads with the flags, and a flag is never a verdict', () => {
    const card = at('app', 'admin', 'review', 'review-card.tsx');
    const order = ['question.flags.map', 'question.objectives.map', 'M{question.module}', 'question.recipeJson'].map((s) => card.indexOf(s));
    expect(order.every((n) => n > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    // Red bar for a warning, paper-deep for a note; neither blocks approval.
    expect(card).toMatch(/f\.level === 'warn' \? 'border-red-pen bg-red-tint' : 'border-paper-deep bg-note text-dim'/);
    expect(card).not.toMatch(/flags[\s\S]{0,200}disabled=/);
  });

  it('shows the keyboard letters at 1280 and drops them at 390', () => {
    const card = at('app', 'admin', 'review', 'review-card.tsx');
    expect([...card.matchAll(/<kbd className="hidden [^"]*lg:inline"/g)], 'all three').toHaveLength(3);
    expect(card).not.toMatch(/<kbd className="font-mono/);
  });
});

// ROUND_13 Task 3: the round's one new capability, authorised by David, and
// the two places it is used. Declared, not matched against prose: objective_ids
// is the field the coverage counts are computed from, so a chip and the search
// it opens cannot disagree.
describe('objective: in the search', () => {
  it('matches on the declared field, and nothing else joins the grammar', () => {
    const src = at('lib', 'admin', 'find-questions.ts');
    expect(src).toMatch(/\/\^objective:\(\[A-Z0-9\.\]\+\)\$\/i/);
    expect(src).toMatch(/objective_ids: objective\.toUpperCase\(\)/);
    // topic:, objective:, an id, free text. No fifth.
    expect([...src.matchAll(/\/\^[a-z]+:\(/g)].map((m) => m[0])).toEqual(['/^topic:(', '/^objective:(']);
  });

  it('every coverage chip opens Review filtered to its objective', () => {
    const coverage = at('app', 'admin', 'coverage', 'page.tsx');
    expect(coverage).toMatch(/href=\{`\/admin\/review\?find=\$\{encodeURIComponent\(`objective:\$\{o\.id\}`\)\}`\}/);
    // A chip is the link, not a span with a link beside it.
    expect(coverage).toMatch(/<Link\s+key=\{o\.id\}/);
    expect(coverage).not.toMatch(/<span\s+key=\{o\.id\}/);
  });

  it('the two objective facts are openable and the two P facts are not', () => {
    const page = at('app', 'admin', 'review', 'page.tsx');
    expect(page).toMatch(/ids: noneApproved/);
    expect(page).toMatch(/ids: underFloor/);
    // A shortfall against a total names no objective, so it stays a fact.
    expect([...page.matchAll(/ids: \[\]/g)], 'P1 and P2').toHaveLength(2);
    expect(page).toMatch(/objective:\$\{id\}/);
  });
});
