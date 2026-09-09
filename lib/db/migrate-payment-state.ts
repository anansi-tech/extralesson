import { Fulfilment, Payment } from './index';
import type { PaymentState } from '@/lib/payment-state';

/**
 * ONE RECORD, DERIVED FROM THE THREE (ROUND_11 Task 5). Every existing
 * Payment takes a state by EXPLICIT PRECEDENCE — never by whether a student
 * happens to hold access, which would read the entitlement as evidence of
 * what happened to the money and get a comp exactly backwards.
 */
export interface Derived {
  state: PaymentState;
  reason?: string;
  closed_by?: string;
  /** Which rule decided it, so a count can be argued with. */
  by: 'resolved_at' | 'fulfilment' | 'default';
}

export interface Ambiguity {
  id: string;
  session_id: string | null;
  why: string;
  /** Enough to act on with the id, and never the address: some of these are deleted accounts. */
  detail?: string;
}

export interface FulfilmentRow {
  _id: unknown;
  session_id: string;
  status: string;
  reason?: string;
  payment_id?: unknown;
  ts: Date;
}
export interface PaymentRow {
  _id: unknown;
  session_id?: string;
  state?: string;
  event_id: string;
  note?: string;
  closed_by?: string;
  resolved_at?: Date;
  amount_total?: number;
  currency?: string;
  student_id?: unknown;
  received_at?: Date;
}

/** A line about a payment that names no person. */
export function describe(p: PaymentRow): string {
  const money = typeof p.amount_total === 'number' ? `${(p.amount_total / 100).toFixed(2)} ${(p.currency ?? '').toUpperCase()}` : 'amount unknown';
  return [
    p.received_at ? p.received_at.toISOString().slice(0, 10) : 'no date',
    money,
    p.student_id ? 'matched to an account' : 'matched to nobody',
    p.resolved_at ? 'resolved by hand' : 'not resolved',
  ].join(' · ');
}

/** The reason a person typed when they closed it, as resolvePayment wrote it. */
export function reasonFromNote(note: string | undefined): string | undefined {
  const match = /^resolved:\s*([\s\S]+)$/.exec(note?.trim() ?? '');
  return match ? match[1].trim() : undefined;
}

/**
 * The precedence, in order. A fulfilment status this does not know is not
 * guessed at: the caller reports it as ambiguous and the migration stops
 * short of deleting anything.
 */
export function deriveState(payment: PaymentRow | null, fulfilment: FulfilmentRow | null): Derived | { ambiguous: string } {
  // 1. Closed by a person, carrying what they said and who they were.
  if (payment?.resolved_at) {
    return { state: 'closed', reason: reasonFromNote(payment.note), closed_by: payment.closed_by, by: 'resolved_at' };
  }
  if (fulfilment) {
    switch (fulfilment.status) {
      // 2. A payment for a sitting the account already had.
      case 'duplicate':
        return { state: 'duplicate', reason: fulfilment.reason, by: 'fulfilment' };
      // 3. Not ours — except not-paid, which is a delayed payment method and
      //    must not be stranded in a terminal state.
      case 'refused':
        return fulfilment.reason === 'not-paid'
          ? { state: 'pending', reason: 'awaiting payment confirmation', by: 'fulfilment' }
          : { state: 'refused', reason: fulfilment.reason, by: 'fulfilment' };
      // 4. Access assigned.
      case 'granted':
        return { state: 'granted', by: 'fulfilment' };
      // 5. Unfinished processing, which is not unpaid.
      case 'pending':
        return { state: 'waiting', by: 'fulfilment' };
      // Written after the spec: the webhook saying the address had no account,
      // and a person closing a payment from the screen.
      case 'unmatched':
        return { state: 'waiting', reason: fulfilment.reason, by: 'fulfilment' };
      case 'resolved':
        return { state: 'closed', reason: fulfilment.reason, by: 'fulfilment' };
      default:
        return { ambiguous: `fulfilment status '${fulfilment.status}' has no rule` };
    }
  }
  // 6. Otherwise.
  return { state: 'waiting', by: 'default' };
}

/**
 * A KEY FOR A ROW THAT PREDATES SESSION TRACKING. Six payments were taken
 * before Fulfilment existed, so nothing recorded which checkout session they
 * came from and nothing ever will. They are keyed by the event that carried
 * them, marked as what they are, so `session_id` can become required with a
 * full unique index at the cutover rather than waiting on records that cannot
 * be recovered. Nothing reads a session id back to Stripe.
 */
export const LEGACY_KEY_PREFIX = 'legacy:';
export const legacyKey = (eventId: string) => `${LEGACY_KEY_PREFIX}${eventId}`;

export interface Plan {
  /** Everything there is, so a count can be read against a total. */
  totals: { payments: number; fulfilments: number };
  /** What would be written to an existing Payment. */
  updates: { id: string; session_id: string; synthetic?: true; derived: Derived }[];
  /** A Fulfilment with no Payment: the money was never recorded as one. */
  creates: { session_id: string; event_id: string; derived: Derived }[];
  /** Rows a live transition has already settled; the migration leaves them alone. */
  live: { id: string; state: string }[];
  /** Payments with no Fulfilment to link to, by id. */
  noFulfilment: { id: string; session_id: string | null; event_id: string }[];
  ambiguous: Ambiguity[];
  counts: Record<string, number>;
}

