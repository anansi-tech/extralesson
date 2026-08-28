import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const at = (...p: string[]) => join(process.cwd(), ...p);
const read = (...p: string[]) => readFileSync(at(...p), 'utf8');

// THE MARK IS DRAWN IN TWO PLACES, AND THEY MUST NOT DRIFT.
//
// opengraph-image.tsx inlines the path because a serverless bundle traces
// imports rather than stray file reads, so reading public/ at runtime is the
// kind of thing that works in dev and returns nothing in production. The copy
// is fine; a copy nobody checks is not.
describe('the mark', () => {
  it('is the same path in the OG image as in the source drawing', () => {
    const source = read('public', 'brand', 'mark.svg').match(/ d="([^"]+)"/)?.[1];
    const og = read('app', 'opengraph-image.tsx').match(/MARK_PATH = '([^']+)'/)?.[1];
    expect(source, 'public/brand/mark.svg has no path').toBeTruthy();
    expect(og, 'opengraph-image.tsx has no MARK_PATH').toBeTruthy();
    expect(og).toBe(source);
  });

  it('is drawn in the red the tokens name', () => {
    expect(read('public', 'brand', 'mark.svg').toLowerCase()).toContain('#c1121f');
    expect(read('app', 'opengraph-image.tsx').toUpperCase()).toContain('#C1121F');
  });

  it('appears in the OG image, which used to be wordmark only', () => {
    expect(read('app', 'opengraph-image.tsx')).toMatch(/<img[^>]+src=\{mark\(/);
  });
});

// THE FAVICON AND THE AVATAR ARE DIFFERENT DRAWINGS FROM THE MARK.
//
// A stroked radical with nothing behind it disappears at 16px against a white
// tab strip. Both carry a filled container with the radical knocked out of it
// instead, which is why they are separate files and must not be regenerated
// from mark.svg. See public/brand/README.md.
describe('the small drawings are their own', () => {
  const mark = read('public', 'brand', 'mark.svg');
  const favicon = read('public', 'brand', 'favicon.svg');
  const avatar = read('public', 'brand', 'avatar.svg');

  it('gives the favicon and the avatar a filled container the mark has not', () => {
    expect(favicon).toMatch(/<rect[^>]+fill="#c1121f"/i);
    expect(avatar).toMatch(/<circle[^>]+fill="#c1121f"/i);
    expect(mark).not.toMatch(/<rect|<circle/i);
  });

  it('knocks the radical out in paper rather than drawing it in red', () => {
    expect(favicon.toLowerCase()).toContain('stroke="#fbf7ee"');
    expect(avatar.toLowerCase()).toContain('stroke="#fbf7ee"');
    expect(mark.toLowerCase()).toContain('stroke="#c1121f"');
  });

  it('is a redrawn geometry, not the mark scaled', () => {
    const path = (svg: string) => svg.match(/ d="([^"]+)"/)?.[1];
    expect(path(favicon)).not.toBe(path(mark));
    expect(path(avatar)).not.toBe(path(mark));
    // Heavier, because a thin stroke is what vanishes.
    const width = (svg: string) => Number(svg.match(/stroke-width="(\d+)"/)?.[1]);
    expect(width(favicon)).toBeGreaterThan(width(mark));
    expect(width(avatar)).toBeGreaterThan(width(mark));
  });
});

describe('what ships beside the app', () => {
  it('carries the three icons Next serves by convention', () => {
    for (const f of ['icon.png', 'apple-icon.png', 'favicon.ico']) {
      expect(existsSync(at('app', f)), `app/${f}`).toBe(true);
    }
  });

  it('gives the favicon both sizes, since 16 is not 32 shrunk', () => {
    const ico = readFileSync(at('app', 'favicon.ico'));
    expect(ico.readUInt16LE(0)).toBe(0); // reserved
    expect(ico.readUInt16LE(2)).toBe(1); // type: icon
    expect(ico.readUInt16LE(4)).toBe(2); // two entries
    expect([ico[6], ico[6 + 16]].sort((a, b) => a - b)).toEqual([16, 32]);
  });

  it('keeps no second copy of Fraunces — next/font already loads it', () => {
    expect(existsSync(at('public', 'brand', 'fraunces-var.ttf'))).toBe(false);
  });

  it('leaves the page header as text rather than a picture of text', () => {
    const header = read('app', 'page.tsx');
    expect(header).toMatch(/extra<em>lesson<\/em>/);
  });
});
