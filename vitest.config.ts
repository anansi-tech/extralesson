import { defineConfig } from 'vitest/config';
import path from 'node:path';

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
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
