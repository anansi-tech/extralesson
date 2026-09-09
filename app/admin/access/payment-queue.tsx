import { closePayment, grantQueued } from './actions';
import { FIELD, INK, QUIET, ROW } from '@/app/admin/ui';
import { amountLine, type QueueRow } from '@/lib/payment-queue';

/**
 * PAYMENTS THAT NEED YOU (ROUND_11 Task 4): the one list, derived from the
 * one record. A row says what state its money is in, whose address the
 * session carried, and how much — then carries the only two things a person
 * can do about it. Nothing here links anywhere: the work is on the row.
 */
export function PaymentQueue({ rows }: { rows: QueueRow[] }) {
  return (
    <section className="mb-6 border-[1.5px] border-ink bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="section-label">Payments that need you</div>
        <span className="font-mono text-[11px] text-dim">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <p className="mt-2 font-mono text-[11px] text-dim">Nothing waiting. Every payment has reached an account or been closed.</p>
      ) : (
        <ul className="mt-2">
          {rows.map((r) => (
            <li key={r.id} className={ROW}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[12px]">
                <span className="font-bold uppercase tracking-[0.14em]">{r.state}</span>
                <span className="min-w-0 break-all">{r.email ?? 'missing/invalid'}</span>
                <span className="text-dim">{amountLine(r)}</span>
                <span className="text-dim">{new Date(r.received_at).toISOString().slice(0, 10)}</span>
              </div>
              {r.state_reason && <div className="mt-0.5 font-mono text-[11px] text-dim">{r.state_reason}</div>}

              {r.state === 'waiting' && (
                <form action={grantQueued} className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <input type="hidden" name="id" value={r.id} />
                  <input name="email" type="email" required placeholder="the account that should have it" className={`${FIELD} w-full min-w-0 sm:w-auto sm:flex-1`} />
                  <button className={`${INK} w-full text-sm sm:w-auto`}>Grant to this account</button>
                </form>
              )}

              {r.state === 'duplicate' && (
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-dim">
                  That account&rsquo;s sitting was already covered, so nothing was granted and the grant it had is untouched.
                  Refund this one in Stripe — closing it here moves no money.
                </p>
              )}

              <form action={closePayment} className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <input type="hidden" name="id" value={r.id} />
                <input name="reason" required minLength={3} placeholder="why: refunded · duplicate · test payment" className={`${FIELD} w-full min-w-0 sm:w-auto sm:flex-1`} />
                <button className={`${QUIET} w-full text-left sm:w-auto`}>{r.state === 'duplicate' ? 'Close (refunded)' : 'Close'}</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
