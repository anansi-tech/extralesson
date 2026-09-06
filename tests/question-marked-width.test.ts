import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';
import { chromePage } from './helpers/chrome-page';
import { MARKED, renderMarked } from './helpers/marked-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study/session/s1' }));

// ROUND_8 Task 3: the marked question in its three states is never wider than
// the viewport at 320, 360, 390 and 1280; what we read and the codes sit
// below the marking on a phone and beside it at 1280.
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);

let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

export async function openMarked(b: Browser, name: keyof typeof MARKED, width: number) {
  const p = await b.newPage({ viewport: { width, height: 900 } });
  await p.setContent(chromePage(renderMarked(MARKED[name])), { waitUntil: 'networkidle' });
  return p;
}

describe.skipIf(!hasChrome)('the marked question fits the viewport', () => {
  for (const width of [320, 360, 390, 1280]) {
    for (const name of Object.keys(MARKED) as (keyof typeof MARKED)[]) {
      it(`${name} at ${width}px`, async () => {
        const p = await openMarked(browser, name, width);
        const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        const layout = await p.evaluate(() => {
          const marking = document.querySelector('#marking')!.getBoundingClientRect();
          const parts = document.querySelector('#slot-b\\.i')!.getBoundingClientRect();
          const read = [...document.querySelectorAll('.section-label')].find((el) => el.textContent === 'This is what we read')!.getBoundingClientRect();
          const solution = document.querySelector('#worked-solution')!.getBoundingClientRect();
          return {
            markingFirst: marking.bottom <= parts.top,
            read: read.left >= parts.right ? 'beside' : read.top >= parts.bottom && read.bottom <= solution.top ? 'between' : 'elsewhere',
          };
        });
        await p.close();
        expect(w, `${name} ${width}px`).toBe(width);
        expect(layout.markingFirst, `${name} ${width}px outcome line first`).toBe(true);
        expect(layout.read, `${name} ${width}px read`).toBe(width >= 1024 ? 'beside' : 'between');
      }, 60000);
    }
  }
});
