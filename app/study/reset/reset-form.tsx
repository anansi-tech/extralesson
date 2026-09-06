'use client';

import { useActionState } from 'react';
import { setPassword, type ResetState } from './actions';
import { PASSWORD_MIN } from '@/lib/auth/password-policy';

export default function ResetForm({ token, initial = {} }: { token: string; initial?: ResetState }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(setPassword, initial);

  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="block font-mono text-[11px] font-bold uppercase tracking-[0.14em]">New password</span>
        {state.error && <p className="mt-2 border-l-3 border-red-pen bg-[#FDF1F0] px-2.5 py-2 text-[13px] leading-snug">{state.error}</p>}
        <input
          name="password"
          type="password"
          required
          minLength={PASSWORD_MIN}
          autoComplete="new-password"
          className="mt-2 min-h-11 w-full border-[1.5px] border-ink bg-white p-2.5 font-mono text-base"
        />
        <span className="mt-1.5 block text-[11px] leading-snug text-dim">At least {PASSWORD_MIN} characters.</span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-4 min-h-11 w-full bg-red-pen p-4 text-[17px] font-black text-white shadow-[var(--shadow-card)] disabled:opacity-50 lg:mt-5 lg:w-auto lg:px-8"
      >
        {pending ? 'Saving…' : 'Save and sign in'}
      </button>
    </form>
  );
}
