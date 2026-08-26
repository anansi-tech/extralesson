import { dbConnect, Payment, Student } from '@/lib/db';
import { emailFromSession, sittingFromLink, verifyStripeSignature } from '@/lib/stripe-webhook';
import { grantFromPayment } from '@/lib/grant-from-payment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PAYMENT -> ACCESS, without waiting for someone to read an inbox.
 *
 * No Stripe package and no call back to Stripe: the signed payload carries
 * everything acted on here (CLAUDE.md; ROUND_2_EXAMINER §8c). What makes this
 * safe to automate is that /admin/access already does the same job by hand, so
 * every way this can fail ends with a human resolving it there rather than with
 * a paying student stuck and no record of why.
 *
 * Always 200 once the signature is good. A 500 makes Stripe retry, and every
 * failure here is one a retry cannot fix — a wrong email is still wrong the
 * second time. The payment is recorded either way, which is the actual repair.
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
  if (event.type !== 'checkout.session.completed') {
    return Response.json({ ignored: event.type }, { status: 200 });
  }

  await dbConnect();

  // IDEMPOTENT ON THE EVENT ID. Stripe retries until it gets a 2xx, and a
  // retry after a slow response must not grant twice. The unique index is what
  // enforces it — two concurrent deliveries race, and one loses on write.
  const existing = await Payment.findOne({ event_id: event.id }).lean();
  if (existing) return Response.json({ duplicate: true }, { status: 200 });

  const session = event.data.object;
  const read = emailFromSession(session);
  const email = read?.email ?? null;
  const student = email
    ? await Student.findOne({ email }).select('exam_sitting access').lean<{
        _id: unknown;
        exam_sitting: 'jan-2027' | 'may-june-2027';
      } | null>()
    : null;

  // What the link SAYS, kept as evidence. The sitting granted is the one the
  // student registered for — see grantFromPayment for why that is not a
  // preference but an asymmetry.
  const mapped = sittingFromLink(session, process.env.STRIPE_LINK_SITTINGS);

  let created;
  try {
    created = await Payment.create({
      event_id: event.id,
      email,
      amount_total: typeof session.amount_total === 'number' ? session.amount_total : undefined,
      currency: typeof session.currency === 'string' ? session.currency : undefined,
      sitting: mapped ?? undefined,
      email_source: read?.source,
      student_id: student?._id,
    });
  } catch {
    // Unique index tripped by a concurrent delivery: the other one is doing it.
    return Response.json({ duplicate: true }, { status: 200 });
  }

  if (!student) {
    // Recorded, not dropped. It shows on /admin/access as unmatched — and if
    // this address registers later, register() finds it and grants there.
    return Response.json({ matched: false }, { status: 200 });
  }

  // The same grant register() performs in the other ordering.
  await grantFromPayment({
    studentId: student._id,
    registeredSitting: student.exam_sitting,
    payment: {
      _id: created._id,
      event_id: event.id,
      sitting: mapped,
      email_source: read?.source,
    },
  });
  return Response.json({ matched: true }, { status: 200 });
}
