'use client';

import { useActionState } from 'react';
import { deleteStudentAccount, type DeleteAccountState } from './actions';
import { FAILURE, FIELD, PRIMARY } from '../ui';

// Behind two typed fields on purpose: revoking access is a click because it is
// reversible, and this is not — attempts are append-only, so no recomputation
// brings a student back. The counts render here and never to a log; an audit
// row naming the deleted address would leave the person in the database after
// they asked to leave it.
export function DeleteAccount() {
  const [state, action, pending] = useActionState<DeleteAccountState, FormData>(
    deleteStudentAccount,
    { status: 'idle' },
  );

  return (
    <section className="mt-8 border-[1.5px] border-ink bg-white p-5">
      <div className="section-label">Delete an account</div>
      <p className="mt-1 text-[13px] leading-snug">
        Everything the student has: attempts, sessions, drafts, photographs and the readings of
        them. It cannot be undone — attempts are the record every mark is folded from, so nothing
        recomputes a deleted account back. The <b>payment is kept</b> and stripped of the person:
        the money is a financial record, and the totals above stop reconciling if rows vanish from
        under them.
      </p>

      <form action={action} className="mt-3 flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
            Email address
          </span>
          <input name="email" type="email" required autoComplete="off" className={`${FIELD} mt-1 block w-64 max-w-full`} />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
            Type it again
          </span>
          <input name="confirm" type="email" required autoComplete="off" className={`${FIELD} mt-1 block w-64 max-w-full`} />
        </label>
        <button disabled={pending} className={PRIMARY}>
          {pending ? 'Deleting…' : 'Delete this account'}
        </button>
      </form>

      {state.status === 'error' && <p className={`mt-3 ${FAILURE}`}>{state.message}</p>}

      {state.status === 'done' && (
        <div className="mt-3 border-t border-paper-deep pt-3">
          <div className="font-mono text-[11px] uppercase tracking-widest text-dim">
            {state.message} {new Date(state.at).toLocaleString('en-GB')}
          </div>
          <ul className="mt-1 font-mono text-[12px]">
            {Object.entries(state.counts).map(([collection, n]) => (
              <li key={collection} className="flex justify-between gap-4">
                <span className={n === 0 ? 'text-dim' : ''}>{collection}</span>
                <span className={n === 0 ? 'text-dim' : 'font-bold'}>{n}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] leading-snug text-dim">
            No record of the address is kept. PaymentAnonymised counts rows that were KEPT — the
            link to the account and the address were removed from them and the money left alone.
          </p>
        </div>
      )}
    </section>
  );
}
