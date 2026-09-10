import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PAYMENT_STATES, QUEUE_STATES, REFUNDABLE_FROM, isRefundState, isRefundable } from '@/lib/payment-state';
import { attemptFor, refundStatusChange, type RefundAttempt } from '@/lib/refund-state';
import { grantFor, hasAccess } from '@/lib/access';

// ROUND_12 Task 1. The states and the two event rules. Nothing calls any of it
// yet: this is the shape the refund operation will be built on.
const SITTING = 'may-june-2027';
const attempt = (over: Partial<RefundAttempt> = {}): RefundAttempt => ({
  key: 'k1',
  at: new Date('2026-09-09T10:00:00Z'),
  outcome: 'unknown',
  ...over,
});
const approved = (attempts: RefundAttempt[], state = 'refund_approved') => ({ state, refund_attempts: attempts });

describe('what a refund can reach', () => {
  it('is every paid state, and only those', () => {
    expect(REFUNDABLE_FROM).toEqual(['granted', 'waiting', 'duplicate']);
    for (const state of PAYMENT_STATES) {
      // waiting and duplicate are money held with no grant to revoke; the rest
      // were never paid, or this operation has already reached them.
      expect(isRefundable(state), state).toBe(['granted', 'waiting', 'duplicate'].includes(state));
    }
    expect(isRefundable(undefined)).toBe(false);
  });
  it('adds three states, and the two that need finishing sit on the queue', () => {
    for (const state of ['refund_approved', 'refunded', 'refund_failed']) {
      expect(PAYMENT_STATES).toContain(state);
      expect(isRefundState(state), state).toBe(true);
    }
    expect(QUEUE_STATES).toEqual(['waiting', 'duplicate', 'refund_approved', 'refund_failed']);
    // Refunded is settled: it is not work.
    expect(QUEUE_STATES).not.toContain('refunded');
    expect(isRefundState('granted')).toBe(false);
  });
});

describe('a revoked grant', () => {
  const live = { sitting: SITTING, granted_at: new Date('2026-09-01'), source: 'stripe', note: 'stripe evt_1' };
  const revoked = { ...live, revoked_at: new Date('2026-09-09'), revoked_by: 'ops@example.com', revoked_reason: 'refunded' };

  it('reads as no access, whatever the sitting says', () => {
    expect(hasAccess(live)).toBe(true);
    expect(hasAccess(revoked)).toBe(false);
    // Not expiry: the sitting is still open, and the service stops anyway.
    expect(hasAccess(revoked, new Date('2026-09-10'))).toBe(false);
  });

  it('is still returned, so a screen can say what happened and when', () => {
    expect(grantFor(revoked, SITTING)).toEqual(revoked);
    expect(grantFor(revoked, SITTING)!.revoked_reason).toBe('refunded');
    expect(grantFor(revoked, 'jan-2028')).toBeNull();
  });
});

