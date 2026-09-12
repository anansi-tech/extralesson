import { isComp, REFUND_DAYS, type Access } from '@/lib/access';
import { dashboardSearchUrl, dashboardUrl, windowOf } from '@/lib/payment-queue';
import type { RowControl } from './account-view';

/**
 * THE ONE CONTROL A GRANT PERMITS (ROUND_13 Task 1, on ROUND_12 Task 4). Three
 * cases and they are not interchangeable: a paid grant is refunded and revoked
 * together; a comp is revoked alone, because nothing was paid; and a paid grant
 * whose payment cannot be found says so ABOVE the control it limits, since you
 * need to know the refund is unavailable before deciding that revoking alone is
 * right. A comp is a comp because its note says so, never because a payment
 * could not be found.
 */
export function grantControl(
  r: { id: string; email: string; access?: Access | null },
  payment: { _id: unknown; paid_at?: Date; payment_intent_id?: string } | undefined,
  hasPaid: boolean,
): RowControl | null {
  {
    const access = r.access;
    if (!access || access.revoked_at) return null;
    if (payment?.payment_intent_id) {
      // THE WINDOW IS A LABEL, NOT A CLAUSE. Whether the refund is owed or is
      // the operator's own call is the first thing to know, so it reads as the
      // label of its own line rather than arriving at the end of a sentence.
      const age = windowOf(payment.paid_at ?? null);
      const days = age ? `paid ${age.days} day${age.days === 1 ? '' : 's'} ago` : '';
      return {
        kind: 'refund',
        paymentId: String(payment._id),
        window: age
          ? {
              label: age.late ? 'Outside the window' : 'Within the window',
              value: age.late
                ? `${days} · the ${REFUND_DAYS}-day window has passed — this is your call`
                : `${days} · this is owed`,
            }
          : null,
        link: dashboardUrl(payment.payment_intent_id),
      };
    }
    // Not a comp: money we cannot reach. The warning goes above the control.
    if (!isComp(access) && (access.source === 'stripe' || hasPaid)) {
      return { kind: 'revoke-unresolved', warning: 'refund unavailable — no payment reference. Refund it in the Stripe dashboard, then revoke here with the reason.', link: dashboardSearchUrl(r.email) };
    }
    return { kind: 'revoke', sentence: 'Nothing was paid, so there is nothing to give back.' };
  };
}
