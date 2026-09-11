'use client';

import { useState } from 'react';
import type { AccountRow } from '@/lib/admin/account-view';
import { CAPS, FIELD, INK, QUIET } from '../ui';
import { refundPayment, revokeGrant } from './actions';

/**
 * THE LIST, WITH ONE ROW OPEN (ROUND_13 Task 1). A closed row holds no input at
 * all — not a hidden one, none — because a page of fields before anybody has
 * decided anything is a page you read past. Opening a second row closes the
 * first, so the list never grows under the thumb, and it reveals below the line
 * without reordering anything.
 *
 * Everything shown is built on the server (lib/admin/account-view). This file
 * imports no module that reaches the database; the actions it posts to are a
 * 'use server' boundary, which is the one way across.
 */
const WORD_COLOUR: Record<AccountRow['word'], string> = {
  access: 'text-green-pen',
  revoked: 'text-red-pen',
  'free used': 'text-red-pen',
  'free tier': 'text-dim',
};

export function AccountRows({ rows, empty }: { rows: AccountRow[]; empty: string }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (rows.length === 0) return <p className="mt-2 font-mono text-[11px] leading-relaxed text-dim">{empty}</p>;

  return (
    <ul className="mt-2">
      {rows.map((row) => {
        const open = openId === row.id;
        return (
          <li key={row.id} className={open ? 'border-l-3 border-ink bg-paper-deep/40 py-2 pl-3' : 'border-b border-rule'}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : row.id)}
              className="flex min-h-11 w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-left"
            >
              <span className="min-w-0 break-all font-mono text-[13px]">{row.email}</span>
              <span className="flex shrink-0 items-baseline gap-3 font-mono text-[11px]">
                <span className="text-dim">{row.sitting}</span>
                {/* One of three words, at a fixed width, so the column reads down. */}
                <span className={`inline-block w-[72px] text-right uppercase tracking-[0.1em] ${WORD_COLOUR[row.word]}`}>{row.word}</span>
              </span>
            </button>

            {open && (
              <div className="pb-1">
                <div className="font-mono text-[11px] leading-relaxed text-dim">
                  {row.name} · entered for {row.enteredFor}
                </div>
                <div className="font-mono text-[11px] leading-relaxed text-dim">
                  {row.sessions} session{row.sessions === 1 ? '' : 's'} · {row.attempts} question{row.attempts === 1 ? '' : 's'}
                </div>

                {row.current && (
                  <>
                    <div className={`${CAPS} mt-3 text-ink`}>Current access</div>
                    <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[11px] leading-relaxed">
                      <Pair label="Access for" value={row.current.accessFor} />
                      <Pair label="Class" value={row.current.klass} />
                      <Pair label="Granted" value={row.current.granted} />
                      <Pair label={row.current.reasonLabel === 'NOTE' ? 'Note' : 'Reason'} value={row.current.reason || 'none recorded'} />
                    </dl>
                  </>
                )}

                {row.current && (
                  <details className="mt-2">
                    <summary className={`${CAPS} cursor-pointer text-dim`}>
                      Previous access {row.prior.length ? `· ${row.prior.length}` : '· none'}
                    </summary>
                    {row.prior.map((p, i) => (
                      <dl key={i} className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 border-l-3 border-rule pl-3 font-mono text-[11px] leading-relaxed">
                        <Pair label="Access for" value={`${p.sitting} · ${p.source}`} />
                        <Pair label="Note" value={p.note || 'no note'} />
                      </dl>
                    ))}
                  </details>
                )}

                {row.revoked && <p className="mt-2 font-mono text-[11px] leading-relaxed text-red-pen">{row.revoked}</p>}

                {row.control?.kind === 'refund' && (
                  <form action={refundPayment} className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <input type="hidden" name="id" value={row.control.paymentId} />
                    <span className="w-full font-mono text-[11px] leading-relaxed text-dim">
                      {row.control.sentence}{' '}
                      {row.control.link && (
                        <a href={row.control.link} target="_blank" rel="noopener" className="underline underline-offset-[3px]">
                          This payment at Stripe
                        </a>
                      )}
                    </span>
                    <input name="reason" required minLength={3} placeholder="why: asked within the window · duplicate charge" className={`${FIELD} w-full min-w-0 sm:w-auto sm:flex-1`} />
                    <button className={`${INK} w-full text-sm sm:w-auto`}>Refund and revoke</button>
                  </form>
                )}

                {row.control?.kind === 'revoke' && (
                  <form action={revokeGrant} className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <input type="hidden" name="id" value={row.id} />
                    <span className="w-full font-mono text-[11px] leading-relaxed text-dim">{row.control.sentence}</span>
                    <input name="reason" required minLength={3} placeholder="why: the pilot ended · granted in error" className={`${FIELD} w-full min-w-0 sm:w-auto sm:flex-1`} />
                    <button className={`${QUIET} w-full text-left sm:w-auto`}>Revoke</button>
                  </form>
                )}

                {row.control?.kind === 'revoke-unresolved' && (
                  <>
                    {/* ABOVE the control, not beside it: you need to know the
                        refund is unavailable before deciding that revoking
                        alone is the right move. */}
                    <p className="mt-3 border-l-3 border-amber bg-amber-tint px-3 py-2 font-mono text-[11px] leading-relaxed">
                      {row.control.warning}{' '}
                      <a href={row.control.link} target="_blank" rel="noopener" className="underline underline-offset-[3px]">
                        This account&rsquo;s payments at Stripe
                      </a>
                    </p>
                    <form action={revokeGrant} className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                      <input type="hidden" name="id" value={row.id} />
                      <input name="reason" required minLength={3} placeholder="why: refunded at Stripe on 2026-09-10" className={`${FIELD} w-full min-w-0 sm:w-auto sm:flex-1`} />
                      <button className={`${QUIET} w-full text-left sm:w-auto`}>Revoke</button>
                    </form>
                  </>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="uppercase tracking-[0.1em] text-dim">{label}</dt>
      <dd className="min-w-0 break-all text-ink">{value}</dd>
    </>
  );
}
