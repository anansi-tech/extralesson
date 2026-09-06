import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';
import { AdminChrome } from '@/app/admin/admin-chrome';
import { bodyPage } from './helpers/chrome-page';
import { visibleText } from './helpers/card-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/admin/review' }));

// ROUND_10 Task 1: the operator's chrome is the student chrome's bar — lockup,
// five routes, the signed-in address, Sign out, no page title — and every
// admin page sits on the paper in the 960 column beneath it.
const LONG = 'the.operator.with.a.very.long.address@subdomain.example-school.edu.tt';
const page = (email: string) =>
  bodyPage(
    renderToStaticMarkup(
      createElement(AdminChrome, {
        email,
        children: createElement('p', null, 'Some admin content that is long enough to wrap across several lines on a phone screen and to show the column.'),
      }),
    ),
  );

describe('the admin chrome', () => {
  const html = renderToStaticMarkup(createElement(AdminChrome, { email: 'ops@example.com', children: 'paper' }));
  it('is the bar, the routes, the address and the way out — no title', () => {
    expect(visibleText(html)).toBe('ops@example.com Sign out Access Review Coverage Topics Disputes ops@example.com Sign out paper');
    expect(html).toMatch(/aria-current="page"[^>]*>Review</);
    expect(html).not.toMatch(/<h1/);
  });
  it('draws the paper and the 960 column', () => {
    expect(html).toContain('class="ruled relative px-5 pb-8 pt-7 [container-type:inline-size] lg:px-6"');
    expect(html).toContain('class="relative mx-auto max-w-[var(--bar-width)]"');
  });
});

const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
const SHOT = process.env.ADMIN_SHOTS;
let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

describe.skipIf(!hasChrome)('the admin chrome fits', () => {
  for (const width of [390, 1280]) {
    it(`the viewport at ${width}px with a long email, ${width >= 1024 ? 'one row' : 'two rows'}`, async () => {
      const p = await browser.newPage({ viewport: { width, height: 700 } });
      await p.setContent(page(LONG), { waitUntil: 'networkidle' });
      const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
      const rows = await p.evaluate(() => {
        const lock = document.querySelector('header svg')!.getBoundingClientRect();
        const nav = document.querySelector('header nav')!.getBoundingClientRect();
        return nav.top >= lock.bottom - 1 ? 2 : 1;
      });
      // The address on one line whatever its length; the five routes on one line at 1280
      // (at 390 they wrap, on purpose, and stay visible).
      const navLines = await p.evaluate(() => Math.round(document.querySelector('header nav')!.getBoundingClientRect().height / 44));
      const emailLines = await p.evaluate(() => {
        const e = [...document.querySelectorAll('header span[title]')].find((s) => s.getBoundingClientRect().width > 0)!;
        return Math.round(e.getBoundingClientRect().height / 15);
      });
      if (SHOT) await p.screenshot({ path: `${SHOT}/admin-chrome-${width}.png` });
      await p.close();
      expect(w, `${width}px`).toBe(width);
      expect(rows).toBe(width >= 1024 ? 1 : 2);
      if (width >= 1024) expect(navLines).toBe(1);
      expect(emailLines).toBe(1);
    }, 60000);
  }
});
