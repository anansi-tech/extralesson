import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { StudyChrome } from '@/app/study/study-chrome';
import { visibleText } from './helpers/card-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study' }));

// ROUND_9 Task 9: "Change sitting" lives in the account disclosure — the
// sitting in the bar, opened. Its words are the create door's.
const html = renderToStaticMarkup(
  createElement(StudyChrome, { sitting: 'Jan 2027 re-sit', current: 'jan-2027', email: 'kiara@example.com', children: 'paper' }),
);
const details = [...html.matchAll(/<details>[\s\S]*?<\/details>/g)].map((m) => m[0]);

describe('the account disclosure', () => {
  it('is the sitting, once in each row of the bar', () => {
    expect(details).toHaveLength(2);
    expect(details[0]).toBe(details[1]);
    expect(visibleText(details[0])).toBe(
      'Jan 2027 re-sit kiara@example.com Which sitting are you entered for May/June 2027 January 2027 re-sit Change sitting',
    );
  });
  it('offers the account’s own sitting as the selected one', () => {
    expect(details[0]).toMatch(/<option value="jan-2027" selected="">January 2027 re-sit<\/option>/);
    expect(details[0]).toContain('name="to"');
  });
  it('leaves Help and Sign out in the bar, beside it', () => {
    expect(visibleText(html).startsWith('Jan 2027 re-sit kiara@example.com')).toBe(true);
    expect(html).toContain('>Help</a>');
    expect(html).toContain('>Sign out</button>');
  });
});
