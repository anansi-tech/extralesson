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
      'Diagnostic · 3 of 8 Not scored Consumer arithmetic A shirt marked $80 is sold at a 15% discount. What is the selling price? A $65.00 B $68.00 C $72.00 D $92.00 I don’t know More useful than a guess Hand in ← previous 3 / 8',
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
