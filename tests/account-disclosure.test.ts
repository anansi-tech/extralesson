import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium, type Browser } from 'playwright-core';
import { StudyChrome } from '@/app/study/study-chrome';
import { attachAccountDismissal } from '@/app/study/account-disclosure';
import { bodyPage } from './helpers/chrome-page';

vi.mock('next/navigation', () => ({ usePathname: () => '/study' }));

const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => { await browser?.close(); });

describe.skipIf(!hasChrome)('Account dismissal', () => {
  for (const width of [390, 1280]) {
    it(`dismisses outside and on Escape without interfering inside at ${width}px`, async () => {
      const p = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width < 1024 });
      const props = {
        sitting: 'January 2027', current: 'jan-2027', email: 'operator@example.com', isAdmin: true,
        children: createElement('button', { id: 'outside', type: 'button', style: { marginTop: 480 } }, 'Outside action'),
      };
      await p.setContent(bodyPage(renderToStaticMarkup(createElement(StudyChrome, props))), { waitUntil: 'networkidle' });
      // Run the production listener implementation, not a hand-copied event
      // handler. The component's effect installs this same function on mount.
      const cleanup = await p.evaluateHandle(`(() => {
        const detach = [...document.querySelectorAll('details')].map(${attachAccountDismissal.toString()});
        return () => detach.forEach(fn => fn());
      })()`);
      const summary = p.locator('summary:visible');
      const disclosure = p.locator('details:visible');
      const isOpen = () => disclosure.evaluate((el) => (el as HTMLDetailsElement).open);
      const activate = async (selector: string) => {
        if (width < 1024) await p.locator(selector).tap();
        else await p.locator(selector).click();
      };

      await activate('summary:visible');
      expect(await isOpen()).toBe(true);
      await p.getByText('Your account', { exact: true }).filter({ visible: true }).click();
      expect(await isOpen()).toBe(true);
      const select = p.locator('select:visible');
      await select.selectOption('may-june-2027');
      expect(await select.inputValue()).toBe('may-june-2027');
      expect(await isOpen()).toBe(true);

      // The form must still receive its submit event; no click or submit is
      // cancelled by dismissal. Only this test prevents network submission.
      await p.evaluate(() => {
        document.addEventListener('submit', (event) => {
          event.preventDefault();
          document.body.dataset.submits = String(Number(document.body.dataset.submits ?? 0) + 1);
        });
        document.getElementById('outside')!.addEventListener('click', () => {
          document.body.dataset.outsideClicked = 'yes';
        });
      });
      await p.getByRole('button', { name: 'Change sitting', exact: true }).click();
      expect(await p.locator('body').getAttribute('data-submits')).toBe('1');
      expect(await isOpen()).toBe(true);
      await p.getByRole('button', { name: 'Sign out', exact: true }).click();
      expect(await p.locator('body').getAttribute('data-submits')).toBe('2');
      expect(await isOpen()).toBe(true);

      await activate('#outside');
      expect(await isOpen()).toBe(false);
      expect(await p.locator('body').getAttribute('data-outside-clicked')).toBe('yes');
      expect(await p.locator('#outside').evaluate((el) => document.activeElement === el)).toBe(true);

      await activate('summary:visible');
      expect(await select.inputValue()).toBe('may-june-2027');
      await select.focus();
      await p.keyboard.press('Escape');
      expect(await isOpen()).toBe(false);
      expect(await summary.evaluate((el) => document.activeElement === el)).toBe(true);

      // Unmount cleanup removes document handlers; no stale listeners linger.
      await cleanup.evaluate((detach) => (detach as () => void)());
      await summary.click();
      await activate('#outside');
      expect(await isOpen()).toBe(true);
      await cleanup.dispose();
      await p.close();
    }, 60000);
  }
});
