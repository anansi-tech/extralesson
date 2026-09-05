// Deletes field images older than 90 days (ROUND_6 Task 7). The transcript
// in design/golden is the record; the picture is not kept past its use.
// Run: pnpm golden:field-prune [--yes]
import { existsSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

export const FIELD_IMAGE_DAYS = 90;
const dir = join(process.cwd(), 'design', 'golden', 'field');
const cutoff = Date.now() - FIELD_IMAGE_DAYS * 24 * 60 * 60 * 1000;
const apply = process.argv.includes('--yes');

const old = existsSync(dir)
  ? readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f) && statSync(join(dir, f)).mtimeMs < cutoff)
  : [];
for (const f of old) {
  if (apply) unlinkSync(join(dir, f));
  console.log(`${apply ? 'deleted' : 'would delete'} ${f}`);
}
console.log(`${old.length} field image(s) older than ${FIELD_IMAGE_DAYS} days${apply ? ' deleted' : ' — pass --yes to delete'}`);
