'use client';

import { useState } from 'react';
import type { AccountRow } from '@/lib/admin/account-view';
import { FIELD, INK, QUIET } from '../ui';
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
/** The design rules a heading with the margin colour; it is not a box. */
const HEADING = 'inline-block border-b-[1.5px] border-margin pb-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink';
/** One column of labels, read down by every block in an open row. */
const PAIRS = 'grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[11px] leading-relaxed';
const SUMMARY = 'font-mono text-[10px] uppercase tracking-[0.1em] text-dim';

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

            {open && <OpenRow row={row} />}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * WHAT AN OPEN ROW SHOWS. Its own component so the gallery can measure it —
 * the seven rules only ever saw closed rows, and the design frames only ever
 * drew an open one that HAD a prior grant, which is how an empty disclosure
 * box went unnoticed.
 */
export function OpenRow({ row }: { row: AccountRow }) {
  return (
    <div className="pb-1">
      <div className="font-mono text-[11px] leading-relaxed text-dim">
        {row.name} · entered for {row.enteredFor}
      </div>
      <div className="font-mono text-[11px] leading-relaxed text-dim">
        {row.sessions} session{row.sessions === 1 ? '' : 's'} · {row.attempts} question{row.attempts === 1 ? '' : 's'}
      </div>

      {row.current && (
        <div className="mt-3">
          {/* A HEADING, NOT A CONTROL. CAPS is the bordered white box
              the buttons use; on a heading it drew an empty box with
              the pairs stranded outside it on the paper. The design
              rules the words themselves and keeps them with what they
              head. */}
          <div className={HEADING}>Current access</div>
          <dl className={`${PAIRS} mt-1`}>
            <Pair label="Access for" value={row.current.accessFor} />
            <Pair label="Class" value={row.current.klass} />
            <Pair label="Granted" value={row.current.granted} />
            <Pair label={row.current.reasonLabel === 'NOTE' ? 'Note' : 'Reason'} value={row.current.reason || 'none recorded'} />
          </dl>

          {/* A DISCLOSURE WITH NOTHING TO OPEN IS A LINE. An empty
              details still drew its box and its arrow, and opened on
              nothing. */}
          {row.prior.length === 0 ? (
            <p className={`${SUMMARY} mt-2`}>Previous access · none</p>
          ) : (
            <details className="mt-2">
              <summary className={`${SUMMARY} cursor-pointer underline underline-offset-[3px]`}>
                Previous access · {row.prior.length}
              </summary>
              {row.prior.map((p, i) => (
                <dl key={i} className={`${PAIRS} mt-1 border-l-3 border-rule pl-3`}>
                  <Pair label="Access for" value={`${p.sitting} · ${p.source}`} />
                  <Pair label="Note" value={p.note || 'no note'} />
                </dl>
              ))}
            </details>
          )}
        </div>
      )}

      {row.revoked && <p className="mt-2 font-mono text-[11px] leading-relaxed text-red-pen">{row.revoked}</p>}

      {row.control?.kind === 'refund' && (
        <form action={refundPayment} className="mt-3">
          <input type="hidden" name="id" value={row.control.paymentId} />
          {/* TWO LINES, IN THE COLUMN CURRENT ACCESS READS DOWN. The
              window is what the operator has to decide about, and
              what happens is the same every time — a paragraph made
              the first hard to find and the second easy to skip. */}
          <dl className={PAIRS}>
            {row.control.window && <Pair label={row.control.window.label} value={row.control.window.value} />}
            <Pair label="What happens" value="the money goes back · access ends now · their work stays" />
          </dl>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <input name="reason" required minLength={3} placeholder="why: asked within the window · duplicate charge" className={`${FIELD} w-full min-w-0 sm:w-auto sm:flex-1`} />
            <button className={`${INK} w-full text-sm sm:w-auto`}>Refund and revoke</button>
          </div>
          {/* Out of the prose and under the control: somewhere to go
              after deciding, not a word in the middle of deciding. */}
          {row.control.link && (
            <p className="mt-1 text-right">
              <a href={row.control.link} target="_blank" rel="noopener" className="font-mono text-[11px] text-dim underline underline-offset-[3px]">
                This payment at Stripe
              </a>
            </p>
          )}
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
