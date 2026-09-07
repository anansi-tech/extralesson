import Module from 'node:module';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

// The card is a client component and asks the router for itself; outside the
// app there is none, so the one import is answered by a stub.
type Resolve = (spec: string, ctx: unknown, next: (spec: string, ctx: unknown) => unknown) => unknown;
(Module as unknown as { registerHooks: (hooks: { resolve: Resolve }) => void }).registerHooks({
  resolve(spec, ctx, next) {
    if (spec === 'next/navigation') return { url: pathToFileURL(join(__dirname, 'gallery', 'stub-navigation.mjs')).href, shortCircuit: true };
    return next(spec, ctx);
  },
});

const OUT = join(process.cwd(), 'calibration', 'gallery');

/** Every student screen in every state, at 390 and 1280, as PNGs under calibration/gallery/. */
async function main() {
  const { chromium } = await import('playwright-core');
  const { GALLERY, WIDTHS, shotName } = await import('../tests/helpers/gallery');
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const names: string[] = [];
  for (const shot of GALLERY) {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(shot.page, { waitUntil: 'networkidle' });
      if (shot.surface) await page.evaluate((html) => { document.getElementById('camera-box')!.outerHTML = html; }, shot.surface);
      const name = shotName(shot, width);
      await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
      names.push(name);
      await page.close();
      process.stdout.write(`${name}\n`);
    }
  }
  await browser.close();
  writeFileSync(join(OUT, 'index.html'), `<!doctype html><title>Gallery</title><body style="font-family:monospace;background:#eee">${names.map((n) => `<figure style="display:inline-block;vertical-align:top;margin:8px"><img src="${n}.png" style="width:${n.endsWith('390') ? 195 : 640}px;border:1px solid #999"><figcaption>${n}</figcaption></figure>`).join('')}</body>`);
  console.log(`${names.length} screens in ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
