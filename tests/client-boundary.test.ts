import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

/**
 * NO CLIENT MODULE MAY REACH THE DATABASE, however far round the houses.
 *
 * /welcome rendered correctly on the server, passed every test, and then died
 * three seconds later in the browser: `Cannot read properties of undefined
 * (reading 'Topic')`. A client component imported two constants from
 * lib/welcome.ts, that file imports @/lib/db, and so every Mongoose model went
 * into the page's client bundle — where `models` is undefined and evaluating
 * lib/db/topic.ts throws. Nothing on the server saw it: the GET was 200 and the
 * runtime log had no error in it at all.
 *
 * A boundary kept by hand is kept until someone imports a constant across it, so
 * this walks the graph instead.
 */
const ROOT = process.cwd();
const SOURCE = ['app', 'lib'];
const EXTENSIONS = ['.ts', '.tsx'];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTENSIONS.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}
const FILES = SOURCE.flatMap((d) => walk(join(ROOT, d)));
const read = (file: string) => readFileSync(file, 'utf8');
const show = (file: string) => relative(ROOT, file);

/**
 * Every local import a file makes AT RUNTIME, resolved to a file on disk.
 * `import type` is erased before anything is bundled, so a client component may
 * take a type from a server module and ship none of it — three of them do.
 */
function importsOf(file: string): string[] {
  const source = read(file);
  const specifiers = [
    ...source.matchAll(/(?:^|\n)\s*import\s+(?!type\s)[^'"]*?from\s*['"]([^'"]+)['"]/g),
    ...source.matchAll(/(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g),
    ...source.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g),
  ].map((m) => m[1]);

  const resolved: string[] = [];
  for (const spec of specifiers) {
    const base = spec.startsWith('@/') ? join(ROOT, spec.slice(2)) : spec.startsWith('.') ? resolve(dirname(file), spec) : null;
    if (!base) continue;
    const hit = [...EXTENSIONS.map((e) => base + e), ...EXTENSIONS.map((e) => join(base, 'index' + e)), base].find(
      (p) => existsSync(p) && statSync(p).isFile(),
    );
    if (hit) resolved.push(hit);
  }
  return resolved;
}

const IMPORTS = new Map(FILES.map((f) => [f, importsOf(f)]));
const directive = (file: string, name: string) => new RegExp(`^(['"])use ${name}\\1`).test(read(file).trimStart().split('\n')[0] ?? '');
const isClient = (file: string) => directive(file, 'client');
/**
 * A 'use server' module is the boundary itself: Next replaces the import with a
 * reference to the action and ships none of its code to the browser. That is
 * how a client component is supposed to reach the database, so the walk stops
 * there. lib/welcome.ts carried no such directive, which is why importing two
 * constants from it shipped Mongoose.
 */
const isServerBoundary = (file: string) => directive(file, 'server');
/** The database itself, and anything that speaks to it directly. */
const isServerOnly = (file: string) =>
  show(file) === 'lib/db.ts' || show(file).startsWith('lib/db/') || /from\s+['"]mongoose['"]/.test(read(file));

/** The shortest path from a client module to server-only code, if there is one. */
function chainToDatabase(entry: string): string[] | null {
  const queue: string[][] = [[entry]];
  const seen = new Set([entry]);
  while (queue.length) {
    const chain = queue.shift()!;
    for (const next of IMPORTS.get(chain[chain.length - 1]) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      const extended = [...chain, next];
      if (isServerOnly(next)) return extended;
      if (isServerBoundary(next)) continue;
      queue.push(extended);
    }
  }
  return null;
}

describe('the client/server boundary', () => {
  const clients = FILES.filter(isClient);

  it('finds the client modules to check', () => {
    expect(clients.length, 'there are client components to walk from').toBeGreaterThan(5);
    expect(clients.map(show)).toContain('app/welcome/confirming.tsx');
  });

  it('no client module reaches @/lib/db or mongoose, however far round', () => {
    const broken = clients
      .map((entry) => ({ entry, chain: chainToDatabase(entry) }))
      .filter((r) => r.chain)
      .map((r) => r.chain!.map(show).join('\n      → '));

    expect(broken, `a client bundle that reaches the database throws in the browser:\n\n   ${broken.join('\n\n   ')}\n`).toEqual([]);
  });

  it('stops at a server action, which is how a client is meant to reach the database', () => {
    // The pattern this must not flag: a client component calling an action.
    const button = join(ROOT, 'app', 'study', 'request-refund-button.tsx');
    expect(isClient(button)).toBe(true);
    expect(isServerBoundary(join(ROOT, 'app', 'study', 'actions.ts'))).toBe(true);
    expect(chainToDatabase(button)).toBeNull();
  });

  it('ignores a type-only import, which is erased before anything is bundled', () => {
    const photo = join(ROOT, 'app', 'study', 'session', '[id]', 'working-photo.tsx');
    expect(isClient(photo)).toBe(true);
    expect(read(photo), 'takes only a type from a module that holds the database').toContain("import type { CaptureResult } from './mark-working'");
    expect(chainToDatabase(photo)).toBeNull();
    // The same file by a value import would be caught, which is the difference.
    expect(chainToDatabase(join(ROOT, 'app', 'study', 'session', '[id]', 'mark-working.ts'))).not.toBeNull();
  });

  it('would still catch the import that broke /welcome', () => {
    // lib/welcome.ts is server code with no directive on it, so anything a
    // client pulls from it is bundled whole — that was the defect.
    const welcome = join(ROOT, 'lib', 'welcome.ts');
    expect(isServerBoundary(welcome), 'a plain module, not a boundary').toBe(false);
    expect(chainToDatabase(welcome)!.map(show)).toContain('lib/db/index.ts');
    // Which is why the poll's numbers were moved out of it.
    expect(chainToDatabase(join(ROOT, 'lib', 'welcome-poll.ts')), 'the client half reaches nothing').toBeNull();
    expect(read(join(ROOT, 'app', 'welcome', 'confirming.tsx'))).toContain("from '@/lib/welcome-poll'");
  });
});
