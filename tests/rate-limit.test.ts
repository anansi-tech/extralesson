import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LIMITS, take } from '@/lib/auth/rate-limit';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');

describe('the token bucket', () => {
  const limit = { capacity: 3, refillPerSecond: 1 };
  it('allows the capacity, then refuses, then refills with time', () => {
    const t0 = 1_000_000;
    expect([take('k', limit, t0), take('k', limit, t0), take('k', limit, t0)]).toEqual([true, true, true]);
    expect(take('k', limit, t0)).toBe(false);
    expect(take('k', limit, t0 + 500)).toBe(false);
    expect(take('k', limit, t0 + 1000)).toBe(true);
  });
  it('never fills past the capacity, however long the wait', () => {
    const t0 = 2_000_000;
    take('slow', limit, t0);
    expect([1, 2, 3].map(() => take('slow', limit, t0 + 3_600_000))).toEqual([true, true, true]);
    expect(take('slow', limit, t0 + 3_600_000)).toBe(false);
  });
  it('keys are independent', () => {
    for (let i = 0; i < 3; i++) take('a', limit, 3_000_000);
    expect(take('a', limit, 3_000_000)).toBe(false);
    expect(take('b', limit, 3_000_000)).toBe(true);
  });
});

describe('where the limits sit', () => {
  it('covers login, both reset steps, and the read', () => {
    expect(Object.keys(LIMITS).sort()).toEqual(['login', 'read', 'reset-confirm', 'reset-request']);
    expect(at('app', 'study', 'login', 'actions.ts')).toMatch(/limited\('login', email\)[\s\S]*limited\('reset-request', email\)/);
    expect(at('app', 'study', 'reset', 'actions.ts')).toMatch(/limited\('reset-confirm'/);
    expect(at('app', 'study', 'session', '[id]', 'capture.ts')).toMatch(/limited\('read', auth\.student_id\)/);
  });
});
