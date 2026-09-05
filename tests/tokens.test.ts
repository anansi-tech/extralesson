import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');

// ROUND_8 Task 0: every variable on the system sheet is in globals.css under
// the sheet's name; the fonts are self-hosted.
describe('tokens and fonts', () => {
  it('carries every variable the system sheet declares', () => {
    const sheet = at('design', 'ui', 'ExtraLesson System Sheet.dc.html');
    const names = [...new Set([...sheet.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]))];
    expect(names.length).toBeGreaterThanOrEqual(60);
    const css = at('app', 'globals.css');
    const missing = names.filter((n) => !new RegExp(`${n.replace(/[-]/g, '\\-')}\\s*:`).test(css));
    expect(missing).toEqual([]);
  });
  it('keeps the values that predate the sheet where they differ for a reason', () => {
    const css = at('app', 'globals.css');
    expect(css).toMatch(/--dim: #5b6373/);
    expect(css).toMatch(/--rule-gap: 32px/);
    expect(css).toMatch(/--rule-baseline: 21px/);
  });
  it('makes no third-party font request from a student page', () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(tsx?|css)$/.test(f)) files.push(p);
      }
    };
    walk(join(process.cwd(), 'app'));
    for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    // next/font/google downloads at build and serves the files from our own origin.
    expect(at('app', 'layout.tsx')).toMatch(/from "next\/font\/google"/);
    expect(at('app', 'layout.tsx')).toMatch(/Caveat\(\{/);
  });
});
