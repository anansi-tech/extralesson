'use client';

import { useActionState } from 'react';
import { setPassword, type ResetState } from './actions';
import { PASSWORD_MIN } from '@/lib/auth/password-policy';

export default function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(setPassword, {});

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="font-mono text-xs uppercase tracking-widest text-dim">New password</span>
        <input
          name="password"
          type="password"
          required
          minLength={PASSWORD_MIN}
          autoComplete="new-password"
          className="mt-1 w-full border-[1.5px] border-ink bg-white p-3 text-sm"
        />
        <span className="mt-1 block text-[11px] text-dim">At least {PASSWORD_MIN} characters.</span>
      </label>
      {state.error && <p className="text-sm text-red-pen">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-red-pen p-4 font-black text-white shadow-[4px_4px_0_var(--ink)] disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save and sign in'}
      </button>
    </form>
  );
}
