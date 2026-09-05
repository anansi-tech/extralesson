import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser } from 'playwright-core';

// ROUND_8 Task 0: the chrome is two rows at 390, one at 1280, and the
// document is never wider than the viewport, with a long sitting label.
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8').replace(/@import[^;]+;/g, '').replace(/@theme inline \{[\s\S]*?\n\}/, '');

const bar = (sitting: string) => `
<header class="border-b-[1.5px] border-ink bg-white px-5 lg:px-6">
  <div class="mx-auto flex max-w-[var(--bar-width)] flex-wrap items-center gap-x-6 gap-y-0">
    <div class="flex min-w-0 flex-1 items-center justify-between gap-3 py-2 lg:flex-none lg:py-0">
      <svg width="130" height="22" style="flex:none"><rect width="130" height="22"/></svg>
      <div class="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-dim lg:hidden"><span class="text-right">${sitting}</span><a class="whitespace-nowrap">Help</a><form><button class="min-h-11 whitespace-nowrap">Sign out</button></form></div>
    </div>
    <div class="flex w-full min-w-0 items-center lg:w-auto lg:flex-1">
      <nav class="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em]"><a class="inline-flex min-h-11 items-center border-b-2 px-3">Notebook</a><a class="inline-flex min-h-11 items-center border-b-2 px-3">History</a><a class="inline-flex min-h-11 items-center border-b-2 px-3">Progress</a></nav>
    </div>
    <div class="hidden items-center gap-4 font-mono text-[10px] uppercase tracking-[0.1em] text-dim lg:flex"><span>${sitting}</span><a class="whitespace-nowrap">Help</a><form><button class="min-h-11 whitespace-nowrap">Sign out</button></form></div>
  </div>
</header>
<main class="ruled relative px-5 pb-8 pt-7 lg:px-6">
  <div class="pointer-events-none absolute inset-y-0 left-[var(--rule-offset-sm)] w-[1.5px] bg-margin lg:left-[calc(50%-var(--col)/2+var(--rule-offset-lg))]"></div>
  <div class="relative mx-auto max-w-[var(--col)]"><h1 class="text-2xl font-black">Kiara’s notebook.</h1><p>Some paper content that is long enough to wrap across several lines on a phone screen.</p></div>
</main>`;
const page = (body: string) => `<!doctype html><html><head><meta name="viewport" content="width=device-width"><script src="https://cdn.tailwindcss.com"></script><script>tailwind.config={theme:{extend:{colors:{ink:'#1e2430',paper:'#fbf7ee',margin:'#e4b8b4',dim:'#5b6373','red-pen':'#c1121f'}}}}</script><style>${css}</style></head><body>${body}</body></html>`;

let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

describe.skipIf(!hasChrome)('the chrome', () => {
  for (const width of [320, 360, 390, 1280]) {
    it(`fits the viewport at ${width}px, ${width >= 1024 ? 'one row' : 'two rows'}`, async () => {
      const p = await browser.newPage({ viewport: { width, height: 800 } });
      await p.setContent(page(bar('Jan 2027 re-sit')), { waitUntil: 'networkidle' });
      const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
      const rows = await p.evaluate(() => {
        const lock = document.querySelector('header svg')!.getBoundingClientRect();
        const nav = document.querySelector('header nav')!.getBoundingClientRect();
        return nav.top >= lock.bottom - 1 ? 2 : 1;
      });
      await p.close();
      expect(w, `${width}px`).toBe(width);
      expect(rows).toBe(width >= 1024 ? 1 : 2);
    }, 60000);
  }
});
