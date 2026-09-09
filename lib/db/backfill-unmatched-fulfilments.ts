import { Fulfilment, Payment } from './index';

/** A pending fulfilment older than this was never going to finish on its own. */
export const STALE_PENDING_MS = 60 * 60 * 1000;

/**
 * Same-commit backfill for the 'unmatched' status: a fulfilment left pending
 * because the paying address had no account. Written before the webhook said
 * so, these read as a webhook that had not finished. A pending fulfilment
 * whose payment DID match an account is a genuine stale one and is left alone.
 */
export async function backfillUnmatchedFulfilments(now: Date = new Date()): Promise<{ marked: number }> {
  const stale = await Fulfilment.find({ status: 'pending', ts: { $lt: new Date(now.getTime() - STALE_PENDING_MS) } })
    .select('payment_id')
    .lean<{ _id: unknown; payment_id?: unknown }[]>();
  let marked = 0;
  for (const f of stale) {
    if (!f.payment_id) continue;
    const payment = await Payment.findById(f.payment_id).select('student_id').lean<{ student_id?: unknown } | null>();
    if (!payment || payment.student_id) continue;
    await Fulfilment.updateOne(
      { _id: f._id },
      { $set: { status: 'unmatched', reason: 'no account for the paying address', ts: new Date() } },
    );
    marked++;
  }
  return { marked };
}
