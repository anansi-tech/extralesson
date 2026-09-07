import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';
import { CaptureSurface } from '@/app/study/session/[id]/working-photo';
import { WorkingRead } from '@/app/study/session/[id]/working-read';
import type { CaptureState } from '@/app/study/session/[id]/capture-state';
import { chromePage } from './helpers/chrome-page';
import { visibleText } from './helpers/card-states';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study/session/s1' }));

// One surface for the photograph: every state renders exactly one capture
// surface, at most one "Take it again", the read section only in `read`,
// and no capture input once the takes are spent.
const STATES: CaptureState[] = ['none', 'reading', 'read', 'illegible', 'failed', 'exhausted'];
const read = createElement(WorkingRead, {
  lines: [{ text: 'tan 34 = 8 / BC', part_label: 'a', confidence: 0.9 }],
  method: [],
  earnedLabel: 'What your working earned',
});
const surface = (state: CaptureState, retakes = state === 'exhausted' ? 0 : 1) =>
  renderToStaticMarkup(
    createElement(CaptureSurface, {
      state,
      post: false,
      intro: 'Work it on paper, then photograph the page.',
      preview: state === 'reading' ? 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==' : null,
      error: state === 'failed' ? 'That photo is too large. Try again in better light.' : null,
      retakes,
      limit: 2,
      thumb: null,
      onPick: () => {},
      input: createElement('input', { type: 'file', className: 'hidden' }),
      read,
    }),
  );

describe('the capture surface', () => {
  for (const state of STATES) {
    it(`${state}: one surface, at most one retake`, () => {
      const html = surface(state);
      const text = visibleText(html);
      expect(html.match(/data-capture-state="/g)).toHaveLength(1);
      expect(html).toContain(`data-capture-state="${state}"`);
      expect((text.match(/Take it again/g) ?? []).length).toBeLessThanOrEqual(1);
      expect(text.includes('This is what we read')).toBe(state === 'read');
      expect(html.includes('type="file"')).toBe(state !== 'exhausted');
    });
  }
  it('read at the limit keeps the read and offers checking it; exhausted offers typing', () => {
    expect(visibleText(surface('read', 0))).toContain('No retakes left Two photographs of this page have been read already. The read we have is kept, and you can correct any line of it yourself before you hand in. Check what we read');
    expect(visibleText(surface('exhausted'))).toBe('No retakes left Two photographs of this page have been read already. Nothing has been marked and nothing has been counted. Your working on paper is still the working. Type the answers');
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

describe.skipIf(!hasChrome)('every capture state fits 390', () => {
  for (const state of STATES) {
    it(`${state} at 390px`, async () => {
      const p = await browser.newPage({ viewport: { width: 390, height: 900 } });
      await p.setContent(chromePage(`<div class="lg:max-w-[var(--col)]">${surface(state)}</div>`), { waitUntil: 'networkidle' });
      const r = await p.evaluate(() => ({
        w: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        surfaces: document.querySelectorAll('[data-capture-state]').length,
        retakes: [...document.querySelectorAll('button, a')].filter((el) => /Take it again/.test(el.textContent ?? '')).length,
      }));
      await p.close();
      expect(r.w).toBe(390);
      expect(r.surfaces).toBe(1);
      expect(r.retakes).toBeLessThanOrEqual(1);
    }, 60000);
  }
});
