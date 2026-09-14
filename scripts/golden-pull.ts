// Carries field cases from the database into design/golden, where they can be
// committed. The button on /admin/disputes records a case; it cannot write the
// repo, because a deployed function's filesystem is read-only. This is the
// half that runs on a machine that has the repo.
//
// What it writes is what `pnpm golden:import` writes, through the same
// importer: the entry PROPOSED, which the loader skips until a person approves
// it. Nothing is re-read and no model is called — the bundle stored at the
// moment the dispute was resolved is what goes in, because the attempt it came
// from can be marked again.
//
// Previews by default; --yes applies.
// Run: pnpm golden:pull [--yes]
import 'dotenv/config';
import { dbConnect, GoldenCase } from '@/lib/db';
import type { GoldenBundle } from '@/lib/golden/bundle';
import { GOLDEN_DIR, hasGoldenCase, importGoldenBundle } from '@/lib/golden/import';
import { isEntryPoint } from './entry';

export async function pullGoldenCases(dir: string = GOLDEN_DIR, apply = false) {
  const waiting = await GoldenCase.find({ pulled_at: null }).sort({ added_at: 1 }).lean<
    { _id: unknown; case_id: string; bundle: GoldenBundle; added_at: Date }[]
  >();

  const already = waiting.filter((c) => hasGoldenCase(c.case_id, dir));
  const todo = waiting.filter((c) => !hasGoldenCase(c.case_id, dir));
  console.log(`recorded and not yet pulled: ${waiting.length}`);
  if (already.length) console.log(`  already in the files (marking pulled, writing nothing): ${already.map((c) => c.case_id).join(', ')}`);
  for (const c of todo) console.log(`  ${c.case_id}  added ${new Date(c.added_at).toISOString().slice(0, 10)}`);

  if (!apply) {
    console.log(waiting.length ? '\npreview only; pass --yes to write' : 'nothing to pull');
    return { written: [] as string[], marked: 0 };
  }

  const written: string[] = [];
  for (const c of todo) {
    await importGoldenBundle(c.bundle, dir);
    written.push(c.case_id);
  }
  // A case already in the files is marked pulled too: it is in, and leaving it
  // waiting would offer it again at every run.
  const ids = [...todo, ...already].map((c) => c._id);
  if (ids.length) await GoldenCase.updateMany({ _id: { $in: ids } }, { $set: { pulled_at: new Date() } });
  console.log(`\nwritten: ${written.length} · marked pulled: ${ids.length}`);
  if (written.length) console.log('Review the diff and commit design/golden.');
  return { written, marked: ids.length };
}

async function main() {
  await dbConnect();
  await pullGoldenCases(GOLDEN_DIR, process.argv.includes('--yes'));
  process.exit(0);
}

// Only when run as a script: an import must not start the work.
if (isEntryPoint(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
