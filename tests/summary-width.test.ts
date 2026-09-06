import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';
import { chromePage } from './helpers/chrome-page';
import { SUMMARIES } from './helpers/summary-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study' }));

// ROUND_9 Task 6: every summary fits the viewport at 320, 360, 390 and 1280.
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

export async function openSummary(b: Browser, name: string, width: number) {
  const p = await b.newPage({ viewport: { width, height: 900 } });
  await p.setContent(chromePage(SUMMARIES[name]()), { waitUntil: 'networkidle' });
  return p;
}

describe.skipIf(!hasChrome)('the summaries fit the viewport', () => {
  for (const width of [320, 360, 390, 1280]) {
    for (const name of Object.keys(SUMMARIES)) {
      it(`${name} at ${width}px`, async () => {
        const p = await openSummary(browser, name, width);
        const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        await p.close();
        expect(w, `${name} ${width}px`).toBe(width);
      }, 60000);
    }
  }
});
