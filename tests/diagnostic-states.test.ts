import { describe, expect, it, vi } from 'vitest';
import { DIAGNOSTIC, visibleText } from './helpers/diagnostic-states';
import { finishOrder } from '@/lib/study/diagnostic';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study' }));

// ROUND_9 Task 5: the diagnostic's three screens — the intro with the three
// facts and the real count, the MCQ card with "I don't know" at full weight,
// the ranked finish with the leverage marks and no grade.
const text = Object.fromEntries(Object.entries(DIAGNOSTIC).map(([k, f]) => [k, visibleText(f())]));

describe('the diagnostic', () => {
  it('intro: the three facts and the count, no promise of stopping early', () => {
    expect(text.intro).toBe(
      'Next: the diagnostic A quick diagnostic . Eight quick questions across the syllabus. Nothing is graded — it puts your topics in order, so the sessions after it start in the right place. ' +
        '12 min About a minute and a half a question No marks Nothing here is scored, and nothing here counts against you No paper Tap the answer — this one is not worked by hand ' +
        'Start the diagnostic eight questions',
    );
    expect(DIAGNOSTIC.intro()).toContain('href="/study/session/d1?begin=1"');
    expect(text.intro).not.toMatch(/stop|Stop/);
  });
  it('MCQ card: the bar says diagnostic and not scored, the topic above the stem, no marks, I don’t know at full weight', () => {
    expect(text.mcq).toBe(
      'Diagnostic · 3 of 8 Not scored Consumer arithmetic A shirt marked $80 is sold at a 15% discount. What is the selling price? A $65.00 B $68.00 C $72.00 D $92.00 I don’t know More useful than a guess Next ← previous 3 / 8',
    );
    expect(DIAGNOSTIC.mcq()).toMatch(/style="width:37\.5%"/);
    expect(text.mcq).not.toMatch(/Stop here|\[1 mark\]/);
  });
  it('finish: the header, every topic with what it could gain, the rule before the unasked, no grade', () => {
    expect(text.finish).toBe(
      'Diagnostic done Here is the order . A quick read of 4 topics — enough to put them in order, which is all it was for. To gain ' +
        '01 Algebraic manipulation 0 of 1 right up to +8 marks 02 Consumer arithmetic 0 of 1 right up to +6 marks 03 Geometry & trigonometry 1 of 2 right up to +5 marks 04 Number theory 1 of 1 right up to +2 marks ' +
        '05 Sets not asked yet up to +7 marks 06 Statistics not asked yet up to +4 marks ' +
        'One question a topic is a rough read — enough to point the next few sessions, not a verdict on any of them. Topics below the rule were not asked about, and count as unmeasured. ' +
        'Start with algebraic manipulation 15 minutes · your next session starts here No grade yet. A grade needs enough marks seen in every module it covers, and the diagnostic is not marked. Back to your notebook',
    );
    expect(text.finish).not.toMatch(/Grade [IV]+|upper|lower/);
    // The rule: row 1 and the first unasked row carry the ink border; no other row does.
    expect(DIAGNOSTIC.finish().match(/border-t-\[1\.5px\] border-ink/g)).toHaveLength(2);
  });
  it('the button names row 1 and starts a session on it', () => {
    const html = DIAGNOSTIC.finish();
    const first = /<b class="[^"]*">([^<]+)<\/b>/.exec(html)![1];
    expect(text.finish).toContain(`Start with ${first.charAt(0).toLowerCase()}${first.slice(1)}`);
    expect(html).toContain('name="mode" value="topic"');
    expect(html).toContain('name="topic" value="M1-ALG1"');
  });
  it('the finish lists the measured topics first, then the unasked, each by the marks on offer, then the syllabus', () => {
    const topics = [
      { code: 'a', module: 1, order: 1 },
      { code: 'b', module: 1, order: 2 },
      { code: 'c', module: 2, order: 1 },
      { code: 'd', module: 2, order: 2 },
      { code: 'e', module: 3, order: 1 },
    ];
    const measured = new Set(['b', 'c', 'e']);
    const marks = { a: 9, b: 3, c: 5, d: 8, e: 5 };
    expect(finishOrder(topics, (t) => measured.has(t.code), (t) => marks[t.code as keyof typeof marks]).map((t) => t.code)).toEqual(['c', 'e', 'b', 'a', 'd']);
  });
});

