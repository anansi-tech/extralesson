import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';
import { chromePage } from './helpers/chrome-page';
import { STATES, render } from './helpers/dashboard-states';

// ROUND_8 Task 1: the dashboard in its four states is never wider than the
// viewport at 320, 360, 390 and 1280, and the rail exists only at 1280.
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
const longest = { ...STATES.returning, firstName: 'Kiara-Anastasia', progress: { ...STATES.returning.progress, sessionsCompleted: 128, marksAssessed: 2480 } };

let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

describe.skipIf(!hasChrome)('the dashboard fits the viewport', () => {
  for (const width of [320, 360, 390, 1280]) {
    for (const [name, props] of [...Object.entries(STATES), ['longest', longest] as const]) {
      it(`${name} at ${width}px`, async () => {
        const p = await browser.newPage({ viewport: { width, height: 900 } });
        await p.setContent(chromePage(render(props)), { waitUntil: 'networkidle' });
        const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        const columns = await p.evaluate(() => {
          const primary = document.querySelector('main button, main a[href^="/study/session"]')!.getBoundingClientRect();
          const rail = document.querySelector('main [class*="lg:flex-col"]')?.firstElementChild?.getBoundingClientRect();
          return rail && rail.left >= primary.right ? 2 : 1;
        });
        await p.close();
        expect(w, `${name} ${width}px`).toBe(width);
        expect(columns, `${name} ${width}px columns`).toBe(width >= 1024 ? 2 : 1);
      }, 60000);
    }
  }
});
