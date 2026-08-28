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
  it('is the same path on screen as in the source drawing', () => {
    const source = read('public', 'brand', 'mark.svg').match(/ d="([^"]+)"/)?.[1];
    const component = read('app', 'lockup.tsx').match(/MARK_PATH = '([^']+)'/)?.[1];
    expect(source, 'public/brand/mark.svg has no path').toBeTruthy();
    expect(component, 'app/lockup.tsx has no MARK_PATH').toBeTruthy();
    expect(component).toBe(source);
  });

  it('is written down once — the OG image imports it rather than keeping a copy', () => {
    const og = read('app', 'opengraph-image.tsx');
    expect(og).toMatch(/import \{ MARK_PATH \} from '\.\/lockup'/);
    expect(og, 'the OG image has its own copy of the path again').not.toMatch(/MARK_PATH\s*=\s*'M/);
  });

  it('is drawn in the red the tokens name', () => {
    expect(read('public', 'brand', 'mark.svg').toLowerCase()).toContain('#c1121f');
    expect(read('app', 'opengraph-image.tsx').toUpperCase()).toContain('#C1121F');
  });

  it('appears in the OG image, which used to be wordmark only', () => {
    expect(read('app', 'opengraph-image.tsx')).toMatch(/<img[^>]+src=\{mark\(/);
  });
});

// THE LOCKUP IS ONE COPY OF THREE PATHS.
//
// The reversed variant is not a second drawing — it is these same paths in
// three different colours, which is all lockup-reversed.svg changes. Pinned
// against both source files so the screen and public/brand/ cannot drift.
describe('the lockup on screen matches the source drawing', () => {
  const component = read('app', 'lockup.tsx');
  const paths = (svg: string) => [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);

  it('carries the same three paths as lockup.svg, in the same order', () => {
    const source = paths(read('public', 'brand', 'lockup.svg'));
    expect(source).toHaveLength(3);
    const [radical, extra, lesson] = source;
    expect(component).toContain(`MARK_PATH = '${radical}'`);
    expect(component).toContain(`EXTRA_PATH = '${extra}'`);
    expect(component).toContain(`LESSON_PATH = '${lesson}'`);
  });

  it('reproduces the reversed variant by colour alone', () => {
    const normal = read('public', 'brand', 'lockup.svg');
    const reversed = read('public', 'brand', 'lockup-reversed.svg');
    const strip = (svg: string) => svg.replace(/#[0-9a-fA-F]{6}/g, 'COLOUR');
    // If these ever stop matching, the reversed lockup has become its own
    // drawing and a colour prop can no longer stand in for it.
    expect(strip(reversed)).toBe(strip(normal));
    for (const colour of ['#fbf7ee', '#ff6b6b']) expect(component).toContain(colour);
  });

  it('keeps the geometry that makes the bar overhang the e', () => {
    const source = read('public', 'brand', 'lockup.svg');
    for (const transform of [...source.matchAll(/<g transform="([^"]+)"/g)].map((m) => m[1])) {
      expect(component, transform).toContain(transform);
    }
    expect(component).toContain(source.match(/viewBox="([^"]+)"/)![1]);
  });

  it('records the floor below which it is not used', () => {
    expect(component).toMatch(/LOCKUP_MIN_PX = 120/);
    expect(read('public', 'brand', 'README.md')).toContain('120px');
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

  it('draws the lockup in every header, not a rebuilt wordmark', () => {
    for (const page of [['app', 'page.tsx'], ['app', 'study', 'page.tsx'], ['app', 'welcome', 'page.tsx']]) {
      const src = read(...page);
      expect(src, page.join('/')).toMatch(/<(Lockup|Mark)[\s/>]/);
      // The text wordmark it replaces, in any of the three spellings used.
      expect(src, page.join('/')).not.toMatch(/extra<em/);
    }
  });
});
