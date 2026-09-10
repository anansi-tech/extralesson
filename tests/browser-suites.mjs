import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The suites that drive a real browser, by what they import rather than by what
 * they are named: a new one joins the list by importing playwright-core, and a
 * rename cannot drop one out of it. The commit gate runs everything else; the
 * push gate runs all of it. Read from here by vitest.config.ts and by the two
 * hooks, so the split is stated once.
 */
export const browserSuites = readdirSync(HERE, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.test.ts'))
  .filter((f) => readFileSync(join(HERE, f), 'utf8').includes('playwright-core'))
  .map((f) => `tests/${f.split(sep).join('/')}`)
  .sort();
