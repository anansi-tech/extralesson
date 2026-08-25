import { describe, expect, it } from 'vitest';
import { FREE_SESSIONS, hasAccess } from '@/lib/access';

// THE FREE TIER, AND WHAT THE PAYWALL DOES NOT TAKE.
//
// The gate is on CREATING a session. An attempt is a record of work a student
// actually did, and paying is not what made it true — so the notebook, the
// marks and every answered question stay visible whether they have paid or not.
describe('access', () => {
  it('grants nothing by omission: absent access is the free tier', () => {
    expect(hasAccess(undefined)).toBe(false);
    expect(hasAccess(null)).toBe(false);
    // Every account that existed before the field, and every new one.
    expect(hasAccess({} as never)).toBe(false);
  });

  it('reads a granted sitting as access', () => {
    expect(
      hasAccess({ sitting: 'may-june-2027', granted_at: new Date(), source: 'manual' }),
    ).toBe(true);
  });

  it('states the free tier as a number the UI reads, not one it repeats', () => {
    expect(FREE_SESSIONS).toBeGreaterThan(0);
  });
});
