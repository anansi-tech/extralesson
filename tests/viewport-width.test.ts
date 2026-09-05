import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser } from 'playwright-core';

// ROUND_7 Task 2: at 320, 360 and 390 the document is never wider than the
// viewport, with a long email in the nav and long identifiers on the admin
// page. Measured in Chrome with the site's own stylesheet.
const CHROME = '/usr/bin/google-chrome';
const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8').replace(/@import[^;]+;/g, '');
const EMAIL = 'a.very.long.student.email.address.for.testing@some-long-school-domain.example.gd';

const nav = `
<header class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
  <div class="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1 max-[399px]:w-full max-[399px]:flex-col max-[399px]:items-start">
    <svg width="140" height="24" style="flex-shrink:0"><rect width="140" height="24"/></svg>
    <nav class="flex items-baseline gap-x-3 font-mono text-[11px] uppercase tracking-widest"><a>Notebook</a><a>History</a><a>Progress</a></nav>
  </div>
  <div class="flex min-w-0 flex-1 flex-wrap items-baseline justify-end gap-x-3 gap-y-1">
    <span class="hidden shrink-0 whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-dim sm:inline">CSEC MATH · MAY/JUNE 2027</span>
    <span class="hidden min-w-0 max-w-full truncate font-mono text-[10px] tracking-widest text-dim sm:inline">${EMAIL}</span>
    <form class="shrink-0"><button class="whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-dim underline">Sign out</button></form>
  </div>
</header>`;
const admin = `
<section class="mb-6 border-[1.5px] border-red-pen p-3">
  <ul><li class="flex flex-wrap items-baseline justify-between gap-2 border-t border-dashed pt-2">
    <span class="min-w-0 break-all font-mono text-[12px]">${EMAIL}<span class="ml-2 text-dim">25.00 USD · 2026-09-05 · evt_1Rx9Yz2eZvKYlo2CabcdefghijklmnopQRSTUV</span></span>
  </li></ul>
  <ul><li class="break-all border-t border-dashed pt-1 font-mono text-[12px]">2026-09-05 15:33 · link-not-ours <span class="ml-2 text-dim">plink_1Rx9Yz2eZvKYlo2Cabcdefghij · cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0</span></li></ul>
</section>`;
const page = (body: string) => `<!doctype html><html><head><meta name="viewport" content="width=device-width"><script src="https://cdn.tailwindcss.com"></script><style>${css}</style></head><body><main class="px-5 py-8"><div class="mx-auto max-w-xl">${body}</div></main></body></html>`;

let browser: Browser;
const hasChrome = existsSync(CHROME);
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

describe.skipIf(!hasChrome)('document width equals the viewport', () => {
  for (const width of [320, 360, 390]) {
    it(`nav and admin card at ${width}px with a long email`, async () => {
      const p = await browser.newPage({ viewport: { width, height: 800 } });
      await p.setContent(page(nav + admin), { waitUntil: 'networkidle' });
      const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
      await p.close();
      expect(w, `${width}px`).toBe(width);
    }, 60000);
  }
});
