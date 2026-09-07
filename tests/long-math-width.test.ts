import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser } from 'playwright-core';
import { chromePage } from './helpers/chrome-page';
import { renderMathHtml } from '@/lib/katex';

// Long solutions wrap: the bank's hardest cases for a narrow page — the
// twenty longest worked solutions, the longest runs of inline math and every
// set of three or more items (tests/fixtures/long-math.json, from
// scripts/snapshot-long-math.ts) — rendered as the card renders them, never
// wider than the viewport at 320 and 390.
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
type Row = { id: string; why: string; stem: string; stimulus?: string; worked_solution: string; remediations: string[] };
const rows: Row[] = JSON.parse(readFileSync(join(process.cwd(), 'tests', 'fixtures', 'long-math.json'), 'utf8'));

const card = (q: Row) =>
  `<article class="border-[1.5px] border-ink bg-white p-5 shadow-[var(--shadow-card)] lg:max-w-[var(--col)]">
    ${q.stimulus ? `<div class="question-prose mb-2 border-l-3 border-paper-deep pl-3 text-[15px]">${renderMathHtml(q.stimulus)}</div>` : ''}
    <div class="question-prose text-lg">${renderMathHtml(q.stem)}</div>
    <div class="question-prose mt-5 text-[15px]">${renderMathHtml(q.worked_solution)}</div>
    ${q.remediations.map((r) => `<p class="question-prose mt-2 border-l-3 border-red-pen bg-red-tint px-3 py-2 text-[13px]">${renderMathHtml(r)}</p>`).join('')}
  </article>`;

let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

describe('the fixture', () => {
  it('holds the twenty longest solutions and the sets', () => {
    expect(rows.filter((r) => r.why === 'longest solution')).toHaveLength(20);
    expect(rows.filter((r) => r.why === 'set').length).toBeGreaterThan(0);
  });
});

describe.skipIf(!hasChrome)('long math never widens the page', () => {
  for (const width of [320, 390]) {
    it(`the ${rows.length} hardest questions at ${width}px`, async () => {
      const p = await browser.newPage({ viewport: { width, height: 900 } });
      const wide: string[] = [];
      let sets = 0;
      let scrolling = 0;
      for (const q of rows) {
        await p.setContent(chromePage(card(q)), { waitUntil: 'networkidle' });
        const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        if (w !== width) wide.push(`${q.id.slice(-6)} (${q.why}) ${w}px`);
        // A set of items is on more than one line at 320: it wrapped rather than scrolled.
        if (q.why === 'set' && width === 320) {
          sets += await p.evaluate(() => [...document.querySelectorAll('.math-items')].filter((el) => el.getBoundingClientRect().height > 40).length);
        }
        // What is too wide scrolls inside its own box — inline or display — and the page never does.
        scrolling += await p.evaluate(() => [...document.querySelectorAll('.math-scroll, .katex-display')].filter((el) => el.scrollWidth > el.clientWidth + 1).length);
      }
      await p.close();
      expect(wide, `${width}px`).toEqual([]);
      expect(scrolling, `${width}px boxes that scroll`).toBeGreaterThan(0);
      if (width === 320) expect(sets).toBeGreaterThan(0);
    }, 300000);
  }
});
