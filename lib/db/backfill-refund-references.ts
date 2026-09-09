import { Payment, Student } from './index';
import { LEGACY_PREFIX } from '@/lib/payment-state';
import { StripeError, stripeGet, type CheckoutSession, type StripeEventObject } from '@/lib/stripe-api';
import { paymentIntentOf } from '@/lib/stripe-webhook';

/**
 * THE REFERENCES A REFUND NEEDS, for rows written before ROUND_12 (Task 0).
 *
 * Two of them can only come from Stripe: a refund is created on a payment
 * intent, and the moment payment was confirmed is Stripe's own. The third is
 * provable from what we already hold, and is resolved here rather than
 * guessed: a grant's note carries the event id of the payment that bought it,
 * because that is what the grant path has always written.
 *
 * NOTHING IS INFERRED. A grant is never linked to a student's latest payment,
 * a `legacy:` key is never treated as a checkout session, and a paid grant
 * whose payment cannot be resolved is reported rather than read as a comp.
 */
export interface PaymentGap {
  id: string;
  session_id: string;
  /** Legacy rows are keyed by their event and were never checkout sessions. */
  kind: 'session' | 'legacy-event';
  /** What Stripe must be asked about: a session id, or an event id. */
  lookup: string;
  state: string;
  needs: ('payment_intent_id' | 'paid_at')[];
}

export interface GrantLink {
  studentId: string;
  source: string;
  /** The payment the note proves it was bought with. */
  paymentId?: string;
  /** Why it could not be linked, when it could not. */
  why?: string;
  /** Whether the account has payments at all: a grant with none cannot be a refund's. */
  paymentsOnAccount: number;
}

export interface RefundReferencePlan {
  totals: { payments: number; grants: number };
  /** Payments still missing a reference, and what Stripe must be asked. */
  gaps: PaymentGap[];
  /** Grants whose payment is provable from the note that names it. */
  links: GrantLink[];
  /** Comps: no payment, and none is wanted. */
  comps: GrantLink[];
  /**
   * A grant that is neither linked nor a comp by its own note. Split, because
   * the two are different problems: an account with payments has a paid grant
   * whose payment cannot be resolved — never read as a comp — while an account
   * with none has a grant nobody can refund anyway.
   */
  unresolvedGrants: GrantLink[];
  unlabelledGrants: GrantLink[];
}

/**
 * The event a grant note NAMES. The claim writes `stripe evt_…`, and an
 * operator granting by hand has written the event id beside their reason. Both
 * are a person or a path stating which payment this grant is for; neither is
 * an inference from the account's payment history.
 */
export function eventIdInNote(note: string | undefined): string | null {
  const match = /\b(evt_[A-Za-z0-9]+)/.exec(note ?? '');
  return match ? match[1] : null;
}

/** A comp says so in its own note, by the convention /admin/access states. */
export const isCompNote = (note: string | undefined) => /^comp\b/.test((note ?? '').trim());

export async function planRefundReferences(): Promise<RefundReferencePlan> {
  const payments = await Payment.find({})
    .select('session_id state payment_intent_id paid_at event_id student_id')
    .lean<{ _id: unknown; session_id: string; state: string; payment_intent_id?: string; paid_at?: Date; event_id: string; student_id?: unknown }[]>();
  const students = await Student.find({ access: { $exists: true } })
    .select('access')
    .lean<{ _id: unknown; access?: { source: string; note?: string; payment_id?: unknown } }[]>();

  const byEvent = new Map(payments.map((p) => [p.event_id, p]));

  const gaps: PaymentGap[] = [];
  for (const p of payments) {
    const needs: PaymentGap['needs'] = [];
    if (!p.payment_intent_id) needs.push('payment_intent_id');
    // A payment that was never paid has no moment of payment to record.
    if (!p.paid_at && p.state !== 'refused' && p.state !== 'pending') needs.push('paid_at');
    if (needs.length === 0) continue;
    const legacy = p.session_id.startsWith(LEGACY_PREFIX);
    gaps.push({
      id: String(p._id),
      session_id: p.session_id,
      kind: legacy ? 'legacy-event' : 'session',
      lookup: legacy ? p.session_id.slice(LEGACY_PREFIX.length) : p.session_id,
      state: p.state,
      needs,
    });
  }

  const paymentsBy = payments.reduce<Record<string, number>>((a, p) => (p.student_id ? { ...a, [String(p.student_id)]: (a[String(p.student_id)] ?? 0) + 1 } : a), {});

  const links: GrantLink[] = [];
  const comps: GrantLink[] = [];
  const unresolvedGrants: GrantLink[] = [];
  const unlabelledGrants: GrantLink[] = [];
  for (const s of students) {
    const access = s.access;
    if (!access) continue;
    const studentId = String(s._id);
    const row: GrantLink = { studentId, source: access.source, paymentsOnAccount: paymentsBy[studentId] ?? 0 };
    if (access.payment_id) continue; // already linked
    if (isCompNote(access.note)) {
      comps.push(row);
      continue;
    }
    const eventId = eventIdInNote(access.note);
    const payment = eventId ? byEvent.get(eventId) : undefined;
    // Named, and not another student's: an operator's note is a statement, but
    // a payment already matched to somebody else is not this grant's.
    const belongsElsewhere = payment?.student_id && String(payment.student_id) !== studentId;
    if (payment && !belongsElsewhere) {
      links.push({ ...row, paymentId: String(payment._id) });
      continue;
    }
    const why = !eventId
      ? 'the note names no payment'
      : !payment
        ? `note names ${eventId}, which no payment carries`
        : `note names ${eventId}, which is matched to another account`;
    (row.paymentsOnAccount > 0 ? unresolvedGrants : unlabelledGrants).push({ ...row, why });
  }

  return { totals: { payments: payments.length, grants: students.length }, gaps, links, comps, unresolvedGrants, unlabelledGrants };
}