// NOTHING ON THIS CARD IS RIGHT OR WRONG. The diagnostic is not scored, so the
// option a student picks is marked as chosen and nothing more — a red edge on
// their own answer reads as a verdict, and the design sheet says it plainly:
// no marks, no grade, no red pen anywhere in the diagnostic.
describe('the diagnostic card carries no verdict', () => {
  // Every token the system sheet spends on a verdict: the red pen and its
  // tint, the green of an awarded mark, the amber of partial credit, and the
  // marks themselves.
  const VERDICT = /red-pen|green-pen|#fdf1f0|#c1121f|#2e7d5b|#e8f0e9|withheld|amber|✓|✗|✔|✘|\bcorrect\b|\bwrong\b/gi;
  const cards = ['mcq', 'mcq-chosen', 'mcq-dont-know'] as const;

  it('no verdict token reaches the question or its options, in any state', () => {
    for (const name of cards) {
      const html = DIAGNOSTIC[name]();
      // Everything the student reads and picks from, up to the one action.
      const asked = html.slice(0, html.indexOf('id="hand-in"'));
      expect(asked.indexOf('id="hand-in"'), name).toBe(-1);
      expect(asked.match(VERDICT), name).toBeNull();
    }
  });

  it('the chosen option is marked as chosen, and differs from the ones not chosen', () => {
    // Before the hand-in: the options, and nothing else the student can press.
    const options = (html: string) =>
      [...html.slice(0, html.indexOf('id="hand-in"')).matchAll(/<button[^>]*class="([^"]*)"/g)].map((m) => m[1]);
    const plain = options(DIAGNOSTIC.mcq());
    const picked = options(DIAGNOSTIC['mcq-chosen']());
    expect(plain.length, 'four options and I don’t know').toBe(5);
    expect(picked.length).toBe(plain.length);
    const moved = picked.filter((c, i) => c !== plain[i]);
    expect(moved.length, 'exactly one option changed').toBe(1);
    expect(moved[0]).toContain('shadow-[inset_3px_0_0_var(--ink)]');
    // Neutral: it gains a fill and a shadow the sheet already owns, and the
    // border stays 1.5px so choosing does not move the row.
    expect(moved[0]).toContain('border-[1.5px]');
    expect(moved[0]).not.toMatch(VERDICT);
  });

  it('“I don’t know” is chosen the same way, without changing its ground', () => {
    const dk = (html: string) => /<button[^>]*class="([^"]*)"[^>]*>I don/.exec(html)![1];
    expect(dk(DIAGNOSTIC.mcq())).not.toContain('shadow-[inset_3px_0_0_var(--ink)]');
    expect(dk(DIAGNOSTIC['mcq-dont-know']())).toContain('shadow-[inset_3px_0_0_var(--ink)]');
    expect(dk(DIAGNOSTIC['mcq-dont-know']())).not.toMatch(VERDICT);
  });

  it('the one red on the card is the action, not a judgement', () => {
    const html = DIAGNOSTIC['mcq-chosen']();
    expect((html.match(/red-pen/g) ?? []).length).toBe(1);
    expect(html.slice(html.indexOf('id="hand-in"'))).toContain('bg-red-pen');
  });
});

// The screen after the tap, which no test had ever rendered.
describe('the diagnostic card once it is answered', () => {
  const order = (html: string) => ({ note: html.indexOf('id="misconception"'), solution: html.indexOf('id="worked-solution"') });

  it('a wrong answer: the note about the answer, then the solution to the question', () => {
    const html = DIAGNOSTIC['mcq-answered-wrong']();
    const { note, solution } = order(html);
    expect(note, 'the note is rendered').toBeGreaterThan(-1);
    expect(solution, 'the solution is rendered').toBeGreaterThan(-1);
    expect(note, 'the note comes first').toBeLessThan(solution);
    const text = visibleText(html);
    expect(text).toContain('Discount added, not subtracted');
    expect(text).toContain('Worked solution');
    expect(text).toContain('15% of $80 is $12');
  });

  it('a right answer: the solution, and no note', () => {
    const html = DIAGNOSTIC['mcq-answered-right']();
    expect(order(html).note, 'nothing to correct').toBe(-1);
    expect(order(html).solution).toBeGreaterThan(-1);
    expect(visibleText(html)).toContain('15% of $80 is $12');
  });

  it('both keep the answer marked as chosen and nothing else', () => {
    for (const name of ['mcq-answered-right', 'mcq-answered-wrong'] as const) {
      // The answer buttons by their own signature: once a card is answered
      // there is no hand-in to slice at, and the continue button is red.
      const options = [...DIAGNOSTIC[name]().matchAll(/<button[^>]*class="([^"]*border-\[1\.5px\] border-ink[^"]*)"/g)].map((m) => m[1]);
      expect(options.length, name).toBe(5);
      expect(options.filter((c) => c.includes('shadow-[inset_3px_0_0_var(--ink)]')).length, name).toBe(1);
      expect(options.some((c) => /red-pen|green-pen/.test(c)), name).toBe(false);
    }
  });
});
