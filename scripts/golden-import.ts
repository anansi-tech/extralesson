// Appends an exported dispute bundle to design/golden as a PROPOSED case.
// Run: pnpm golden:import <bundle.json>
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { importGoldenBundle } from '@/lib/golden/import';
import type { GoldenBundle } from '@/lib/golden/bundle';

const path = process.argv[2];
if (!path) {
  console.error('usage: pnpm golden:import <bundle.json>');
  process.exit(1);
}
const bundle = JSON.parse(readFileSync(path, 'utf8')) as GoldenBundle;
importGoldenBundle(bundle, join(process.cwd(), 'design', 'golden')).then(({ id, files, reread }) => {
  console.log(`${id} added as proposed: ${files.join(', ')}${reread ? ' — page re-read with the current reader' : ' — stored read kept (no image, or the reader failed)'}`);
});
