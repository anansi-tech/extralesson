import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium, type Browser } from 'playwright-core';
import { chromePage } from './helpers/chrome-page';
import { STATES, renderBar, renderCard } from './helpers/card-states';
import { FigureRecall } from '@/app/study/session/[id]/question-card';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study/session/s1' }));

// Typing never moves the page: at 390, focus the last input, type, wait past
// the save debounce with the "Saved" line arriving beneath the hand-in as the
// save leaves it — scroll position and active element unchanged; then scroll
// to the bottom and hold — unchanged. The live path was reproduced in Chrome
// mobile emulation on a real session: one draft-save call, no refresh, no
// remount, no scroll event.
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

describe.skipIf(!hasChrome)('typing never moves the page', () => {
  it('holds scroll and focus through typing, the save, and a hold at the bottom at 390px', async () => {
    const q = STATES.unanswered;
    const p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await p.setContent(chromePage(renderBar(q) + renderCard(q) + renderToStaticMarkup(createElement(FigureRecall, { shown: false, onClick: () => {} }))), { waitUntil: 'networkidle' });
    const inputs = p.locator('input[type="text"], input:not([type])');
    const last = inputs.last();
    await last.scrollIntoViewIfNeeded();
    await last.focus();
    const snap = () => p.evaluate(() => ({ y: Math.round(window.scrollY), active: document.activeElement?.id ?? '' }));
    const before = await snap();
    expect(before.active).toMatch(/^slot-/);
    await p.keyboard.type('12', { delay: 40 });
    expect(await snap()).toEqual(before);
    // Past the 800ms debounce, with the one thing a save changes on the page.
    await p.waitForTimeout(1000);
    await p.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /Hand in/.test(b.textContent ?? ''))!;
      const saved = document.createElement('p');
      saved.textContent = 'Saved';
      saved.className = 'mt-1.5 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-dim';
      btn.insertAdjacentElement('afterend', saved);
    });
    await p.waitForTimeout(200);
    expect(await snap()).toEqual(before);
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(200);
    const bottom = await snap();
    await p.waitForTimeout(1500);
    expect(await snap()).toEqual(bottom);
    await p.close();
  }, 60000);
});
