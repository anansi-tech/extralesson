import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium, type Browser } from 'playwright-core';
import { SiteFooter } from '@/app/site-footer';
import RefundsPage from '@/app/refunds/page';
import { bodyPage } from './helpers/chrome-page';
import { visibleText } from './helpers/card-states';
import { REFUND_DAYS } from '@/lib/access';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const footer = renderToStaticMarkup(createElement(SiteFooter));
const refunds = renderToStaticMarkup(createElement(RefundsPage));

// ROUND_9 Task 2: the foot of every page (Landing.dc.html §02), and the
// refunds page it links to, written short and true.
describe('the footer', () => {
  it('says the four links, who makes it and who does not', () => {
    expect(visibleText(footer)).toBe(
      'Help Refunds Privacy Terms An Anansi Technology product · Miami, Florida ExtraLesson is not affiliated with or endorsed by the Caribbean Examinations Council',
    );
    expect(footer).toMatch(/href="mailto:[^"]+@anansi\.xyz"[^>]*>Help/);
    for (const href of ['/refunds', '/privacy', '/terms']) expect(footer).toContain(`href="${href}"`);
    expect(footer).toContain('<svg');
  });
  it('is on every page: the root layout draws it after the page', () => {
    expect(at('app', 'layout.tsx')).toMatch(/\{children\}\s*<SiteFooter \/>/);
    expect(at('app', 'page.tsx')).not.toMatch(/<footer/);
  });
  it('links to a refunds page that reads the one refund window', () => {
    expect(visibleText(refunds)).toContain(`email us within ${REFUND_DAYS} days of paying and we will refund you — no questions, no forms.`);
    expect(at('app', 'refunds', 'page.tsx')).toContain('REFUND_DAYS');
    expect(at('app', 'refunds', 'page.tsx')).not.toMatch(/\b14 days\b|\$\d+/);
    expect(refunds).toContain('href="mailto:');
  });
});

const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

describe.skipIf(!hasChrome)('the footer and the refunds page fit the viewport', () => {
  for (const width of [320, 360, 390, 1440]) {
    for (const [name, html] of [['footer', footer], ['refunds', refunds]] as const) {
      it(`${name} at ${width}px`, async () => {
        const p = await browser.newPage({ viewport: { width, height: 900 } });
        await p.setContent(bodyPage(html), { waitUntil: 'networkidle' });
        const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
        await p.close();
        expect(w, `${name} ${width}px`).toBe(width);
      }, 60000);
    }
  }
});
