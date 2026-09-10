import { defaultExclude, defineConfig } from 'vitest/config';
import path from 'node:path';
import { browserSuites } from './tests/browser-suites.mjs';

/**
 * TWO PROJECTS, ONE SUITE. `vitest run` runs both and is what the push gate
 * uses; the commit gate runs `unit` alone, which is every test that does not
 * start Chrome. Nothing is excluded from the run as a whole — the browser
 * suites are the other project, not a skipped one.
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  esbuild: { jsx: 'automatic' },
  // A page that imports a stylesheet must not drag Tailwind's PostCSS plugin
  // into the run: nothing here renders through it — the width harness reads the
  // CSS files itself and hands them to Chrome.
  css: { postcss: { plugins: [] } },
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup/indexes.ts'],
    projects: [
      {
        extends: true,
        test: { name: 'unit', environment: 'node', include: ['tests/**/*.test.ts'], exclude: [...defaultExclude, ...browserSuites] },
      },
      {
        extends: true,
        test: { name: 'browser', environment: 'node', include: browserSuites },
      },
    ],
  },
});
