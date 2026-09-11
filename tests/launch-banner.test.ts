import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { launchWarnings } from '@/lib/preflight';
import { REFUND_DAYS } from '@/lib/access';

// ROUND_13 gate. "A banner that asserts consistency and cannot check it is
// worse than no banner" — so every claim it makes is computed from the same
// value the pages read, and nothing in it is typed.
const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const LIVE = { NODE_ENV: 'production', NEXT_PUBLIC_STRIPE_PAYMENT_LINK: 'https://buy.stripe.com/live_abc' };
const TEST = { NODE_ENV: 'production', NEXT_PUBLIC_STRIPE_PAYMENT_LINK: 'https://buy.stripe.com/test_abc' };

describe('the before-launch banner', () => {
  it('reads test mode off the link the buy button uses, not off a flag', () => {
    expect(launchWarnings(TEST)).toHaveLength(1);
    expect(launchWarnings(TEST)[0]).toContain('TEST-MODE');
    // The same env var the payment link href is built from.
    expect(launchWarnings(LIVE)).toEqual([]);
    expect(at('lib', 'preflight.ts')).toMatch(/isTestModeLink\(env\.NEXT_PUBLIC_STRIPE_PAYMENT_LINK\)/);
  });

  it('says nothing at all off production, where a test link is the point', () => {
    expect(launchWarnings({ ...TEST, NODE_ENV: 'development' })).toEqual([]);
  });

  it('states no number of its own', () => {
    const src = at('lib', 'preflight.ts');
    const warnings = src.slice(src.indexOf('export function launchWarnings'), src.indexOf('\n}\n', src.indexOf('export function launchWarnings')));
    // A typed figure in a banner is the thing the gate exists to forbid.
    expect(warnings.match(/\b\d+\b/g) ?? [], 'no typed figure').toEqual([]);
  });
});

// The other half of "computed, not typed": the refund window appears on five
// surfaces and is one constant. Nothing types it, so nothing can disagree.
describe('the refund window', () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry)) files.push(full);
    }
  };
  walk(join(process.cwd(), 'app'));
  walk(join(process.cwd(), 'lib'));

  it('is one constant, and every surface reads it', () => {
    expect(REFUND_DAYS).toBe(14);
    const typed = files.filter((f) => {
      const src = readFileSync(f, 'utf8');
      return /\b14[- ]day|within 14|fourteen day/i.test(src) && !/REFUND_DAYS/.test(src);
    });
    expect(typed.map((f) => f.replace(process.cwd() + '/', '')), 'nobody types the window').toEqual([]);
    // And it is read where a reader is promised it.
    for (const surface of [['app', 'refunds', 'page.tsx'], ['app', 'page.tsx'], ['app', 'terms', 'page.tsx']]) {
      expect(at(...surface), surface.join('/')).toContain('REFUND_DAYS');
    }
  });
});
