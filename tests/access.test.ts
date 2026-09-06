import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FREE_SESSIONS, hasAccess } from '@/lib/access';
import { GRACE_DAYS, accessEndsAt } from '@/lib/sittings';

const grant = (sitting: string) => ({
  sitting,
  granted_at: new Date('2026-09-01T00:00:00Z'),
  source: 'manual',
});

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

  it('reads a granted sitting as access while that sitting is still ahead', () => {
    // An explicit `now`: a test that depends on the real clock passes today and
    // fails in July 2027 for no reason anyone will remember.
    expect(
      hasAccess(grant('may-june-2027'), new Date('2027-03-01T00:00:00Z')),
    ).toBe(true);
  });

  it('states the free tier as a number the UI reads, not one it repeats', () => {
    expect(FREE_SESSIONS).toBeGreaterThan(0);
  });
});

// ACCESS RUNS OUT WITH THE SITTING IT WAS BOUGHT FOR.
//
// Every case is pinned against a fixed clock. The dates are the sitting window
// ends from lib/sittings.ts plus GRACE_DAYS, and the reason the window is the
// END OF THE MONTH rather than a paper date is that timetables move and a
// student revising for a paper on the 24th must not lose access on the 11th.
describe('expiry', () => {
  const may = (d: string) => hasAccess(grant('may-june-2027'), new Date(d));

  it('holds through the whole sitting month', () => {
    expect(may('2027-06-01T00:00:00Z')).toBe(true);
    expect(may('2027-06-30T12:00:00Z')).toBe(true);
  });

  it('holds through the grace period after the sitting ends', () => {
    expect(may('2027-07-15T00:00:00Z')).toBe(true);
    expect(GRACE_DAYS).toBe(30);
  });

  it('ends once the grace period is over', () => {
    expect(may('2027-08-15T00:00:00Z')).toBe(false);
    expect(may('2028-01-01T00:00:00Z')).toBe(false);
  });

  it('expires the January sitting on its own dates, not those of May/June', () => {
    const jan = (d: string) => hasAccess(grant('jan-2027'), new Date(d));
    expect(jan('2027-01-20T00:00:00Z')).toBe(true);
    expect(jan('2027-02-20T00:00:00Z')).toBe(true);
    expect(jan('2027-04-01T00:00:00Z')).toBe(false);
    // The May/June student still has access on the day the January one loses it.
    expect(may('2027-04-01T00:00:00Z')).toBe(true);
  });

  it('does not expire a sitting with no end date recorded', () => {
    // Only reachable if a sitting is added to the enum without a date. Of the
    // two ways to be wrong, keeping a paying student slightly too long beats
    // locking one out by an oversight.
    expect(accessEndsAt('jan-2099')).toBeNull();
    expect(hasAccess(grant('jan-2099'), new Date('2099-01-01T00:00:00Z'))).toBe(true);
  });

  it('an expired grant reads exactly like never having paid', () => {
    expect(may('2028-01-01T00:00:00Z')).toBe(hasAccess(null));
  });
});

// THE NOTE IS THE ONLY EVIDENCE A GRANT HAS (ROUND_3 §3).
//
// A sale carries a Stripe event id and traces itself. A comp traces nothing, so
// the convention is the whole audit trail — and a convention that lives only in
// a spec file is not one the operator follows at 9pm. These assert it is where
// notes are typed, and that the field cannot be left empty.
describe('the grant note convention', () => {
  const ADMIN = readFileSync(
    join(process.cwd(), 'app', 'admin', 'access', 'page.tsx'),
    'utf8',
  );

  it('shows all four classes of grant on the screen that writes them', () => {
    for (const token of ['stripe <event id>', 'comp · teacher', 'comp · pilot', 'comp · other']) {
      expect(ADMIN, token).toContain(token);
    }
  });

  it('will not accept a grant with no note at all', () => {
    // A bare grant six months on is indistinguishable from a mistake.
    expect(ADMIN).toMatch(/name="note"\s*\n\s*required/);
  });

  it('says the date is when the grant was agreed, not typed', () => {
    expect(ADMIN.replace(/\s+/g, ' ')).toMatch(/when the grant was <b>agreed<\/b>, not typed/);
  });

  it('tells the operator teacher comps go on the latest sitting', () => {
    expect(ADMIN.replace(/\s+/g, ' ')).toMatch(/latest sitting/);
  });
});
