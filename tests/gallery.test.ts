import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { checkRules, reportOn, type Report } from './helpers/gallery-rules';
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
  const r = await reportOn(p, width);
  await p.close();
  return r;
}

describe.skipIf(!hasChrome)('every screen, every state, one set of rules', () => {
  for (const shot of GALLERY) {
    for (const width of WIDTHS) {
      const name = shotName(shot, width);
      it(name, async () => {
        checkRules(await report(shot, width), name, { refuses: REFUSES, blocks: BLOCKS, primaries: 'exactly-one' }, expect);
      }, 60000);
    }
  }
});
