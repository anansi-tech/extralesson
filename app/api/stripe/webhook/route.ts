import { dbConnect, Payment, Student, StripeEvent, isDuplicateKey } from '@/lib/db';
import { transition } from '@/lib/payment-state';
import { GRANTING_EVENTS, NO_STUDENT_EMAIL, emailFromSession, metadataOf, paidAtOf, paymentIntentOf, scopeOfSession, verifyStripeSignature } from '@/lib/stripe-webhook';
import { claim } from '@/lib/claim';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PAYMENT -> ACCESS. No Stripe package and no outbound call: the signed payload
 * carries everything acted on here — ROUND_2 §8c. Two records (ROUND_6 Task 2):
 * StripeEvent says the event arrived; the Payment says what became of the
 * money, and is the only record of it. A grant that fails answers 500 so
 * Stripe delivers again and the redelivery retries the claim; a payment that
 * is no longer waiting is a duplicate delivery and grants nothing.
 */
export async function POST(req: Request): Promise<Response> {
  const raw = await req.text();
  const verified = verifyStripeSignature(
    raw,
    req.headers.get('stripe-signature'),
    process.env.STRIPE_WEBHOOK_SECRET,
  );
  if (!verified.ok) {
    // 400, never 200: an unverified body has told us nothing, and Stripe
    // showing the delivery as failed is the correct signal.
    return Response.json({ error: verified.reason }, { status: 400 });
  }

  const { event } = verified;
  if (!GRANTING_EVENTS.has(event.type)) {
    return Response.json({ ignored: event.type }, { status: 200 });
  }

  // Scoped before anything is written: a payment for another Anansi product,
  // a subscription, or a session not yet paid is not ours to grant.
  const session = event.data.object;
  const scope = scopeOfSession(session);
  if (!scope.ok) {
    console.warn(`[stripe] ${event.id} refused: ${scope.reason} (metadata ${JSON.stringify(metadataOf(session))})`);
    // Ours, in payment mode, and not yet paid is NOT a refusal: the money is
    // simply not here, so the payment is pending and nothing about an address
    // can move it. A delayed payment method arrives later on the same session.
    if (scope.reason === 'not-paid') await recordPending(event.id, session);
    else await recordRefusal(event.id, session, scope.reason);
    return Response.json({ refused: scope.reason }, { status: 200 });
  }

  try {
    return await fulfil(event.id, session, paidAtOf(event));
  } catch (e) {
    // Every write error that is not a duplicate key is a failure, and a
    // failure is a 500: Stripe delivers again, and the next attempt retries.
    const reason = e instanceof Error ? e.message : String(e);
    console.error(`[stripe] ${event.id} failed: ${reason}`);
    return Response.json({ error: reason }, { status: 500 });
  }
}

/**
 * An unpaid session, recorded as pending. The money has not arrived, so no
 * address and no account can move it: payment confirmation comes first,
 * always: `async_payment_succeeded` moves this same row to waiting.
 */
async function recordPending(eventId: string, session: Record<string, unknown>): Promise<void> {
  await dbConnect();
  const sessionId = typeof session.id === 'string' ? session.id : eventId;
  try {
    await Payment.create({
      event_id: eventId,
      session_id: sessionId,
      ...transition('pending', { reason: 'awaiting payment confirmation' }),
      // No paid_at: the money has not arrived, which is what pending says.
      payment_intent_id: paymentIntentOf(session),
      email: emailFromSession(session),
      amount_total: typeof session.amount_total === 'number' ? session.amount_total : undefined,
      currency: typeof session.currency === 'string' ? session.currency : undefined,
    });
  } catch (e) {
    if (!isDuplicateKey(e)) throw e;
  }
}

/**
 * A session that is not ours is still recorded: a payment nobody can see is
 * the failure /admin/access exists to prevent. `refused` is terminal.
 */
