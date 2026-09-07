import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { HELP_EMAIL } from '@/lib/help-email';

// ONE ADDRESS. The help address is HELP_EMAIL, the sender is RESEND_FROM, and
// no other address is written anywhere: three addresses once told a student
// three different places to write.
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx|mjs|md|json)$/.test(p) ? [p] : [];
  });
const ADDRESS = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;

describe('one help address', () => {
  it('is written once, in lib/help-email.ts', () => {
    expect(HELP_EMAIL).toMatch(/^[a-z]+@anansi\.xyz$/);
    for (const dir of ['app', 'lib', 'scripts']) {
      for (const f of walk(join(process.cwd(), dir))) {
        // Reserved domains never deliver: .invalid for an eval's stand-in student, example.com in a usage line.
        const found = (readFileSync(f, 'utf8').match(ADDRESS) ?? []).filter((a) => !/\.invalid$|@example\.com$/.test(a));
        if (f.endsWith(join('lib', 'help-email.ts'))) expect(found, f).toEqual([HELP_EMAIL]);
        else expect(found, f.replace(process.cwd(), '')).toEqual([]);
      }
    }
  });
  it('is the only real address in the tests; fixtures use example.com', () => {
    for (const f of walk(join(process.cwd(), 'tests'))) {
      const others = (readFileSync(f, 'utf8').match(ADDRESS) ?? []).filter((a) => a !== HELP_EMAIL && !/exampl|\.(invalid|test)$|@[a-z]\.gd$/i.test(a));
      expect(others, f.replace(process.cwd(), '')).toEqual([]);
    }
  });
  it('the sender falls back to the help address, never a third one', () => {
    expect(readFileSync(join(process.cwd(), 'lib', 'email.ts'), 'utf8')).toContain('process.env.RESEND_FROM ?? `ExtraLesson <${HELP_EMAIL}>`');
    expect(readFileSync(join(process.cwd(), '.env.example'), 'utf8')).toMatch(/^RESEND_FROM=/m);
  });
});
