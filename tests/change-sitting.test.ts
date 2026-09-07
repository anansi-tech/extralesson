import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { StudyChrome } from '@/app/study/study-chrome';
import { visibleText } from './helpers/card-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study' }));

// ROUND_9 Task 9: "Change sitting" lives in the account disclosure — the
// Account in the bar, opened. Its words are the create door's.
const props = { sitting: 'January 2027', current: 'jan-2027', email: 'kiara@example.com', children: 'paper' };
const html = renderToStaticMarkup(createElement(StudyChrome, props));
const details = [...html.matchAll(/<details>[\s\S]*?<\/details>/g)].map((m) => m[0]);

describe('the account disclosure', () => {
  it('is labelled Account, once in each row of the bar', () => {
    expect(details).toHaveLength(2);
    expect(details[0]).toBe(details[1]);
    expect(visibleText(details[0])).toBe(
      'Account ▾ Your account kiara@example.com January 2027 Which sitting are you entered for January 2027 May/June 2027 January 2028 May/June 2028 January 2029 May/June 2029 January 2030 May/June 2030 January 2031 May/June 2031 Change sitting Sign out',
    );
  });
  it('offers the account’s own sitting as the selected one', () => {
    expect(details[0]).toMatch(/<option value="jan-2027" selected="">January 2027<\/option>/);
    expect(details[0]).toContain('name="to"');
  });
  it('keeps Sign out inside Account and Help beside it', () => {
    expect(details[0]).toContain('>Sign out</button>');
    expect(html.replace(/<details>[\s\S]*?<\/details>/g, '')).not.toContain('>Sign out</button>');
    expect(html).toContain('>Help</a>');
  });
  it('shows the admin link only for an admin', () => {
    expect(html).not.toContain('href="/admin/access"');
    const admin = renderToStaticMarkup(createElement(StudyChrome, {
      ...props, email: 'operator@example.com', isAdmin: true,
    }));
    expect(admin).toContain('href="/admin/access"');
  });
});
