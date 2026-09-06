import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';
import { bodyPage } from './helpers/chrome-page';
import { WELCOME, renderWelcome } from './helpers/welcome-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {} }), usePathname: () => '/welcome' }));

// ROUND_9 Task 1: the welcome card in every state is never wider than the
// viewport at 320, 360, 390 and 1280, and keeps to 576px at 1280.
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);

let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

export async function openWelcome(b: Browser, name: keyof typeof WELCOME, width: number) {
  const p = await b.newPage({ viewport: { width, height: 900 } });
  await p.setContent(bodyPage(renderWelcome(WELCOME[name])), { waitUntil: 'networkidle' });
  return p;
}

describe.skipIf(!hasChrome)('welcome fits the viewport', () => {
  for (const width of [320, 360, 390, 1280]) {
    for (const name of Object.keys(WELCOME) as (keyof typeof WELCOME)[]) {
      it(`${name} at ${width}px`, async () => {
        const p = await openWelcome(browser, name, width);
        const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        const card = await p.evaluate(() => Math.round(document.querySelector('main h1')!.parentElement!.getBoundingClientRect().width));
        await p.close();
        expect(w, `${name} ${width}px`).toBe(width);
        expect(card, `${name} ${width}px card`).toBe(width >= 1024 ? 576 : width - 40);
      }, 60000);
    }
  }
});
