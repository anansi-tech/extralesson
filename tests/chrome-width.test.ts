import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudyChrome } from '@/app/study/study-chrome';
import { existsSync } from 'node:fs';
import { bodyPage } from './helpers/chrome-page';
import { chromium, type Browser } from 'playwright-core';

// ROUND_8 Task 0: the chrome is two rows at 390, one at 1280, and the
// document is never wider than the viewport, with a long sitting label.
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
vi.mock('next/navigation', () => ({ usePathname: () => '/study' }));

// Render the real shell: a hand-copied helper previously gave main a
// minimum height that production did not have, concealing the blank paper.
const page = (sitting: string, open = false, isAdmin = false) => {
  const props = {
    sitting, current: 'jan-2027', email: 'kiara.a.longer.address@example.com', isAdmin,
    children: createElement('p', null, 'Some paper content that wraps on a phone screen.'),
  };
  const html = renderToStaticMarkup(createElement(StudyChrome, props));
  return bodyPage((open ? html.replaceAll('<details>', '<details open>') : html) + '<footer>Footer</footer>');
};
const SHOT = process.env.CHROME_SHOTS;

let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

describe.skipIf(!hasChrome)('the chrome', () => {
  for (const width of [320, 390, 1024, 1280]) {
    it(`admin navigation fits and short paper reaches the footer at ${width}px`, async () => {
      const p = await browser.newPage({ viewport: { width, height: 900 } });
      await p.setContent(page('January 2027', false, true), { waitUntil: 'networkidle' });
      expect(await p.locator('a[href="/admin/access"]').isVisible()).toBe(true);
      const layout = await p.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        paper: document.querySelector('main')!.getBoundingClientRect().bottom,
        footer: document.querySelector('footer')!.getBoundingClientRect().top,
      }));
      expect(layout.width).toBe(width);
      expect(layout.paper).toBeGreaterThanOrEqual(900);
      expect(layout.paper).toBeCloseTo(layout.footer, 0);
      const content = await p.locator('main').innerHTML();
      const arrow = p.locator('summary:visible .account-chevron');
      expect(await arrow.evaluate((el) => getComputedStyle(el).transform)).toBe('none');
      await p.locator('summary:visible').click();
      expect(await arrow.evaluate((el) => getComputedStyle(el).transform)).toBe('matrix(-1, 0, 0, -1, 0, 0)');
      expect(await p.getByText('kiara.a.longer.address@example.com', { exact: true }).filter({ visible: true }).count()).toBe(1);
      expect(await p.getByRole('button', { name: 'Sign out' }).isVisible()).toBe(true);
      expect(await p.getByText('Your account', { exact: true }).filter({ visible: true }).count()).toBe(1);
      // The arrow is part of the same toggle, not a navigation link. Opening
      // and closing the menu must not replace any notebook/progress content.
      await arrow.click();
      expect(await arrow.evaluate((el) => getComputedStyle(el).transform)).toBe('none');
      expect(await p.getByRole('button', { name: 'Sign out' }).count()).toBe(0);
      expect(await p.locator('main').innerHTML()).toBe(content);
      await p.close();
    }, 60000);
  }
  for (const width of [320, 360, 390, 1280]) {
    it(`fits the viewport at ${width}px, ${width >= 1024 ? 'one row' : 'two rows'}`, async () => {
      const p = await browser.newPage({ viewport: { width, height: 800 } });
      await p.setContent(page('January 2027'), { waitUntil: 'networkidle' });
      const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
      const rows = await p.evaluate(() => {
        const lock = document.querySelector('header svg')!.getBoundingClientRect();
        const nav = document.querySelector('header nav')!.getBoundingClientRect();
        return nav.top >= lock.bottom - 1 ? 2 : 1;
      });
      await p.close();
      expect(w, `${width}px`).toBe(width);
      expect(rows).toBe(width >= 1024 ? 1 : 2);
    }, 60000);
  }

  // ROUND_9 Task 9: the sitting opens to the account disclosure, and the
  // open panel sits inside the viewport at every width.
  for (const width of [320, 360, 390, 1280]) {
    it(`keeps the open account disclosure inside the viewport at ${width}px`, async () => {
      const p = await browser.newPage({ viewport: { width, height: 800 } });
      await p.setContent(page('January 2027', true), { waitUntil: 'networkidle' });
      const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
      const panel = await p.evaluate(() => {
        const open = [...document.querySelectorAll('details[open]')].find((d) => d.getBoundingClientRect().width > 0)!;
        const r = open.querySelector('div')!.getBoundingClientRect();
        return { left: r.left, right: r.right, width: r.width };
      });
      if (SHOT) await p.screenshot({ path: `${SHOT}/chrome-account-${width}.png`, fullPage: true });
      await p.close();
      expect(w, `${width}px`).toBe(width);
      expect(panel.left).toBeGreaterThanOrEqual(0);
      expect(panel.right).toBeLessThanOrEqual(width);
      expect(panel.width).toBeGreaterThan(200);
    }, 60000);
  }
});
