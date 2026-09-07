import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';
import { GALLERY, WIDTHS, shotName, type Shot } from './helpers/gallery';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => '/study' }));

// EVERY SCREEN, EVERY STATE, ONE SET OF RULES. Each page of the gallery, at
// each width, is held to the same seven rules; a screen that needs an
// exception is a screen that is wrong.

/**
 * What each refusal refuses: no enabled action anywhere else on the page —
 * the lead or a secondary card — may offer it. A refusal of one topic leaves
 * the picker, which is how another topic is chosen.
 */
const REFUSES: Record<string, RegExp> = {
  paywall: /Start today|Mark one question|diagnostic|Carry on|Practise|Revisit/i,
  'sitting-passed': /Start today|Mark one question|diagnostic|Carry on|Practise|Revisit/i,
  'no-questions': /Start today|Mark one question|diagnostic|Carry on|Practise|Revisit/i,
  'no-questions-topic': /(?!)/,
  'no-topic': /(?!)/,
  'diagnostic-taken': /diagnostic/i,
  'first-taken': /Mark one question/,
  'nothing-to-revisit': /Revisit/,
  'no-retakes': /Take a photo|Take it again/,
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
  'read-failed': /./,
  'read-limited': /./,
  illegible: /./,
  'not-found': /./,
  broken: /./,
};

interface Report {
  width: number;
  /** A process is running on the page (a progress bar): nothing is primary while it does. */
  process: boolean;
  primaries: string[];
  labels: string[];
  refusals: { id: string; offered: string[]; mode: string | null }[];
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
  const enabled = actions.filter((el) => !(el as HTMLButtonElement).disabled);
  return {
    width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    process: !!document.querySelector('[role="progressbar"]'),
    primaries: primaries.map(label),
    labels: actions.map(label).filter(Boolean),
    refusals: [...document.querySelectorAll('[data-refusal]')].filter(visible).map((panel) => ({
      id: panel.getAttribute('data-refusal')!,
      offered: enabled.filter((a) => !panel.contains(a)).map(label),
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
        // 1. One primary action — none while a process runs on the page.
        expect(r.primaries, `${name}: primary actions`).toHaveLength(r.process ? 0 : 1);
        // 2. No refusal on a page whose lead or secondary cards offer the refused thing.
        for (const ref of r.refusals) {
          expect(REFUSES[ref.id], `${name}: refusal ${ref.id} is not in the table`).toBeDefined();
          expect(ref.offered.filter((l) => REFUSES[ref.id].test(l)), `${name}: ${ref.id} on a page offering it`).toEqual([]);
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
