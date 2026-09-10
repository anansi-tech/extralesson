import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const page = at('app', 'admin', 'access', 'page.tsx');
const queue = at('app', 'admin', 'access', 'payment-queue.tsx');
const actions = at('app', 'admin', 'access', 'actions.ts');

// ROUND_7 Task 3 asked for payments needing attention; ROUND_11 Task 4 made
// them one list derived from one record. The intentions are the same: the work
// first, a reason on every close, and the operator told what happened.
describe('/admin/access', () => {
  it('leads with the one queue, then paid access, then free allowance used', () => {
    const order = ['<PaymentQueue rows={queue} />', "'Paid access'", "'Free allowance used'"].map((s) => page.indexOf(s));
    expect(order.every((n) => n > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    // One counter, and it counts the list.
    expect(page).toMatch(/\{queue\.length\}<\/b> payments needing attention/);
  });
  it('holds the states with work in them, and nothing else', () => {
    expect(at('lib', 'payment-queue.ts')).toMatch(/Payment\.find\(\{ \$or: \[\{ state: \{ \$in: QUEUE_STATES \} \}, \{ _id: \{ \$in: open\.map/);
    // ROUND_12 added the two a refund leaves needing a person.
    expect(at('lib', 'payment-state.ts')).toMatch(
      /QUEUE_STATES: PaymentState\[\] = \['waiting', 'duplicate', 'refund_approved', 'refund_failed'\]/,
    );
    // Oldest first: the queue is work, and the oldest debt has waited longest.
    expect(at('lib', 'payment-queue.ts')).toMatch(/\.sort\(\{ received_at: 1 \}\)/);
  });
  it('searches by email, filters to attention, names the granted account and sitting', () => {
    expect(page).toMatch(/r\.email\.toLowerCase\(\)\.includes\(needle\)/);
    expect(page).toMatch(/name="attention"/);
    expect(page).toMatch(/Granted: <b className="break-all">\{granted\}<\/b> · \{grantedSitting\}/);
    // A grant always has an account by now: without one the action redirects unGRANTED instead.
    expect(actions).toMatch(/redirect\(`\/admin\/access\?granted=\$\{encodeURIComponent\(student\.email\)\}&sitting=\$\{sitting\}`\)/);
    expect(actions).toMatch(/if \(!student\) redirect\(`\/admin\/access\?ungranted=/);
  });
  it('closing a payment requires a reason, and records who and when', () => {
    expect(queue).toMatch(/name="reason" required minLength=\{3\}/);
    expect(actions).toMatch(/if \(reason\.length < 3\) redirect\('\/admin\/access\?noreason=1'\)/);
    expect(actions).toMatch(/transition\('closed', \{ reason, by: operator\.email \}\)/);
    // Conditional: a form rendered while it was waiting closes nothing once it is granted.
    expect(actions).toMatch(/\{ _id: id, state: \{ \$in: QUEUE_STATES \} \}/);
  });
});