/**
 * Writes only what is provable: the grant links. The two Stripe references are
 * not written here — resolving them needs an API key, and a value invented
 * locally would be worse than an empty field a screen can report.
 */
export async function applyGrantLinks(): Promise<{ linked: number }> {
  const plan = await planRefundReferences();
  let linked = 0;
  for (const l of plan.links) {
    const res = await Student.updateOne(
      { _id: l.studentId, 'access.payment_id': { $exists: false } },
      { $set: { 'access.payment_id': l.paymentId } },
    );
    if (res.modifiedCount === 1) linked++;
  }
  return { linked };
}

export interface Resolved {
  id: string;
  payment_intent_id?: string;
  paid_at?: Date;
  /** Why one or both could not be read, when they could not. */
  why?: string;
}

/** The charge is when the money moved; the intent's own creation is not. */
function chargeCreated(session: CheckoutSession): number | null {
  const pi = session.payment_intent;
  if (!pi || typeof pi === 'string') return null;
  const charge = pi.latest_charge;
  if (charge && typeof charge === 'object' && typeof charge.created === 'number') return charge.created;
  return null;
}

/**
 * Asks Stripe for what only Stripe knows. A row keyed by a session is read as a
 * session; a `legacy:` row is read as the EVENT it is keyed by, because it never
 * was a session and asking for one would 404 on every one of them.
 */
export async function resolveFromStripe(gap: PaymentGap): Promise<Resolved> {
  try {
    if (gap.kind === 'legacy-event') {
      const event = await stripeGet<StripeEventObject>(`/events/${gap.lookup}`);
      const session = event.data.object;
      const intent = paymentIntentOf(session);
      // The event that said the money arrived is the moment it did, which is
      // what the webhook writes for every payment taken since.
      return { id: gap.id, payment_intent_id: intent ?? undefined, paid_at: new Date(event.created * 1000), why: intent ? undefined : 'the event carried no payment intent' };
    }
    const session = await stripeGet<CheckoutSession>(`/checkout/sessions/${gap.lookup}`, {
      'expand[]': 'payment_intent.latest_charge',
    });
    const intent = paymentIntentOf(session as unknown as Record<string, unknown>);
    const created = chargeCreated(session);
    const why = [!intent && 'no payment intent on the session', !created && 'no charge to date the payment from']
      .filter(Boolean)
      .join('; ');
    return {
      id: gap.id,
      payment_intent_id: intent ?? undefined,
      paid_at: created ? new Date(created * 1000) : undefined,
      why: why || undefined,
    };
  } catch (e) {
    const why = e instanceof StripeError ? `${e.status} ${e.code ?? ''} ${e.message}`.trim() : String(e);
    return { id: gap.id, why };
  }
}

/**
 * Writes what Stripe answered, and only that. EACH FIELD IS CONDITIONAL ON
 * ITSELF: a value written since — by the webhook, on a redelivery — is never
 * overwritten by an older read, and a row that gained one field still gains
 * the other it lacked.
 */
export async function applyStripeReferences(gaps: PaymentGap[]): Promise<{ resolved: Resolved[]; written: number }> {
  const resolved: Resolved[] = [];
  let written = 0;
  for (const gap of gaps) {
    const r = await resolveFromStripe(gap);
    resolved.push(r);
    let touched = false;
    for (const [field, value] of [['payment_intent_id', r.payment_intent_id], ['paid_at', r.paid_at]] as const) {
      if (!value) continue;
      const res = await Payment.updateOne({ _id: gap.id, [field]: { $exists: false } }, { $set: { [field]: value } });
      if (res.modifiedCount === 1) touched = true;
    }
    if (touched) written++;
  }
  return { resolved, written };
}