describe('a refund-status event', () => {
  it('never starts a refund nobody approved', () => {
    for (const state of ['granted', 'waiting', 'duplicate', 'closed', 'refused', undefined]) {
      expect(
        refundStatusChange({ state, refund_attempts: [attempt({ refund_id: 're_1' })] }, { refund_id: 're_1', outcome: 'succeeded' }),
        String(state),
      ).toBeNull();
    }
  });

  it('binds by refund id, then by the key we wrote into the metadata, and adopts nothing else', () => {
    const attempts = [attempt({ key: 'k1', refund_id: 're_1' }), attempt({ key: 'k2' })];
    expect(attemptFor(attempts, { refund_id: 're_1', outcome: 'succeeded' })).toBe(0);
    expect(attemptFor(attempts, { refund_id: 're_unknown', outcome: 'succeeded', key: 'k2' })).toBe(1);
    // A refund on the same intent that is neither ours by id nor by key: somebody
    // else's act, in the dashboard, and never adopted as this operation's.
    expect(attemptFor(attempts, { refund_id: 're_dashboard', outcome: 'succeeded' })).toBe(-1);
    expect(refundStatusChange(approved(attempts), { refund_id: 're_dashboard', outcome: 'succeeded' })).toBeNull();
  });

  it('accepted means committed: succeeded and pending both refund', () => {
    const attempts = [attempt({ refund_id: 're_1' })];
    for (const outcome of ['succeeded', 'pending'] as const) {
      const change = refundStatusChange(approved(attempts), { refund_id: 're_1', outcome })!;
      expect(change.state, outcome).toBe('refunded');
      expect(change.attempt.outcome, outcome).toBe(outcome);
    }
  });

  it('rejected, or failed after acceptance, puts it back in front of a person', () => {
    const attempts = [attempt({ refund_id: 're_1', outcome: 'succeeded' })];
    for (const outcome of ['failed', 'canceled'] as const) {
      const change = refundStatusChange({ state: 'refunded', refund_attempts: attempts }, { refund_id: 're_1', outcome })!;
      expect(change.state, outcome).toBe('refund_failed');
    }
  });

  it('a delayed failure from a superseded attempt updates that attempt and moves nothing', () => {
    // The first attempt failed and was retried under a new key; the retry succeeded.
    const attempts = [attempt({ key: 'k1', refund_id: 're_old' }), attempt({ key: 'k2', refund_id: 're_new', outcome: 'succeeded' })];
    const change = refundStatusChange({ state: 'refunded', refund_attempts: attempts }, { refund_id: 're_old', outcome: 'failed' })!;

    expect(change.index).toBe(0);
    expect(change.attempt.outcome).toBe('failed');
    // The payment rests on the second attempt, so the succeeded refund and its
    // revocation are left exactly as they are.
    expect(change.state).toBeUndefined();
  });

  it('an older pending never undoes an outcome already recorded', () => {
    for (const settled of ['failed', 'succeeded', 'canceled'] as const) {
      const attempts = [attempt({ refund_id: 're_1', outcome: settled })];
      expect(refundStatusChange(approved(attempts, 'refund_failed'), { refund_id: 're_1', outcome: 'pending' }), settled).toBeNull();
    }
    // On an attempt with no outcome yet, pending is news.
    const fresh = [attempt({ refund_id: 're_1' })];
    expect(refundStatusChange(approved(fresh), { refund_id: 're_1', outcome: 'pending' })!.state).toBe('refunded');
  });

  it('keeps the refund id an attempt already carried, and records Stripe’s own word', () => {
    const attempts = [attempt({ refund_id: 're_1' })];
    const change = refundStatusChange(approved(attempts), { refund_id: 're_1', outcome: 'succeeded' })!;
    expect(change.attempt).toMatchObject({ key: 'k1', refund_id: 're_1', outcome: 'succeeded', status: 'succeeded' });
  });
});

describe('a checkout event', () => {
  it('cannot reach a refund state: the webhook acts only on a waiting payment', () => {
    const route = readFileSync(join(process.cwd(), 'app', 'api', 'stripe', 'webhook', 'route.ts'), 'utf8');
    expect(route).toContain("if (payment.state !== 'waiting') return Response.json({ duplicate: true }");
    // The one transition it makes is conditional on the state it reads.
    expect(route).toContain("{ _id: payment._id, state: 'pending' }");
    // It names no refund state and reads no refund rule: it cannot write one.
    for (const token of ['refund_approved', 'refunded', 'refund_failed', 'refundStatusChange', 'refund_attempts']) {
      expect(route, token).not.toContain(token);
    }
  });
});

describe('nothing calls it yet', () => {
  it('the states and the rule are declared, and no caller reaches for them', () => {
    const at = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
    for (const f of [['app', 'admin', 'access', 'actions.ts'], ['app', 'admin', 'access', 'payment-queue.tsx'], ['lib', 'claim.ts']]) {
      expect(at(...f), f.join('/')).not.toMatch(/refundStatusChange|refund_attempts|revoked_at/);
    }
  });
});
