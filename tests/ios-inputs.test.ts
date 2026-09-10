import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium, type Browser } from 'playwright-core';
import { bodyPage, chromePage } from './helpers/chrome-page';
import { STATES as DASH } from './helpers/dashboard-states';
import { STATES as CARD, renderBar, renderCard } from './helpers/card-states';
import { DashboardView } from '@/app/study/dashboard';
import { StudyChrome } from '@/app/study/study-chrome';
import LoginForm from '@/app/(door)/study/login/login-form';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study' }));

// iOS: a focused field set under 16px zooms the page. Under 640px every
// student field is at least the input size — asserted from the compiled
// stylesheet, and measured on the fields themselves at 390.
const require = createRequire(import.meta.url);

async function compiledCss(): Promise<string> {
  // postcss is the plugin's dependency, not the project's: reach it through the plugin.
  const plugin = require.resolve('@tailwindcss/postcss');
  const postcss = require(require.resolve('postcss', { paths: [plugin] }));
  const tailwind = require(plugin);
  const from = join(process.cwd(), 'app', 'globals.css');
  const out = await postcss([tailwind()]).process(readFileSync(from, 'utf8'), { from });
  return out.css;
}

describe('the compiled stylesheet', () => {
  it('lifts every field to the input size under 640px', async () => {
    const css = await compiledCss();
    expect(css).toMatch(/--text-input:\s*16px/);
    const block = /@media \(max-width:\s*639px\)\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    expect(block).toMatch(/input:not\(\[type=['"]?checkbox['"]?\]\)[^{]*select:not\(\[hidden\]\)[^{]*textarea:not\(\[hidden\]\)[^{]*\{[^}]*font-size:\s*max\(var\(--text-input\),\s*1em\)/);
  }, 60000);
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

const pages: Record<string, () => string> = {
  'create account': () => bodyPage(renderToStaticMarkup(createElement(LoginForm, { door: 'create' }))),
  'the chrome, disclosure open': () =>
    bodyPage(renderToStaticMarkup(createElement(StudyChrome, { sitting: 'May/June 2027', current: 'may-june-2027', email: 'kiara@example.com', children: 'paper' })).replace(/<details>/g, '<details open>')),
  'the dashboard': () => chromePage(renderToStaticMarkup(createElement(DashboardView, DASH.returning))),
  'the question card': () => chromePage(renderBar(CARD.unanswered) + renderCard(CARD.unanswered)),
};

describe.skipIf(!hasChrome)('every student field is 16px or more at 390', () => {
  for (const [name, html] of Object.entries(pages)) {
    it(name, async () => {
      const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await p.setContent(html(), { waitUntil: 'networkidle' });
      const fields = await p.evaluate(() =>
        [...document.querySelectorAll('input, select, textarea')]
          .filter((el) => !['hidden', 'file', 'checkbox', 'radio'].includes((el as HTMLInputElement).type))
          .map((el) => ({ id: el.id || (el as HTMLInputElement).name || el.tagName, size: parseFloat(getComputedStyle(el).fontSize) })),
      );
      await p.close();
      expect(fields.length, name).toBeGreaterThan(0);
      for (const f of fields) expect(f.size, `${name}: ${f.id}`).toBeGreaterThanOrEqual(16);
    }, 60000);
  }
});
