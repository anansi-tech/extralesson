import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * A SCRIPT RUNS WHEN IT IS THE COMMAND, NEVER WHEN SOMETHING IMPORTS IT.
 *
 * Every script here loads dotenv at module scope and most open the production
 * database; several write to it, and one deletes files. Their work used to run
 * on import, so a test that imported one to reach a helper or a constant — the
 * tests already import `golden-set` and `eval-provenance` — connected with real
 * credentials and started the job. A test of the generator's flags did exactly
 * that and began a generation run.
 *
 * Compared by resolved path rather than by file name: two scripts can share a
 * basename across directories, which is what `endsWith` could not tell apart.
 */
export function isEntryPoint(metaUrl: string): boolean {
  const invoked = process.argv[1];
  if (!invoked) return false;
  const resolved = (p: string) => {
    try {
      return realpathSync(p);
    } catch {
      return p;
    }
  };
  return resolved(fileURLToPath(metaUrl)) === resolved(invoked);
}
