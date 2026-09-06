import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';
import { bodyPage, chromePage } from './helpers/chrome-page';
import { FAILURES } from './helpers/failure-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study' }));

// ROUND_9 Task 7: every failure fits the viewport at 320, 360, 390 and 1280 —
// the read failures in the chrome's column, the two pages on the door.
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

export const pageFor = (name: string, html: string) => (name.startsWith('read-') ? chromePage(`<div class="lg:max-w-[var(--col)]">${html}</div>`) : bodyPage(html));

describe.skipIf(!hasChrome)('the failures fit the viewport', () => {
  for (const width of [320, 360, 390, 1280]) {
    for (const [name, render] of Object.entries(FAILURES)) {
      it(`${name} at ${width}px`, async () => {
        const p = await browser.newPage({ viewport: { width, height: 900 } });
        await p.setContent(pageFor(name, render()), { waitUntil: 'networkidle' });
        const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        await p.close();
        expect(w, `${name} ${width}px`).toBe(width);
      }, 60000);
    }
  }
});
