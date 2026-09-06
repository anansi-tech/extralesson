import { describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANDING } from '@/lib/landing-content';
import { pickShareLine } from '@/lib/share-line';
import manifest from '@/app/manifest';

vi.mock('@/lib/db', () => ({ dbConnect: async () => {}, Question: {} }));
vi.mock('@/lib/share-line', async (orig) => ({ ...(await orig<typeof import('@/lib/share-line')>()), loadShareLine: async () => ({ wrote: 'x = 1/3', slip: 'Sign slip' }) }));

const at = (...p: string[]) => join(process.cwd(), ...p);
const pngSize = (f: string) => {
  const b = readFileSync(f);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

// ROUND_9 Task 8: the share image reads the h1 as it stands, the icon set
// is drawn from the mark, and the manifest puts the app on a home screen.
describe('the share image', () => {
  it('reads the headline the page prints, so a copy change cannot strand it', () => {
    const page = readFileSync(at('app', 'page.tsx'), 'utf8');
    const h1 = page.match(/<h1>([^<]+)<\/h1>/)?.[1].replace(/&rsquo;/g, '’');
    expect(h1).toBe(LANDING.headline);
    const og = readFileSync(at('app', 'opengraph-image.tsx'), 'utf8');
    expect(og).toContain('{LANDING.headline}');
    expect(og).toContain('{LANDING.domain}');
    expect(LANDING.domain).toBe('extralesson.app');
  });
  it('takes its marked line from an approved question in bank order, short and free of TeX, never invented', () => {
    const q = (...m: [string, string][]) => ({ misconceptions: m.map(([trigger, name]) => ({ trigger, name, remediation: '' })) });
    expect(pickShareLine([q(['$x=\\frac{1}{3}$', 'Sign slip']), q(['x = 1/3', 'Sign slip'])])).toEqual({ wrote: 'x = 1/3', slip: 'Sign slip' });
    expect(pickShareLine([q(['a very long trigger that could not be drawn at 44px', 'Slip'])])).toBeNull();
    expect(pickShareLine([])).toBeNull();
    const src = readFileSync(at('lib', 'share-line.ts'), 'utf8');
    expect(src).toMatch(/status: 'approved'/);
  });
  it('renders, with the line from the bank', async () => {
    {
      const { default: OgImage, size } = await import('@/app/opengraph-image');
      const res = await OgImage();
      expect(res.status).toBe(200);
      const png = Buffer.from(await res.arrayBuffer());
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([size.width, size.height]);
      if (process.env.SHARE_OUT) writeFileSync(process.env.SHARE_OUT, png);
    }
  }, 60000);
});

describe('the icon and the manifest', () => {
  it('ships the five reductions at their sizes, and the two Next serves by convention', () => {
    for (const px of [512, 180, 96, 60, 32]) {
      const f = at('public', `icon-${px}.png`);
      expect(existsSync(f), f).toBe(true);
      expect(pngSize(f), f).toEqual([px, px]);
    }
    expect(pngSize(at('app', 'icon.png'))).toEqual([512, 512]);
    expect(pngSize(at('app', 'apple-icon.png'))).toEqual([180, 180]);
  });
  it('names the app, the icon set and the paper', () => {
    const m = manifest();
    expect(m.name).toBe('ExtraLesson');
    expect(m.background_color).toBe('#FBF7EE');
    expect(m.theme_color).toBe('#FBF7EE');
    expect(m.icons?.map((i) => i.sizes)).toEqual(['512x512', '180x180', '96x96', '60x60', '32x32']);
    expect(m.start_url).toBe('/study');
  });
});
