import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
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

/** The band, in the browser, as the card draws it while the figure is off-screen. */
const showPill = () => {
  const band = document.querySelector('article > div.sticky') as HTMLElement;
  band.classList.remove('pointer-events-none');
  band.classList.add('border-t', 'border-paper-deep', 'bg-paper');
  band.innerHTML = '<button type="button" aria-label="Show figure" class="min-h-11 rounded-full border-[1.5px] border-ink bg-white px-4 font-mono text-[11px] uppercase tracking-[0.1em] shadow-[var(--shadow-key)]">Figure</button>';
};

export async function openState(b: Browser, name: keyof typeof STATES, width: number) {
  const q = STATES[name];
  const p = await b.newPage({ viewport: { width, height: 900 } });
  await p.setContent(chromePage(renderBar(q) + renderCard(q)), { waitUntil: 'networkidle' });
  // The way back to the figure, as the card shows it while the figure is off-screen.
  await p.evaluate(showPill);
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
          const article = document.querySelector('article')!;
          window.scrollTo(0, 0);
          await new Promise((r) => requestAnimationFrame(r));
          const stuck = band.getBoundingClientRect();
          const pill = el.getBoundingClientRect();
          const card = article.getBoundingClientRect();
          // Stuck to the viewport's foot only while its own row is below the fold;
          // otherwise at rest on the row above it.
          const rowAbove = band.previousElementSibling!.getBoundingClientRect().bottom;
          const stuckToFoot = rowAbove + stuck.height > window.innerHeight ? Math.abs(stuck.bottom - window.innerHeight) <= 1 : Math.abs(stuck.top - rowAbove) <= 1;
          window.scrollTo(0, document.body.scrollHeight);
          await new Promise((r) => requestAnimationFrame(r));
          const rest = band.getBoundingClientRect();
          const above = band.previousElementSibling!.getBoundingClientRect();
          const below = band.nextElementSibling?.getBoundingClientRect();
          // While the card runs past the viewport the band is stuck to its foot; at the
          // end of the page it rests in its own row of the card, over nothing.
          return {
            text: el.textContent,
            position: getComputedStyle(band).position,
            inside: pill.right <= window.innerWidth && pill.right >= card.right - 40,
            stuckToFoot,
            restsInCard: rest.top >= above.bottom - 1 && (!below || rest.bottom <= below.top + 1) && rest.bottom <= article.getBoundingClientRect().bottom,
          };
        });
        await p.close();
        expect(w, `${name} ${width}px`).toBe(width);
        expect(beside, `${name} ${width}px figure`).toBe(width >= 1024 ? 'beside' : 'above');
        expect(bar, `${name} ${width}px bar`).toEqual({ left: 0, right: width });
        expect(fig, `${name} ${width}px figure pill`).toEqual({ text: 'Figure', position: 'sticky', inside: true, stuckToFoot: true, restsInCard: true });
      }, 60000);
    }
  }

  // The band's space is reserved at all times: showing or hiding the pill
  // never changes the page's height under a reader who has scrolled.
  it('keeps the document height constant across the pill showing and hiding, 400px down at 390px', async () => {
    const q = STATES.unanswered;
    const heights: Record<string, { height: number; visible: boolean }> = {};
    for (const shown of [true, false]) {
      const p = await browser.newPage({ viewport: { width: 390, height: 900 } });
      await p.setContent(chromePage(renderBar(q) + renderCard(q)), { waitUntil: 'networkidle' });
      if (shown) await p.evaluate(showPill);
      heights[String(shown)] = await p.evaluate(async () => {
        window.scrollTo(0, 400);
        await new Promise((r) => requestAnimationFrame(r));
        const el = document.querySelector('[aria-label="Show figure"]');
        return { height: document.documentElement.scrollHeight, visible: !!el && getComputedStyle(el).visibility === 'visible' };
      });
      await p.close();
    }
    expect(heights.true.height).toBe(heights.false.height);
    expect(heights.true.visible).toBe(true);
    expect(heights.false.visible).toBe(false);
  }, 60000);

  // While any field in the card has focus the band is out of the way: never
  // over the box being typed in, never above the keyboard.
  it('hides the pill while a field has focus, at 390px', async () => {
    const q = STATES.unanswered;
    const p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await p.setContent(chromePage(renderBar(q) + renderCard(q)), { waitUntil: 'networkidle' });
    await p.evaluate(showPill);
    const before = await p.evaluate(() => getComputedStyle(document.querySelector('[aria-label="Show figure"]')!.parentElement!).visibility);
    await p.locator('input[type="text"], input:not([type])').last().focus();
    const during = await p.evaluate(() => getComputedStyle(document.querySelector('[aria-label="Show figure"]')!.parentElement!).visibility);
    await p.close();
    expect(before).toBe('visible');
    expect(during).toBe('hidden');
  }, 60000);
});
