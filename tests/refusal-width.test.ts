import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';
import { chromePage } from './helpers/chrome-page';
import { REFUSALS } from './helpers/refusal-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study' }));

// ROUND_9 Task 4: every refusal panel fits the viewport at 320, 360, 390 and 1280 inside the chrome's column.
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

export const column = (inner: string) => `<div class="lg:max-w-[var(--col)]">${inner}</div>`;

describe.skipIf(!hasChrome)('the refusals fit the viewport', () => {
  for (const width of [320, 360, 390, 1280]) {
    for (const [name, render] of Object.entries(REFUSALS)) {
      it(`${name} at ${width}px`, async () => {
        const p = await browser.newPage({ viewport: { width, height: 900 } });
        await p.setContent(chromePage(column(render())), { waitUntil: 'networkidle' });
        const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        await p.close();
        expect(w, `${name} ${width}px`).toBe(width);
      }, 60000);
    }
  }
});
