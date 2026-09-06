import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { STATES, render, visibleText } from './helpers/dashboard-states';

// ROUND_8 Task 1: the four states of the dashboard say what the design says,
// in the DOM's order — the action column, then the rail — and nothing sits
// beneath the primary button beyond its label line.
const text = Object.fromEntries(Object.entries(STATES).map(([k, p]) => [k, visibleText(render(p))])) as Record<keyof typeof STATES, string>;

describe('the dashboard, four states', () => {
  it('A · new student', () => {
    expect(text.new).toBe(
      'Kiara\u2019s notebook . Nothing in it yet ' +
        'Mark one question free ONE REAL QUESTION · NOT ONE OF YOUR SESSIONS ' +
        'Or start with the diagnostic About 12 minutes · finds where to start ' +
        'What happens next 1 Work it on paper, the way the exam is. 2 Photograph the page. 3 Every method mark, and the reason for each.',
    );
  });

  it('B · first question done', () => {
    expect(text['first-done']).toBe(
      'Kiara\u2019s notebook . One question marked ' +
        'Start with a quick diagnostic ABOUT 12 MINUTES · EIGHT QUESTIONS · NOTHING SCORED ' +
        'Or start a session now About 15 minutes at exam pace ' +
        'Your first question Quadratics — factorising 2/3 Read the marking again',
    );
    expect(render(STATES['first-done'])).toContain('href="/study/session/abc123"');
  });

  it('C · returning', () => {
    expect(text.returning).toBe(
      'Start today\u2019s session 15 MINUTES · WEAKEST TOPICS FIRST ' +
        'Where your marks are Algebraic manipulation +8 marks Consumer arithmetic +6 marks Geometry & trigonometry +5 marks ' +
        'Marks your estimate could gain from that topic. Module 1 comes first, so later modules wait — you can still practise any topic by name. ' +
        'Or choose for yourself Revisit mistakes 14 marks lost across 6 objectives Take a diagnostic 12 minutes · re-ranks your topics M1 · Algebraic manipulation Go Practise it ' +
        'Estimate today Grade III third of the six Paper 3 assumed at neutral carry-over. Moves with every question. Progress Topic by topic ' +
        'Since you started 12 sessions 31 questions 248 marks assessed 5 days in a row',
    );
  });

  it('D · no estimate yet', () => {
    expect(text['no-estimate']).toBe(
      'Start today\u2019s session 15 MINUTES · 23 MORE MARKS AND MODULE 1 CAN BE ESTIMATED ' +
        'Or choose for yourself Revisit mistakes Nothing far enough back yet — these are still fresh Take a diagnostic 12 minutes · re-ranks your topics M1 · Algebraic manipulation Go Practise it ' +
        'Not yet estimated A grade needs enough marks seen in every module it covers. This is how close each one is. ' +
        'Module 1 12 of 35 marks seen Module 2 0 of 35 marks seen Module 3 4 of 35 marks seen ' +
        'No letter is shown until then. A cold account\u2019s arithmetic reads as a verdict, and it is not one. ' +
        'Since you started 3 sessions 5 questions 16 marks assessed 2 days in a row',
    );
  });

  it('the estimate is never the headline, and the revisit and diagnostic buttons match', () => {
    const html = render(STATES.returning);
    expect(html.indexOf('Start today')).toBeLessThan(html.indexOf('Estimate today'));
    const buttons = [...html.matchAll(/<button[^>]*>(Revisit mistakes|Take a diagnostic)/g)].map((m) => m[0].replace(/ disabled=""/, ''));
    expect(buttons).toHaveLength(2);
    expect(buttons[0].replace('Revisit mistakes', '')).toBe(buttons[1].replace('Take a diagnostic', ''));
  });

  it('keeps every refusal the page could show', () => {
    const view = readFileSync(join(process.cwd(), 'app', 'study', 'dashboard.tsx'), 'utf8');
    for (const e of ['access-expired', 'diagnostic-taken', 'first-taken', 'needs-access', 'no-questions', 'nothing-to-revisit', 'no-topic']) {
      expect(view).toContain(`error === '${e}'`);
    }
    expect(visibleText(render({ ...STATES.returning, error: 'needs-access' }))).toContain('Get access');
    // A passed sitting cannot be re-bought: the account's sitting never changes and a new
    // payment would grant the sitting that has passed. Until a sitting change exists, the
    // one true action is to write to Help.
    const expired = render({ ...STATES.returning, error: 'access-expired' });
    expect(expired).toContain('href="mailto:');
    expect(visibleText(expired)).not.toContain('Get access');
  });
});
