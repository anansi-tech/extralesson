import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// EVERY CHECKOUT LINK OPENS IN A NEW TAB, WITH rel="noopener".
//
// The rel is required rather than cosmetic: without it the Stripe tab can
// reach back into the page it was opened from through window.opener, which is
// not something to leave standing on a payment path. The target is what makes
// abandoning checkout a closed tab instead of a navigation away, so the page
// the student was reading is still there underneath.
//
// Asserted over the SOURCE, and over every file rather than the three links
// that exist today, because the failure mode is the fourth one added later
// without either attribute.

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return tsxFiles(full);
    return full.endsWith('.tsx') ? [full] : [];
  });
}

/** Every opening <a> tag in the file that points at the payment link. */
function checkoutAnchors(source: string): string[] {
  return (source.match(/<a\b[^>]*>/g) ?? []).filter((tag) => tag.includes('paymentLink()'));
}

const files = tsxFiles(join(process.cwd(), 'app')).map((path) => ({
  path: path.slice(process.cwd().length + 1),
  anchors: checkoutAnchors(readFileSync(path, 'utf8')),
}));
const withCheckout = files.filter((f) => f.anchors.length > 0);

describe('checkout links', () => {
  it('exist, so the assertions below are not passing over an empty list', () => {
    expect(withCheckout.length).toBeGreaterThan(0);
    expect(withCheckout.flatMap((f) => f.anchors).length).toBeGreaterThan(0);
  });

  it('open in a new tab, leaving the page the reader was on', () => {
    for (const { path, anchors } of withCheckout) {
      for (const tag of anchors) {
        expect(tag, `${path}: ${tag.replace(/\s+/g, ' ')}`).toMatch(/target="_blank"/);
      }
    }
  });

  it('carry rel="noopener", so the checkout tab cannot reach back', () => {
    for (const { path, anchors } of withCheckout) {
      for (const tag of anchors) {
        expect(tag, `${path}: ${tag.replace(/\s+/g, ' ')}`).toMatch(/rel="[^"]*noopener/);
      }
    }
  });
});
