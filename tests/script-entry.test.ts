import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { isEntryPoint } from '@/scripts/entry';

/**
 * A SCRIPT RUNS WHEN IT IS THE COMMAND, NEVER WHEN SOMETHING IMPORTS IT.
 *
 * Every script under scripts/ loads dotenv at module scope and most open the
 * production database; several write to it and one deletes files. Their work
 * ran at import, and tests already import scripts for their helpers — so a test
 * written to check the generator's flags connected with real credentials and
 * started a generation run. This is the check that keeps the next one from it.
 */
const SCRIPTS = join(process.cwd(), 'scripts');

const walk = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith('.ts')) out.push(full);
  }
  return out;
};

/** A call at column 0 runs the moment the module is loaded. */
const TOP_LEVEL_CALL = /^(?:void\s+)?(?:[A-Za-z_$][\w$.]*\(|\(async|\(function)/;

describe('every script under scripts/ guards its entry point', () => {
  const files = walk(SCRIPTS);

  it('finds the scripts, so an empty sweep cannot pass', () => {
    expect(files.length).toBeGreaterThan(40);
  });

  for (const file of walk(SCRIPTS)) {
    const name = file.replace(process.cwd() + '/', '');

    it(`${name} does nothing on import`, () => {
      const lines = readFileSync(file, 'utf8').split('\n');
      const unguarded = lines
        .map((line, i) => ({ line, at: i + 1 }))
        .filter(({ line }) => TOP_LEVEL_CALL.test(line));

      expect(unguarded.map((u) => `${u.at}: ${u.line}`), 'a call at column 0 runs on import').toEqual([]);
    });
  }

  it('a file that calls main() wraps it in the shared guard', () => {
    const callers = files.filter((f) => /\bmain\(\)/.test(readFileSync(f, 'utf8')));
    expect(callers.length).toBeGreaterThan(40);

    for (const f of callers) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).toContain('isEntryPoint(import.meta.url)');
    }
  });
});

describe('isEntryPoint', () => {
  it('is true only for the file node was told to run', () => {
    const invoked = process.argv[1];
    expect(typeof invoked === 'string' && invoked.length > 0).toBe(true);

    // The test runner's own entry is not any of our scripts.
    expect(isEntryPoint(new URL('file://' + join(SCRIPTS, 'generate.ts')).href)).toBe(false);
  });

  it('compares resolved paths, so two scripts sharing a name stay apart', () => {
    // 'repair-formatting.ts' guarded itself with endsWith, which a file of the
    // same name in another directory would have satisfied.
    const guards = walk(SCRIPTS).filter((f) => /process\.argv\[1\]\?\.endsWith/.test(readFileSync(f, 'utf8')));
    expect(guards).toEqual([]);
  });
});
