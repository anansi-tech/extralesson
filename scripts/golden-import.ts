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
const { id, files } = importGoldenBundle(bundle, join(process.cwd(), 'design', 'golden'));
console.log(`${id} added as proposed: ${files.join(', ')}`);