async function recordRefusal(eventId: string, session: Record<string, unknown>, reason: string): Promise<void> {
  await dbConnect();
  const sessionId = typeof session.id === 'string' ? session.id : eventId;
  // What the session said about itself goes into the reason, so a Payment Link
  // missing its metadata is seen rather than guessed at.
  const metadata = Object.entries(metadataOf(session));
  const said = metadata.length ? metadata.map(([k, v]) => `${k}=${v}`).join(' ') : 'no metadata';
  try {
    await Payment.create({
      event_id: eventId,
      session_id: sessionId,
      ...transition('refused', { reason: `${reason} · ${said}` }),
      amount_total: typeof session.amount_total === 'number' ? session.amount_total : undefined,
      currency: typeof session.currency === 'string' ? session.currency : undefined,
    });
  } catch (e) {
    if (!isDuplicateKey(e)) throw e;
  }
}

async function fulfil(eventId: string, session: Record<string, unknown>, paidAt: Date | null): Promise<Response> {
  await dbConnect();
  const sessionId = typeof session.id === 'string' ? session.id : eventId;

  try {
    await StripeEvent.create({ _id: eventId });
  } catch (e) {
    if (!isDuplicateKey(e)) throw e;
  }

  // The named field, validated. No fallback to the payer's receipt address.
  const email = emailFromSession(session);

  // THE SESSION IS THE KEY, not the event: Stripe redelivers under a new event
  // id, and a delayed payment succeeds on the session it completed unpaid.
  let payment = await Payment.findOne({ session_id: sessionId }).lean<{ _id: unknown; state: string } | null>();
  if (!payment) {
    try {
      payment = await Payment.create({
        event_id: eventId,
        session_id: sessionId,
        // Paid and ours: a session that is neither never reaches here. No
        // account holds it yet, which is what waiting means.
        ...transition('waiting', { reason: email ? undefined : NO_STUDENT_EMAIL }),
        // The references a refund needs, written from the start (ROUND_12 Task 0).
        payment_intent_id: paymentIntentOf(session),
        paid_at: paidAt,
        email,
        amount_total: typeof session.amount_total === 'number' ? session.amount_total : undefined,
        currency: typeof session.currency === 'string' ? session.currency : undefined,
      });
    } catch (e) {
      // Another delivery for this session got there first; it is the same payment.
      if (!isDuplicateKey(e)) throw e;
      payment = await Payment.findOne({ session_id: sessionId }).lean<{ _id: unknown; state: string }>();
    }
  }
  if (!payment) throw new Error(`no payment for session ${sessionId}`);

  // The money has arrived on a session that completed without it. Conditional,
  // so a delivery never regresses a state something else has already settled.
  if (payment.state === 'pending') {
    // The money arrived now, on this event: that is what paid_at means.
    await Payment.updateOne(
      { _id: payment._id, state: 'pending' },
      { $set: { ...transition('waiting', { reason: email ? undefined : NO_STUDENT_EMAIL }), payment_intent_id: paymentIntentOf(session), paid_at: paidAt } },
    );
    payment = { ...payment, state: 'waiting' };
  }
  // Settled already, by a person or by an earlier delivery: nothing to do.
  if (payment.state !== 'waiting') return Response.json({ duplicate: true }, { status: 200 });

  const student = email
    ? await Student.findOne({ email }).select('_id').lean<{ _id: unknown } | null>()
    : null;
  if (!student) {
    // Recorded, not dropped. It waits on /admin/access — and if this address
    // registers later, registration claims it there. Which reason it is
    // matters: an address with no account is a typo to chase; no address at
    // all is a Payment Link to fix.
    await Payment.updateOne(
      { _id: payment._id, state: 'waiting' },
      { $set: transition('waiting', { reason: email ? 'no account for the paying address' : NO_STUDENT_EMAIL }) },
    );
    return Response.json({ matched: false }, { status: 200 });
  }

  // ONE OPERATION assigns access, whatever calls it: the payment transition
  // and the entitlement commit together, or neither does.
  const outcome = await claim(sessionId, { id: student._id });
  return Response.json({ matched: outcome === 'granted', outcome }, { status: 200 });
}
