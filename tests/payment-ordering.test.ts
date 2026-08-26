import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const REGISTER = read('app', 'study', 'login', 'actions.ts');
const WEBHOOK = read('app', 'api', 'stripe', 'webhook', 'route.ts');
const GRANT = read('lib', 'grant-from-payment.ts');

// PAY-THEN-REGISTER AND REGISTER-THEN-PAY ARE THE SAME EVENT, ARRIVING IN
// DIFFERENT ORDERS.
//
// Only one order was handled. Stripe firing after the account exists was fine;
// paying first — which is exactly what the checkout caption invites — recorded
// an unmatched payment and left a paying student on the free tier until
// somebody read the admin screen. Verified end to end in both directions before
// this landed; these assertions keep the two paths from drifting apart again.
describe('both orderings grant access', () => {
  it('register() looks for a payment already waiting on the address', () => {
    expect(REGISTER).toContain('pendingPaymentFor');
    expect(REGISTER).toContain('grantFromPayment');
  });

  it('the webhook grants through the same function, not its own copy', () => {
    expect(WEBHOOK).toContain('grantFromPayment');
    // The inlined Student.updateOne that used to set access here is gone: two
    // copies of a grant is how the two orderings come to mean different things.
    expect(WEBHOOK).not.toMatch(/access:\s*\{/);
  });

  it('marking the payment matched is part of granting, not left to the caller', () => {
    const fn = GRANT.slice(GRANT.indexOf('export async function grantFromPayment'));
    expect(fn).toContain('Payment.updateOne');
    expect(fn).toContain('student_id: studentId');
  });

  it('takes the oldest waiting payment, leaving a double charge to be looked at', () => {
    expect(GRANT).toMatch(/sort\(\{ received_at: 1 \}\)/);
    expect(GRANT).toMatch(/student_id: null/);
    expect(GRANT).toMatch(/resolved_at: null/);
  });

  it('keeps the unmatched surface for the cases no account will ever fix', () => {
    const ADMIN = read('app', 'admin', 'access', 'page.tsx');
    expect(ADMIN).toMatch(/student_id: null, resolved_at: null/);
    expect(ADMIN).toMatch(/no matching account/i);
  });
});
