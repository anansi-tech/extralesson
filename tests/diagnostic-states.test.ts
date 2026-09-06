import { describe, expect, it, vi } from 'vitest';
import { DIAGNOSTIC, visibleText } from './helpers/diagnostic-states';
import { rankForFinish } from '@/lib/study/diagnostic';

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
  it('finish: the order with the marks, the real next session, no grade', () => {
    expect(text.finish).toBe(
      'Diagnostic done Here is the order . A quick read of 4 topics — enough to put them in order, which is all it was for. ' +
        '01 Algebraic manipulation 0 of 1 right +8 marks 02 Consumer arithmetic 0 of 1 right +6 marks 03 Geometry & trigonometry 1 of 2 right +5 marks 04 Number theory 1 of 1 right +2 marks ' +
        'One question a topic is a rough read — enough to point the next few sessions, not a verdict on any of them. Topics you were not asked about are not here at all, and still count as unmeasured. ' +
        'Start with algebraic manipulation 15 minutes · your next session starts here No grade yet. A grade needs enough marks seen in every module it covers, and the diagnostic is not marked. Back to your notebook',
    );
    expect(text.finish).not.toMatch(/Grade [IV]+|upper|lower/);
  });
  it('the finish orders what struggled first, then by the marks on offer, then the syllabus', () => {
    const topics = [
      { code: 'a', module: 1, order: 1 },
      { code: 'b', module: 1, order: 2 },
      { code: 'c', module: 2, order: 1 },
      { code: 'd', module: 2, order: 2 },
    ];
    const verdict = { a: 'HELD UP', b: 'STRUGGLED', c: 'MIXED', d: 'STRUGGLED' } as const;
    const marks = { a: 9, b: 3, c: 5, d: 8 };
    expect(rankForFinish(topics, (t) => verdict[t.code as keyof typeof verdict], (t) => marks[t.code as keyof typeof marks]).map((t) => t.code)).toEqual(['d', 'b', 'c', 'a']);
  });
});
