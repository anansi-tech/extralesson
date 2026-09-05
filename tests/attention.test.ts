import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const page = at('app', 'admin', 'access', 'page.tsx');
const actions = at('app', 'admin', 'access', 'actions.ts');

// ROUND_7 Task 3: payments needing attention.
describe('/admin/access', () => {
  it('lists failed and stale pending fulfilments first, with reference and next step, then paid access, then free allowance used', () => {
    expect(page).toMatch(/\{ status: 'failed' \}, \{ status: 'pending', ts: \{ \$lt: new Date\(Date\.now\(\) - STALE_PENDING_MS\) \} \}/);
    expect(page).toMatch(/STALE_PENDING_MS = 60 \* 60 \* 1000/);
    const order = ['Payments needing attention', 'Next: resend the event', 'Refused payments', "'Paid access'", "'Free allowance used'"].map((s) => page.indexOf(s));
    expect(order.every((n) => n > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(page).toMatch(/\{f\.session_id\} · \{f\.event_id\}/);
  });
  it('never says waiting', () => {
    expect(page.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/\bwaiting\b/);
  });
  it('searches by email, filters to attention, names the granted account and sitting', () => {
    expect(page).toMatch(/r\.email\.toLowerCase\(\)\.includes\(needle\)/);
    expect(page).toMatch(/name="attention"/);
    expect(page).toMatch(/Granted: <b className="break-all">\{granted\}<\/b> · \{grantedSitting\}/);
    expect(actions).toMatch(/redirect\(`\/admin\/access\?granted=\$\{encodeURIComponent\(student\?\.email \?\? id\)\}&sitting=\$\{sitting\}`\)/);
  });
  it('resolving an unmatched payment requires a reason, written into the record', () => {
    expect(page).toMatch(/name="reason" required minLength=\{3\}/);
    expect(actions).toMatch(/if \(reason\.length < 3\) return;/);
    expect(actions).toMatch(/note: `resolved: \$\{reason\}`/);
  });
});