/**
 * Reads only. Restartable and conditional by construction: a Payment that
 * already carries a state was settled by a live transition after this data
 * was written, and is never overwritten — re-running plans nothing for it.
 */
export async function planMigration(): Promise<Plan> {
  const payments = await Payment.find({})
    .select('session_id state event_id note closed_by resolved_at amount_total currency student_id received_at')
    .lean<PaymentRow[]>();
  const fulfilments = await Fulfilment.find({}).select('session_id status reason payment_id ts').lean<FulfilmentRow[]>();

  const byPayment = new Map<string, FulfilmentRow[]>();
  const unlinked: FulfilmentRow[] = [];
  for (const f of fulfilments) {
    const key = f.payment_id ? String(f.payment_id) : null;
    if (!key) unlinked.push(f);
    else byPayment.set(key, [...(byPayment.get(key) ?? []), f]);
  }

  const plan: Plan = { totals: { payments: payments.length, fulfilments: fulfilments.length }, updates: [], creates: [], live: [], noFulfilment: [], ambiguous: [], counts: {} };
  const seenPayments = new Set<string>();

  for (const p of payments) {
    const id = String(p._id);
    seenPayments.add(id);
    const linked = byPayment.get(id) ?? [];
    if (linked.length > 1) {
      plan.ambiguous.push({ id, session_id: p.session_id ?? null, why: `${linked.length} fulfilments point at this payment`, detail: describe(p) });
      continue;
    }
    // A live transition already settled it: never overwritten (rollout order),
    // and not reported either — the report is what the migration will decide.
    if (p.state) {
      plan.live.push({ id, state: p.state });
      continue;
    }
    const fulfilment = linked[0] ?? null;
    if (!fulfilment) plan.noFulfilment.push({ id, session_id: p.session_id ?? null, event_id: p.event_id });
    const derived = deriveState(p, fulfilment);
    if ('ambiguous' in derived) {
      plan.ambiguous.push({ id, session_id: p.session_id ?? null, why: derived.ambiguous, detail: describe(p) });
      continue;
    }
    // The session id comes from the Fulfilment where the Payment has none, and
    // from the event where neither has one: a row older than session tracking.
    const known = p.session_id ?? fulfilment?.session_id ?? null;
    const session_id = known ?? legacyKey(p.event_id);
    plan.updates.push({ id, session_id, ...(known ? {} : { synthetic: true as const }), derived });
    plan.counts[derived.state] = (plan.counts[derived.state] ?? 0) + 1;
  }

  // A Fulfilment whose Payment is gone, or that never had one: a refused
  // session wrote no Payment at all, and the money still has to be accounted for.
  for (const f of fulfilments) {
    const linkedTo = f.payment_id ? String(f.payment_id) : null;
    if (linkedTo && seenPayments.has(linkedTo)) continue;
    if (!linkedTo && payments.some((p) => p.session_id === f.session_id)) continue;
    const derived = deriveState(null, f);
    if ('ambiguous' in derived) {
      plan.ambiguous.push({ id: String(f._id), session_id: f.session_id, why: `fulfilment with no payment: ${derived.ambiguous}` });
      continue;
    }
    plan.creates.push({ session_id: f.session_id, event_id: `${f.session_id}`, derived });
    plan.counts[derived.state] = (plan.counts[derived.state] ?? 0) + 1;
  }
  return plan;
}

/**
 * Writes the plan. CONDITIONAL: each update matches only a Payment that still
 * has no state, so a transition committed between the plan and the write
 * wins and is not overwritten. Restartable: a second run plans nothing for a
 * row the first one settled. Ambiguity blocks nothing here — it blocks the
 * DELETION in the second commit, which is where losing a record would matter.
 */
export async function applyMigration(): Promise<{ updated: number; created: number; skipped: number }> {
  const plan = await planMigration();
  let updated = 0;
  let skipped = 0;
  for (const u of plan.updates) {
    const { state, reason, closed_by } = u.derived;
    const res = await Payment.updateOne(
      { _id: u.id, state: { $exists: false } },
      {
        $set: {
          session_id: u.session_id,
          state,
          state_at: new Date(),
          ...(reason ? { state_reason: reason } : {}),
          ...(closed_by ? { closed_by } : {}),
        },
      },
    );
    if (res.modifiedCount === 1) updated++;
    else skipped++;
  }
  let created = 0;
  for (const c of plan.creates) {
    const { state, reason } = c.derived;
    // The event id is unique and this row never had one: the session id
    // stands in, which is what it is keyed by from here on.
    const res = await Payment.updateOne(
      { session_id: c.session_id },
      {
        $setOnInsert: {
          event_id: c.event_id,
          session_id: c.session_id,
          state,
          state_at: new Date(),
          received_at: new Date(),
          ...(reason ? { state_reason: reason } : {}),
        },
      },
      { upsert: true },
    );
    if (res.upsertedCount === 1) created++;
    else skipped++;
  }
  return { updated, created, skipped };
}
