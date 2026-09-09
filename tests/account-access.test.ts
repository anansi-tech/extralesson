import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudyChrome } from '@/app/study/study-chrome';
import { visibleText } from './helpers/card-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study' }));

// One quiet entry in the account disclosure while the sitting has no grant:
// the same checkout link as the paywall, and nothing at all once paid.
const chrome = (paid: boolean) =>
  renderToStaticMarkup(createElement(StudyChrome, { sitting: 'May/June 2027', current: 'may-june-2027', email: 'kiara@example.com', paid, children: null }));

describe('the account disclosure and access', () => {
  it('unpaid: Get access · $49 as a quiet link to the checkout, after the sitting', () => {
    const html = chrome(false);
    expect(visibleText(html)).toMatch(/kiara@example\.com May\/June 2027 Get access · \$49 Which sitting/);
    expect(html).toMatch(/<a href="[^"]+" target="_blank" rel="noopener" class="[^"]*underline[^"]*">Get access · \$49<\/a>/);
    expect(html).not.toMatch(/Get access[^<]*<\/a>[^]*bg-red-pen|bg-red-pen[^]*Get access/);
  });
  it('paid: no entry at all', () => {
    expect(chrome(true)).not.toContain('Get access');
  });
  it('the layout reads the grant the paywall reads', () => {
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    const layout = readFileSync(require('node:path').join(process.cwd(), 'app', 'study', 'layout.tsx'), 'utf8');
    expect(layout).toContain('paid={hasAccess(student?.access)}');
  });
});
