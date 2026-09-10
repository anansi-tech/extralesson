import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FREE_SESSIONS, hasAccess, isComp } from '@/lib/access';
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
  const at = (f: string) => readFileSync(join(process.cwd(), 'app', 'admin', 'access', f), 'utf8');
  // The page says what the classes mean; the form writes them. Both are read,
  // so neither half can go missing.
  const ADMIN = at('page.tsx');
  const FORM = at('grant-form.tsx');

  // The convention used to be printed above a free-text box, which made it
  // advice; the form writes the note now, so what is on screen is which of the
  // two classes to pick.
  it('offers the two classes and nothing else', () => {
    expect(FORM).toContain('<option value="sale">Sale</option>');
    expect(FORM).toContain('<option value="comp">Comp</option>');
    expect(ADMIN + FORM, 'no free-typed note survives').not.toContain('name="note"');
    // One component, used by both forms, so the pair is written once.
    expect([...FORM.matchAll(/<option value="(sale|comp)"/g)].length).toBe(2);
    expect([...ADMIN.matchAll(/<GrantForm/g)].length, 'the standalone form and the row form').toBe(2);
  });

  // The sitting is the account's, or it is nothing: defaulting to the first
  // open sitting gave a January candidate access that ends in June.
  it('never preselects a sitting the account did not choose', () => {
    expect(FORM).toMatch(/<option value="" disabled>/);
    expect(FORM).toMatch(/name="sitting"[\s\S]{0,120}required/);
    expect(FORM, 'no first-option default').not.toMatch(/name="sitting"[\s\S]{0,200}defaultValue/);
    expect(FORM).toContain('sittingFor');
  });

  it('asks before granting a sitting that is not the account’s, naming both', () => {
    expect(FORM).toMatch(/window\.confirm\(/);
    const flat = FORM.replace(/\s+/g, ' ');
    expect(flat).toMatch(/registered for \$\{label\(registered\)\}/);
    expect(flat).toMatch(/granting access to \$\{label\(sitting\)\}/);
    expect(flat).toMatch(/if \(!registered \|\| sitting === registered \|\| !sitting\) return;/);
  });

  it('says what each class means where the operator picks it', () => {
    const flat = ADMIN.replace(/\s+/g, ' ');
    expect(flat).toMatch(/Sale<\/b> — money arrived and the automatic path did not connect it/);
    expect(flat).toMatch(/Comp<\/b> — access given, nothing paid/);
  });

  it('will not accept a grant with no reason', () => {
    // A bare grant six months on is indistinguishable from a mistake.
    expect(ADMIN).toMatch(/name="reason"\s*\n?\s*required/);
    expect(ADMIN.replace(/\s+/g, ' ')).toMatch(/a comp with no reason is indistinguishable from a mistake/i);
  });

  it('tells the operator teacher comps go on the latest sitting', () => {
    expect(ADMIN.replace(/\s+/g, ' ')).toMatch(/latest sitting/);
  });
});

// A COMP IS NAMED, NOT INFERRED. /admin/access requires the note form
// `comp · kind · why · date` for every hand-granted comp, so the note is the
// record; reading a missing payment reference as a comp says the money never
// existed, which on an account that has paid us is false.
describe('isComp', () => {
  const note = (note?: string) => ({ sitting: 'may-june-2027', granted_at: new Date(), source: 'manual' as const, note });

  it('is true only for a note that names it one, whatever the source says', () => {
    expect(isComp(note('comp · teacher · st-marys · 2026-08-26'))).toBe(true);
    expect(isComp(note('  comp · pilot · ms-allen · 2 of 5'))).toBe(true);
    expect(isComp(note('Comp · other · launch week'))).toBe(true);
  });

  it('is false for a note that does not, and for no note at all', () => {
    expect(isComp(note('friend'))).toBe(false);
    expect(isComp(note('stripe evt_1'))).toBe(false);
    expect(isComp(note())).toBe(false);
    expect(isComp(null)).toBe(false);
    // Not a prefix match on any word beginning with those letters.
    expect(isComp(note('compensation for the outage'))).toBe(false);
  });
});
