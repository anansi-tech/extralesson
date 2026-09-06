import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REFUSALS, visibleText } from './helpers/refusal-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study' }));

// ROUND_9 Task 4: every refusal on one pattern — label · one sentence · what
// remains true · one action · optional quiet link — in ink, never red but
// the paywall's action, never a cross, never "sorry".
const html = Object.fromEntries(Object.entries(REFUSALS).map(([k, f]) => [k, f()]));
const text = Object.fromEntries(Object.entries(html).map(([k, h]) => [k, visibleText(h)]));
const TODAY = 'Start today’s session 15 minutes · weakest topics first';

describe('the refusals', () => {
  it('paywall: the real boundary, the price, the only red action, the marked work as the quiet link', () => {
    expect(text.paywall).toBe(
      'That was your 2 free sessions The free question, the diagnostic and your 2 free sessions are used. Daily sessions, the diagnostic and examiner-style marking need full access. ' +
        'Everything you have done stays here — your marks, your topics, and every question you have answered. ' +
        '$49 One payment · no subscription Runs to your sitting Use kiara@example.com when you pay, so we can match it to this account. ' +
        'Get access — $49 SECURE CHECKOUT · CARD OR APPLE PAY Read your marked work',
    );
    expect(html.paywall).toMatch(/<a [^>]*bg-red-pen/);
    expect(html.paywall).toMatch(/<a [^>]*target="_blank"[^>]*rel="noopener"|<a [^>]*rel="noopener"[^>]*target="_blank"/);
    expect(html.paywall).toContain('href="/study/history"');
  });
  it('sitting passed', () => {
    expect(text['sitting-passed']).toBe(
      'Your sitting has passed Access ran to May/June 2027, and that paper is written. Your notebook stays open — every question and every mark, for as long as you want to read them. Get access for the next sitting $49 · one payment · runs to your sitting',
    );
  });
  it('no retakes left, from the live take count', () => {
    expect(text['no-retakes']).toBe(
      'No retakes left Two photographs of this page have been read already. The read we have is kept, and you can correct any line of it yourself before you hand in. Check what we read Fix a line, or hand in as is',
    );
    expect(readFileSync(join(process.cwd(), 'app', 'study', 'session', '[id]', 'working-photo.tsx'), 'utf8')).toMatch(/WORDS\[MAX_TAKES\]/);
  });
  it('nothing to revisit', () => {
    expect(text['nothing-to-revisit']).toBe(
      'Nothing to revisit yet The marks you lost are still fresh — revisiting them today would only be repeating them. They come back on their own, on the objectives you lost them on, in a few days. ' + TODAY,
    );
  });
  it('question handed in, with the marks from the fold', () => {
    expect(text['handed-in']).toBe(
      'This question is handed in Answers close once a question is marked, the way a paper does. If a mark looks wrong, query it — a person looks before anything changes. Read your marking 6 of 7 marks · with the reasons',
    );
    expect(html['handed-in']).toContain('href="#marking"');
  });
  it('the diagnostic and the first question, already taken', () => {
    expect(text['diagnostic-taken']).toBe(
      'You have already done the diagnostic It ranks your topics, and it has — your sessions start where it put you. Another one this term would rank the same topics from the same answers. It opens again after 90 days, for coming back to after a term away. ' + TODAY,
    );
    expect(text['first-taken']).toBe('You have had your first question It was one question to show how marking works, and it is done. A session gives you whole exam questions marked the same way. ' + TODAY);
  });
  it('no questions, and a topic that is not yours', () => {
    expect(text['no-questions']).toBe('No approved questions yet No approved questions are available for your modules yet. Check back soon. Everything you have done stays here. Read your marked work');
    expect(text['no-questions-topic']).toBe('No questions on that topic yet There are no questions on that topic yet. Try another one, or start the usual session. ' + TODAY + ' Practise a topic');
    expect(text['no-topic']).toBe('That topic is not one of yours That topic is not one of yours. Pick one from the list. ' + TODAY + ' Practise a topic');
  });
  it('one pattern: ink, never red but the paywall, never a cross, never sorry', () => {
    for (const [k, h] of Object.entries(html)) {
      expect(h, k).toMatch(/^<section data-refusal="[^"]+" class="border-\[1\.5px\] border-ink bg-white/);
      expect(h, k).not.toMatch(/✗|sorry|is-alert|border-red-pen/i);
      if (k !== 'paywall') expect(h, k).not.toMatch(/bg-red-pen|text-red-pen/);
      expect((h.match(/<(button|a href)/g) ?? []).length, `${k} actions`).toBeLessThanOrEqual(2);
    }
  });
});
