import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FigureRecall } from '@/app/study/session/[id]/question-card';
import { chromium, type Browser } from 'playwright-core';
import { chromePage } from './helpers/chrome-page';
import { STATES, readingPieces, renderBar, renderCard } from './helpers/card-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study/session/s1' }));

// ROUND_8 Task 2: the card in its four states is never wider than the viewport
// at 320, 360, 390 and 1280; the figure sits above the parts on a phone and
// beside them at 1280. The reading state swaps in the two pieces that change
// while a page is read, as the live components render them.
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);

let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

export async function openState(b: Browser, name: keyof typeof STATES, width: number) {
  const q = STATES[name];
  const p = await b.newPage({ viewport: { width, height: 900 } });
  // The way back to the figure, as the card draws it while the figure is off-screen.
  await p.setContent(chromePage(renderBar(q) + renderCard(q) + renderToStaticMarkup(createElement(FigureRecall, { onClick: () => {} }))), { waitUntil: 'networkidle' });
  if (name === 'reading') {
    const pieces = readingPieces();
    await p.evaluate((pieces) => {
      document.getElementById('camera-box')!.outerHTML = pieces.camera;
      document.getElementById('hand-in')!.outerHTML = pieces.handIn;
    }, pieces);
  }
  return p;
}

describe.skipIf(!hasChrome)('the question card fits the viewport', () => {
  for (const width of [320, 360, 390, 1280]) {
    for (const name of Object.keys(STATES) as (keyof typeof STATES)[]) {
      it(`${name} at ${width}px`, async () => {
        const p = await openState(browser, name, width);
        const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        const beside = await p.evaluate(() => {
          const figure = document.querySelector('.figure-frame')!.getBoundingClientRect();
          const parts = document.querySelector('#slot-a\\.i')!.getBoundingClientRect();
          return figure.left >= parts.right ? 'beside' : figure.bottom <= parts.top ? 'above' : 'overlapping';
        });
        const bar = await p.evaluate(() => {
          const bar = document.querySelector('main > div > div')!.getBoundingClientRect();
          return { left: Math.round(bar.left), right: Math.round(bar.right) };
        });
        const fig = await p.evaluate(async () => {
          const el = document.querySelector('[aria-label="Show figure"]')!;
          const band = el.parentElement!;
          const before = el.getBoundingClientRect();
          window.scrollTo(0, document.body.scrollHeight);
          await new Promise((r) => requestAnimationFrame(r));
          const after = el.getBoundingClientRect();
          // At the foot of the page the card's last line sits above the band: the pill covers no text.
          const article = document.querySelector('article')!.getBoundingClientRect();
          return {
            text: el.textContent,
            inside: before.right <= window.innerWidth && before.right >= window.innerWidth - 40,
            aboveBottom: Math.round(before.bottom) <= window.innerHeight - 6,
            moved: before.top !== after.top || before.right !== after.right,
            clear: article.bottom <= band.getBoundingClientRect().top,
          };
        });
        await p.close();
        expect(w, `${name} ${width}px`).toBe(width);
        expect(beside, `${name} ${width}px figure`).toBe(width >= 1024 ? 'beside' : 'above');
        expect(bar, `${name} ${width}px bar`).toEqual({ left: 0, right: width });
        expect(fig, `${name} ${width}px figure pill`).toEqual({ text: 'Figure', inside: true, aboveBottom: true, moved: false, clear: true });
      }, 60000);
    }
  }
});
