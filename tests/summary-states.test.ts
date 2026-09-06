import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SUMMARIES, visibleText } from './helpers/summary-states';
import { mainTopic, marksOnTopic, movedLine, trendLine } from '@/lib/study/summary';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study' }));

// ROUND_9 Task 6: one skeleton, four claims, every claim the fold's.
const text = Object.fromEntries(Object.entries(SUMMARIES).map(([k, f]) => [k, visibleText(f())]));

describe('the session summaries', () => {
  it('first: no trend — nothing to compare it against yet', () => {
    expect(text.first).toBe(
      'Your first session 5 of 7 marks . Nothing to compare it against yet. From tomorrow this line shows which way it is going. What that question earned 5/7 Q1 Algebraic manipulation: 0% → 71% topic strength. Next: the diagnostic Eight quick questions across the syllabus. Nothing is graded — it puts your topics in order, so the sessions after it start in the right place. Start the diagnostic About 12 minutes · finds where to start Back to your notebook',
    );
  });
  it('adaptive: the trend on the same topic where an earlier session exists, the letter only', () => {
    expect(text.adaptive).toBe(
      'Session 12 · Algebraic manipulation 14 of 21 marks . Up from 11 of 21 on the same topic 5 days ago. 5/7 Q1 6/9 Q2 3/5 Q3 Estimate today Grade III Algebraic manipulation: 40% → 55% topic strength. Start the next session Consumer arithmetic is next · +6 marks Back to your notebook',
    );
    expect(text['adaptive-no-trend']).toBe(
      'Session 2 · Consumer arithmetic 9 of 12 marks . 5/7 Q1 6/9 Q2 Consumer arithmetic: 30% → 62% topic strength. Start the next session About 15 minutes at exam pace Back to your notebook',
    );
    for (const k of Object.keys(text)) expect(text[k], k).not.toMatch(/upper|lower|Remind|7 PM|Come back tomorrow|→ upper/);
    expect(SUMMARIES.adaptive()).toContain('href="/study/session/s1?q=1#marking"');
  });
  it('revisit: recovered or still going per objective, from the fold', () => {
    expect(text.revisit).toBe(
      'Revisit · 4 objectives 11 of 14 marks . These were new questions on the objectives you had lost marks on. 5/7 Q1 6/9 Q2 3/5 Q3 ✓ Factorise a quadratic expression recovered ✓ Find the area of a triangle recovered ✓ Calculate a percentage discount recovered – Solve problems involving bearings still going 3 of 4 recovered. Start the next session Consumer arithmetic is next · +6 marks Back to your notebook',
    );
  });
  it('diagnostic: no marks; the ranking as Task 5 built it', () => {
    expect(text.diagnostic).toMatch(/^Diagnostic done Here is the order \./);
    expect(text.diagnostic).not.toMatch(/of \d+ marks \./);
  });
  it('the claims are computed, never written', () => {
    expect(trendLine({ earned: 14, assessed: 21 }, { earned: 11, assessed: 21, daysAgo: 5 })).toBe('Up from 11 of 21 on the same topic 5 days ago.');
    expect(trendLine({ earned: 9, assessed: 21 }, { earned: 11, assessed: 21, daysAgo: 1 })).toBe('Down from 11 of 21 on the same topic yesterday.');
    expect(trendLine({ earned: 7, assessed: 14 }, { earned: 11, assessed: 22, daysAgo: 0 })).toBe('The same as 11 of 22 on the same topic today.');
    expect(trendLine({ earned: 9, assessed: 21 }, null)).toBeNull();
    expect(movedLine([{ title: 'A', from: 0.4, to: 0.55 }, { title: 'B', from: 0.5, to: 0.2 }])).toBe('B: 50% → 20% topic strength.');
    expect(movedLine([{ title: 'A', from: 0.4, to: 0.404 }])).toBeNull();
    const by = new Map([['M1.5.1', { earned: 3, assessed: 7 }], ['M1.5.2', { earned: 2, assessed: 2 }], ['M2.1.1', { earned: 1, assessed: 5 }]]);
    expect(mainTopic(by)).toBe('M1.5.');
    expect(marksOnTopic(by, 'M1.5.')).toEqual({ earned: 5, assessed: 9 });
    const page = readFileSync(join(process.cwd(), 'app', 'study', 'session', '[id]', 'page.tsx'), 'utf8');
    expect(page).toMatch(/estimate=\{after\.prediction\.estimable && after\.prediction\.overall_grade \? gradeLabel/);
    expect(page).toMatch(/claim=\{prefix \? trendLine\(marksOnTopic\(byObjective, prefix\), trend\) : null\}/);
    expect(page).toMatch(/moved=\{objectives\.length > 0 \? `\$\{recovered\} of \$\{objectives\.length\} recovered\.` : null\}/);
  });
});
