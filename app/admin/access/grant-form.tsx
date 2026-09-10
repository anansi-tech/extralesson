'use client';

import { useState, useTransition } from 'react';
import { SITTINGS, SITTING_IDS } from '@/lib/sittings';
import { FIELD, INK, SELECT } from '../ui';
import { grantAccess, sittingFor } from './actions';

/**
 * GRANTING IS BY ACCOUNT, SO THE SITTING IS THE ACCOUNT'S. It used to default
 * to the first open sitting, which is the right answer only by coincidence:
 * granting a January candidate access to May/June gives them access that ends
 * in a month they are not sitting, and nothing said so. The address decides it
 * now, and until an address matches an account there is nothing to preselect —
 * so nothing is, and the form will not submit.
 */
export function GrantForm({ row }: { row?: { id: string; email: string; sitting: string } }) {
  const [registered, setRegistered] = useState<string | null>(row?.sitting ?? null);
  const [sitting, setSitting] = useState(row?.sitting ?? '');
  const [looking, startLookup] = useTransition();

  const look = (email: string) => {
    const address = email.trim().toLowerCase();
    if (!address) {
      setRegistered(null);
      setSitting('');
      return;
    }
    startLookup(async () => {
      const found = await sittingFor(address);
      setRegistered(found);
      // The operator's own choice is never overwritten; an empty select is not
      // a choice, and neither is one still showing the last address's sitting.
      setSitting((chosen) => (chosen === '' || chosen === registered ? (found ?? '') : chosen));
    });
  };

  // A sitting that is not the account's is almost always a slip, and it is
  // invisible afterwards: the grant simply ends at the wrong time. So it is
  // said out loud, with both sittings named.
  const confirmMismatch = (e: React.FormEvent<HTMLFormElement>) => {
    if (!registered || sitting === registered || !sitting) return;
    const ok = window.confirm(
      `This account is registered for ${label(registered)}, but you are granting access to ${label(sitting)}.\n\n` +
        `Access will end after ${label(sitting)}. Grant it anyway?`,
    );
    if (!ok) e.preventDefault();
  };

  return (
    <form action={grantAccess} onSubmit={confirmMismatch} className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {row ? (
        <input type="hidden" name="id" value={row.id} />
      ) : (
        <input
          name="email"
          type="email"
          required
          placeholder="the account's email"
          onBlur={(e) => look(e.target.value)}
          className={`${FIELD} w-full min-w-0 sm:w-auto sm:flex-1`}
        />
      )}
      <select
        name="sitting"
        required
        value={sitting}
        onChange={(e) => setSitting(e.target.value)}
        className={`${SELECT} w-full sm:w-auto`}
      >
        <option value="" disabled>
          {looking ? 'looking up the account…' : registered ? 'which sitting' : 'sitting — type the address first'}
        </option>
        {SITTING_IDS.map((s) => (
          <option key={s} value={s}>
            {SITTINGS[s].label}
            {s === registered ? ' · registered' : ''}
          </option>
        ))}
      </select>
      <select name="class" defaultValue="comp" className={`${SELECT} w-full sm:w-auto`}>
        <option value="sale">Sale</option>
        <option value="comp">Comp</option>
      </select>
      <input name="reason" required minLength={3} placeholder="why, or the Stripe event id" className={`${FIELD} w-full min-w-0 sm:w-auto sm:flex-1`} />
      <button className={`${INK} w-full text-sm sm:w-auto`}>Grant access</button>
    </form>
  );
}

const label = (sitting: string) => SITTINGS[sitting as keyof typeof SITTINGS]?.label ?? sitting;
