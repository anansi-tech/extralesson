import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { chromePage } from './helpers/chrome-page';
import { chromium, type Browser } from 'playwright-core';

// ROUND_8 Task 0: the chrome is two rows at 390, one at 1280, and the
// document is never wider than the viewport, with a long sitting label.
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
const page = (sitting: string) => chromePage('<h1 class="text-2xl font-black">Kiara’s notebook.</h1><p>Some paper content that is long enough to wrap across several lines on a phone screen.</p>', sitting);

let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

describe.skipIf(!hasChrome)('the chrome', () => {
  for (const width of [320, 360, 390, 1280]) {
    it(`fits the viewport at ${width}px, ${width >= 1024 ? 'one row' : 'two rows'}`, async () => {
      const p = await browser.newPage({ viewport: { width, height: 800 } });
      await p.setContent(page('Jan 2027 re-sit'), { waitUntil: 'networkidle' });
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
});
