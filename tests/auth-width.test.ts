import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';
import { bodyPage } from './helpers/chrome-page';
import { AUTH, renderAuth } from './helpers/auth-states';

// ROUND_9 Task 3: every auth state fits the viewport at 320, 360, 390 and 1280, and the card keeps to 576 at 1280.
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

export async function openAuth(b: Browser, name: string, width: number) {
  const p = await b.newPage({ viewport: { width, height: 900 } });
  await p.setContent(bodyPage(renderAuth(name)), { waitUntil: 'networkidle' });
  return p;
}

describe.skipIf(!hasChrome)('the auth screens fit the viewport', () => {
  for (const width of [320, 360, 390, 1280]) {
    for (const name of Object.keys(AUTH)) {
      it(`${name} at ${width}px`, async () => {
        const p = await openAuth(browser, name, width);
        const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        const card = await p.evaluate(() => Math.round(document.querySelector('main h1')!.closest('.max-w-\\[var\\(--col\\)\\]')!.getBoundingClientRect().width));
        await p.close();
        expect(w, `${name} ${width}px`).toBe(width);
        expect(card, `${name} ${width}px card`).toBe(width >= 1024 ? 576 : width - 40);
      }, 60000);
    }
  }
});
