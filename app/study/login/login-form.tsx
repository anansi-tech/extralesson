'use client';

import { useActionState } from 'react';
import { requestMagicLink, type RequestLinkState } from './actions';

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<RequestLinkState, FormData>(
    requestMagicLink,
    {},
  );

  if (state.ok) {
    return (
      <p className="mt-6 border-l-3 border-green-pen bg-white p-4">
        Check your email for the sign-in link. It works once and expires in 15 minutes.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block">
        <span className="font-mono text-xs uppercase tracking-widest text-dim">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full border-[1.5px] border-ink bg-white p-3 font-mono text-sm"
        />
      </label>

      {state.needsProfile && (
        <fieldset className="space-y-4 border-[1.5px] border-dashed border-ink p-4">
          <legend className="px-1 font-mono text-xs uppercase tracking-widest text-dim">
            New student — tell us about you
          </legend>
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-widest text-dim">Name</span>
            <input
              name="name"
              required
              className="mt-1 w-full border-[1.5px] border-ink bg-white p-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-widest text-dim">
              Island (optional)
            </span>
            <input
              name="island"
              className="mt-1 w-full border-[1.5px] border-ink bg-white p-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-widest text-dim">
              Exam sitting
            </span>
            <select
              name="exam_sitting"
              required
              className="mt-1 w-full border-[1.5px] border-ink bg-white p-3 text-sm"
              defaultValue="may-june-2027"
            >
              <option value="jan-2027">January 2027 re-sit</option>
              <option value="may-june-2027">May/June 2027</option>
            </select>
          </label>
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-dim">
              Target modules (May/June only — Jan re-sit covers all three)
            </span>
            <div className="mt-1 flex gap-4">
              {[1, 2, 3].map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="target_modules" value={m} defaultChecked />
                  M{m}
                </label>
              ))}
            </div>
          </div>
        </fieldset>
      )}

      {state.error && <p className="text-sm text-red-pen">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-red-pen p-4 font-black text-white shadow-[4px_4px_0_var(--ink)] disabled:opacity-60"
      >
        {pending ? 'Sending…' : state.needsProfile ? 'Create account & send link' : 'Send magic link'}
      </button>
    </form>
  );
}
