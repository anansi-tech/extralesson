import { dbConnect, Fulfilment, Payment, Student, StripeEvent, isDuplicateKey } from '@/lib/db';
import { GRANTING_EVENTS, emailFromSession, metadataOf, scopeOfSession, verifyStripeSignature } from '@/lib/stripe-webhook';
import { grantFromPayment } from '@/lib/grant-from-payment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PAYMENT -> ACCESS. No Stripe package and no outbound call: the signed payload
 * carries everything acted on here — ROUND_2 §8c. Two records (ROUND_6 Task 2):
 * StripeEvent says the event arrived, Fulfilment says what became of the
 * session. A grant that fails answers 500 so Stripe delivers again, and the
 * redelivery retries the grant; only a granted fulfilment is a duplicate.
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
    await recordRefusal(event.id, session, scope.reason);
    return Response.json({ refused: scope.reason }, { status: 200 });
  }

  try {
    return await fulfil(event.id, session);
  } catch (e) {
    // Every write error that is not a duplicate key is a failure, and a
    // failure is a 500: Stripe delivers again, and the next attempt retries.
    const reason = e instanceof Error ? e.message : String(e);
    console.error(`[stripe] ${event.id} failed: ${reason}`);
    return Response.json({ error: reason }, { status: 500 });
  }
}

/** Refused is still a row: a payment nobody can see is the failure /admin/access exists to prevent. */
async function recordRefusal(eventId: string, session: Record<string, unknown>, reason: string): Promise<void> {
  await dbConnect();
  const sessionId = typeof session.id === 'string' ? session.id : eventId;
  try {
    await Fulfilment.create({
      session_id: sessionId,
      event_id: eventId,
      status: 'refused',
      reason,
      metadata: metadataOf(session),
      ts: new Date(),
    });
  } catch (e) {
    if (!isDuplicateKey(e)) throw e;
  }
}

async function fulfil(eventId: string, session: Record<string, unknown>): Promise<Response> {
  await dbConnect();
  const sessionId = typeof session.id === 'string' ? session.id : eventId;

  const done = await Fulfilment.findOne({ session_id: sessionId, status: 'granted' }).lean();
  if (done) return Response.json({ duplicate: true }, { status: 200 });

  try {
    await StripeEvent.create({ _id: eventId });
  } catch (e) {
    if (!isDuplicateKey(e)) throw e;
  }

  const read = emailFromSession(session);
  const email = read?.email ?? null;
  const student = email
    ? await Student.findOne({ email }).select('exam_sitting access').lean<{
        _id: unknown;
        exam_sitting: 'jan-2027' | 'may-june-2027';
      } | null>()
    : null;

  // The payment as evidence, once per event; /admin/access reads these.
  let payment = await Payment.findOne({ event_id: eventId }).lean<{ _id: unknown } | null>();
  if (!payment) {
    try {
      payment = await Payment.create({
        event_id: eventId,
        email,
        amount_total: typeof session.amount_total === 'number' ? session.amount_total : undefined,
        currency: typeof session.currency === 'string' ? session.currency : undefined,
        email_source: read?.source,
        student_id: student?._id,
      });
    } catch (e) {
      if (!isDuplicateKey(e)) throw e;
      payment = await Payment.findOne({ event_id: eventId }).lean<{ _id: unknown }>();
    }
  }

  const open = await Fulfilment.findOne({ session_id: sessionId }).lean<{ _id: unknown; status: string } | null>();
  let fulfilmentId: unknown = open?._id;
  if (!open) {
    try {
      fulfilmentId = (await Fulfilment.create({ session_id: sessionId, event_id: eventId, payment_id: payment!._id, status: 'pending', ts: new Date() }))._id;
    } catch (e) {
      // A concurrent delivery holds the session: it is doing this.
      if (!isDuplicateKey(e)) throw e;
      return Response.json({ duplicate: true }, { status: 200 });
    }
  }

  if (!student) {
    // Recorded, not dropped. It shows on /admin/access as unmatched — and if
    // this address registers later, register() finds it and grants there.
    return Response.json({ matched: false }, { status: 200 });
  }

  try {
    await grantFromPayment({
      studentId: student._id,
      registeredSitting: student.exam_sitting,
      payment: { _id: payment!._id, event_id: eventId, email_source: read?.source },
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    await Fulfilment.updateOne({ _id: fulfilmentId }, { $set: { status: 'failed', reason, ts: new Date() } });
    throw e;
  }
  return Response.json({ matched: true }, { status: 200 });
}
