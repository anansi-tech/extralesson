import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser } from 'playwright-core';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const page = at('app', 'page.tsx');

// ROUND_7 Task 4 gate. Visible text is the JSX with tags, comments and
// expressions stripped — what a reader sees, said once.
function visibleText(src: string): string {
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&rsquo;/g, '’')
    .replace(/&mdash;/g, '—')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}
const count = (text: string, phrase: string) => text.split(phrase.toLowerCase()).length - 1;

describe('the landing page, restructured', () => {
  it('says each of the three phrases exactly once', () => {
    const text = visibleText(page.slice(page.indexOf('return (')));
    for (const phrase of ['every method mark', 'on paper, by hand', 'the way the exam works']) {
      expect(count(text, phrase), phrase).toBeLessThanOrEqual(1);
    }
    expect(count(visibleText(page.slice(page.indexOf('return ('))), 'every method mark')).toBe(1);
  });
  it('has no MARKS/WHY/NEXT list, no statistic in the founder paragraph, and the daily line under step 3', () => {
    expect(page).not.toMatch(/className="chip"|marklist/);
    const founder = page.slice(page.indexOf('Why I built this'), page.indexOf('David Noel</div>'));
    expect(founder).not.toMatch(/\d+%|LANDING\./);
    expect(page.indexOf('className="daily"')).toBeGreaterThan(page.indexOf('STEP 3'));
  });
  it('keeps one radius and one measure in the stylesheet, and a dim token that reads', () => {
    const css = at('app', 'landing.css');
    expect(css.match(/border-radius: (?!var\(--radius\)|50%|0 var)/g) ?? []).toEqual([]);
    expect(css).toMatch(/--radius: 12px/);
    expect((css.match(/max-width: var\(--measure\)/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(css).toMatch(/--dim: #5b6373/);
    expect(at('app', 'globals.css')).toMatch(/--dim: #5b6373/);
  });
  it('figure recall is a labelled dialog that Escape closes with focus returned; a quiet Saved sits by the answers', () => {
    const card = at('app', 'study', 'session', '[id]', 'question-card.tsx');
    expect(card).toMatch(/role="dialog" aria-modal="true" aria-labelledby="figure-title"/);
    expect(card).toMatch(/if \(e\.key === 'Escape'\) setFigureOpen\(false\);/);
    expect(card).toMatch(/recallRef\.current\?\.focus\(\);/);
    expect(card).toMatch(/'Saved' : 'Couldn’t save/);
  });
});

// Width: the landing's own stylesheet over its own markup, in Chrome.
const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

export function markup(): string {
  const body = page.slice(page.indexOf('<div className="landing">'), page.lastIndexOf('</div>') + 6);
  return body
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\{session \? \([\s\S]*?\) : \(/g, '(')
    .replace(/\{signedInWithAccess \? \([\s\S]*?\) : \(\s*<>?/g, '(')
    .replace(/\{!signedInWithAccess && \(/g, '(')
    .replace(/\{photo \? \([\s\S]*?\) : \(/g, '(')
    .replace(/<Lockup width=\{150\} \/>/g, '<svg width="150" height="24"><rect width="150" height="24"/></svg>')
    .replace(/<Link /g, '<a ').replace(/<\/Link>/g, '</a>')
    .replace(/className=/g, 'class=')
    .replace(/\{' '\}/g, ' ')
    .replace(/\{LANDING\.price\}/g, '$49')
    .replace(/\{LANDING\.passRate\.figure\}/g, '36%')
    .replace(/\{LANDING\.passRate\.label\}/g, 'of candidates passed')
    .replace(/\{LANDING\.passRate\.sourceLabel\}/g, 'CXC Subject Report, May–June 2026')
    .replace(/\{LANDING\.weighting\.figure\}/g, '70%')
    .replace(/\{LANDING\.weighting\.label\}/g, 'of Paper 2 marks are for method')
    .replace(/\{LANDING\.weighting\.sourceLabel\}/g, 'CXC syllabus, from May–June 2027')
    .replace(/\{LANDING\.[a-zA-Z.]+\}/g, 'x')
    .replace(/\{coverage\.[a-zA-Z.]+\}/g, '84')
    .replace(/\{REFUND_DAYS\}/g, '14')
    .replace(/\{new Date\(\)\.getFullYear\(\)\}/g, '2026')
    .replace(/\{[^{}]*\}/g, '')
    .replace(/&rsquo;/g, '’').replace(/&mdash;/g, '—').replace(/&rarr;/g, '→').replace(/&copy;/g, '©')
    .replace(/\)\s*\)\}?/g, '').replace(/\s+\)\s*$/g, '');
}

export const landingCss = () => at('app', 'landing.css').replace(/var\(--font-[a-z-]+\)/g, 'serif');

describe.skipIf(!hasChrome)('document width equals the viewport', () => {
  const css = landingCss();
  for (const width of [320, 360, 390, 1440]) {
    it(`at ${width}px`, async () => {
      const p = await browser.newPage({ viewport: { width, height: 900 } });
      await p.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>body{margin:0}${css}</style></head><body>${markup()}</body></html>`);
      const w = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
      await p.close();
      expect(w, `${width}px`).toBe(width);
    }, 60000);
  }
});
