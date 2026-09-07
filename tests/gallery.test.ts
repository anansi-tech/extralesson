import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';
import { GALLERY, WIDTHS, shotName, type Shot } from './helpers/gallery';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study' }));

// EVERY SCREEN, EVERY STATE, ONE SET OF RULES. Each page of the gallery, at
// each width, is held to the same seven rules; a screen that needs an
// exception is a screen that is wrong.

/** What each refusal refuses: a lead offering it must not stand above the refusal. */
const REFUSES: Record<string, RegExp> = {
  paywall: /Start today|Mark one question|Start with a quick diagnostic|Carry on/,
  'sitting-passed': /Start today|Mark one question|Start with a quick diagnostic|Carry on/,
  'no-questions': /Start today|Mark one question|Start with a quick diagnostic|Carry on/,
  'no-questions-topic': /Practise/,
  'no-topic': /Practise/,
  'diagnostic-taken': /diagnostic/i,
  'first-taken': /Mark one question/,
  'nothing-to-revisit': /Revisit/,
  'no-retakes': /Take a photo|Take it again/,
  'handed-in': /Hand in/,
  'read-failed': /Take a photo/,
  'read-limited': /Take a photo/,
  illegible: /Take a photo/,
  'not-found': /(?!)/,
  broken: /(?!)/,
};

/** Where each refusal's own action must not go: a session mode the refusal itself blocks. */
const BLOCKS: Record<string, RegExp> = {
  paywall: /^(adaptive|topic|revisit|first)$/,
  'sitting-passed': /^(adaptive|topic|revisit|first)$/,
  'no-questions': /./,
  'no-questions-topic': /^topic$/,
  'no-topic': /^topic$/,
  'diagnostic-taken': /^diagnostic$/,
  'first-taken': /^first$/,
  'nothing-to-revisit': /^revisit$/,
  'no-retakes': /./,
  'handed-in': /./,
  'read-failed': /./,
  'read-limited': /./,
  illegible: /./,
  'not-found': /./,
  broken: /./,
};

interface Report {
  width: number;
  primaries: string[];
  labels: string[];
  refusals: { id: string; above: string[]; mode: string | null }[];
  text: string;
}

const inspect = (): Report => {
  const visible = (el: Element) => el.getClientRects().length > 0;
  const label = (el: Element) => {
    const clone = el.cloneNode(true) as Element;
    clone.querySelectorAll('small').forEach((s) => s.remove());
    return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
  };
  const actions = [...document.querySelectorAll('a[href], button')].filter(visible);
  const primaries = actions.filter((el) => /\bbg-red-pen\b/.test(el.className));
  return {
    width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    primaries: primaries.map(label),
    labels: actions.map(label).filter(Boolean),
    refusals: [...document.querySelectorAll('[data-refusal]')].filter(visible).map((panel) => ({
      id: panel.getAttribute('data-refusal')!,
      above: primaries.filter((p) => !panel.contains(p) && p.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).map(label),
      mode: panel.querySelector<HTMLInputElement>('input[name="mode"]')?.value ?? null,
    })),
    text: document.body.innerText.replace(/\s+/g, ' '),
  };
};

const CHROME = '/usr/bin/google-chrome';
const hasChrome = existsSync(CHROME);
let browser: Browser;
beforeAll(async () => {
  if (hasChrome) browser = await chromium.launch({ executablePath: CHROME });
}, 60000);
afterAll(async () => {
  await browser?.close();
});

async function report(shot: Shot, width: number): Promise<Report> {
  const p = await browser.newPage({ viewport: { width, height: 900 } });
  await p.setContent(shot.page, { waitUntil: 'networkidle' });
  if (shot.surface) await p.evaluate((html) => { document.getElementById('camera-box')!.outerHTML = html; }, shot.surface);
  const r = await p.evaluate(inspect);
  await p.close();
  return r;
}

describe.skipIf(!hasChrome)('every screen, every state, one set of rules', () => {
  for (const shot of GALLERY) {
    for (const width of WIDTHS) {
      const name = shotName(shot, width);
      it(name, async () => {
        const r = await report(shot, width);
        // 1. One primary action.
        expect(r.primaries, `${name}: primary actions`).toHaveLength(1);
        // 2. No refusal beneath a lead that offers the refused thing.
        for (const ref of r.refusals) {
          expect(REFUSES[ref.id], `${name}: refusal ${ref.id} is not in the table`).toBeDefined();
          expect(ref.above.filter((l) => REFUSES[ref.id].test(l)), `${name}: ${ref.id} beneath a lead offering it`).toEqual([]);
          // 7. The refusal's action leads somewhere the refusal does not block.
          if (ref.mode) expect(ref.mode, `${name}: ${ref.id} offers what it refuses`).not.toMatch(BLOCKS[ref.id]);
        }
        // 3. No two panels of the same pattern.
        expect(r.refusals.length, `${name}: refusal panels`).toBeLessThanOrEqual(1);
        // 4. No duplicated button label.
        const dupes = r.labels.filter((l, i) => r.labels.indexOf(l) !== i);
        expect(dupes, `${name}: duplicated labels`).toEqual([]);
        // 5. The document is as wide as the viewport.
        expect(r.width, `${name}: width`).toBe(width);
        // 6. No slot ids, model prose, or "query" in visible text.
        expect(r.text, `${name}: slot id`).not.toMatch(/\b[a-d]\.(i|ii|iii)\b/);
        expect(r.text, `${name}: reader prose`).not.toMatch(/blurred|pencil/);
        expect(r.text, `${name}: query`).not.toMatch(/\bquer(y|ied|ies)\b/i);
      }, 60000);
    }
  }
});
