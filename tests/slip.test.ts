import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QuestionCard from '@/app/study/session/[id]/question-card';
import { MARKED } from './helpers/marked-states';
import { visibleText } from './helpers/card-states';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { supportedSlips } from '@/lib/grade/method-marks';
import { MethodResultZ } from '@/lib/grade/mark-method';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study/session/s1' }));

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const page = ['1200000 - 144000 = 156000', '156000 / 1200000 = 13%'];

// ROUND_7 Task 1: the slip names the line where the working went wrong.
describe('the slip', () => {
  it('is kept only when its quote is on the page, however the symbols are written', () => {
    const kept = supportedSlips(
      [
        { part: '(b)', quote: '1200000 − 144000 = 156000', sentence: 'the subtraction is off by 900 000' },
        { part: 'c', quote: '156000 x 100 = 13', sentence: 'not on the page' },
        { part: 'd', quote: '', sentence: 'no quote at all' },
      ],
      page,
    );
    expect(kept.map((s) => s.part)).toEqual(['b']);
  });
  /**
   * A LENGTH FLOOR DISCARDED THE COMMONEST WRONG VALUE THERE IS. The rule was
   * two characters, so a page reading "8" on its own line had its slip dropped
   * for being too short, with the quote verbatim on the page — and a bare
   * numeral is exactly what a student writes when the value is wrong. What the
   * floor protected against is a short quote found INSIDE another line, so a
   * short quote must now be a line of its own.
   */
  describe('a short quote', () => {
    const bare = ['3x = 15', '8', 'fabric remains after 8 costumes.'];
    const slip = (quote: string) => supportedSlips([{ part: 'd', quote, sentence: 'the wrong number of costumes' }], bare);

    it('is kept when it stands on its own line', () => {
      expect(slip('8')).toHaveLength(1);
      // However the marker punctuates it, since flatLine strips that.
      expect(slip(' "8" ')).toHaveLength(1);
    });

    it('is dropped when it only appears inside another line', () => {
      // The 5 of "15" and the 3 of "3x": on the page, but not as a line.
      expect(slip('5')).toEqual([]);
      expect(slip('3')).toEqual([]);
    });

    it('still refuses a quote that is nowhere at all, and an empty one', () => {
      expect(slip('9')).toEqual([]);
      expect(slip('')).toEqual([]);
      expect(slip('   ')).toEqual([]);
    });

    it('leaves the two-character-and-longer rule as it was', () => {
      // A longer quote is still matched anywhere on the page, not just as a line.
      expect(slip('after 8 costumes')).toHaveLength(1);
      expect(slip('3x = 15')).toHaveLength(1);
      expect(slip('3x = 16')).toEqual([]);
    });
  });

  it('is part of the marker contract and optional in its answer', () => {
    expect(MethodResultZ.safeParse({ decisions: [] }).success).toBe(true);
    expect(MethodResultZ.safeParse({ decisions: [], slips: [{ part: 'a', quote: 'x', sentence: 's' }] }).success).toBe(true);
    expect(at('lib', 'grade', 'mark-method.ts')).toMatch(/SLIPS WANTED/);
  });
  it('is asked for only where the typed value was wrong, verified, stored, and rendered first under the part', () => {
    const mw = at('app', 'study', 'session', '[id]', 'mark-working.ts');
    expect(mw).toMatch(/slips = supportedSlips\(result\.slips/);
    expect(mw).toMatch(/\$set: \{\s*method_marks: methodMarks,\s*slips,/);
    const card = at('app', 'study', 'session', '[id]', 'question-card.tsx');
    const slip = card.indexOf('slipFor(p.label) && (');
    const reason = card.indexOf('partFeedback.reasonHtml && (');
    expect(slip).toBeGreaterThan(0);
    expect(slip).toBeLessThan(reason);
  });
  it('the pipeline eval reports slips per page and fails on an unsupported quote', () => {
    const e = at('scripts', 'eval-pipeline.ts');
    expect(e).toMatch(/unsupported === 0/);
    expect(e).toMatch(/UNSUPPORTED QUOTE/);
  });

  // A slip names the line a TYPED value went wrong on: never on a blank.
  it('renders only on a part with a typed, withheld value — never on a blank', () => {
    const mw = at('app', 'study', 'session', '[id]', 'mark-working.ts');
    expect(mw).toMatch(/\(confirmed\[`\$\{p\.label\}\.\$\{s\.label\}`\] \?\? ''\)\.trim\(\) !== ''/);
    const card = at('app', 'study', 'session', '[id]', 'question-card.tsx');
    expect(card).toMatch(/partFeedback && !partFeedback\.correct && typedFor\(p\.label\) && slipFor\(p\.label\) && \(/);
    // The fixture's slip is on (b), whose typed value 95.2 was withheld: it shows.
    expect(visibleText(renderToStaticMarkup(createElement(QuestionCard, { question: MARKED.marked })))).toContain('You wrote 8 × 11.9 and stopped');
    // The same slip on a part left blank does not.
    const prior = MARKED.marked.prior!;
    const blank = { ...MARKED.marked, prior: { ...prior, answers: { ...prior.answers, 'b.i': '' } } };
    expect(visibleText(renderToStaticMarkup(createElement(QuestionCard, { question: blank })))).not.toContain('You wrote 8 × 11.9 and stopped');
  });
});
