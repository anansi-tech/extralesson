import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';
import { chromePage } from './helpers/chrome-page';
import { renderHistory, renderProgress } from './helpers/record-states';

// ROUND_8 Task 4: history and progress inside the chrome are never wider than
// the viewport at 320, 360, 390 and 1280; at 1280 they keep to the reading column.
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
export const PAGES = { history: renderHistory, progress: renderProgress } as const;

let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

describe.skipIf(!hasChrome)('history and progress fit the viewport', () => {
  for (const width of [320, 360, 390, 1280]) {
    for (const [name, render] of Object.entries(PAGES)) {
      it(`${name} at ${width}px`, async () => {
        const p = await browser.newPage({ viewport: { width, height: 900 } });
        await p.setContent(chromePage(render()), { waitUntil: 'networkidle' });
        const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        const column = await p.evaluate(() => Math.round(document.querySelector('main h1')!.parentElement!.getBoundingClientRect().width));
        await p.close();
        expect(w, `${name} ${width}px`).toBe(width);
        expect(column, `${name} ${width}px column`).toBe(width >= 1024 ? 576 : width - 40);
      }, 60000);
    }
  }
});
