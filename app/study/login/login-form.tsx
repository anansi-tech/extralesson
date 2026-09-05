'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { register, requestReset, signIn, type AuthState } from './actions';
import { PASSWORD_MIN } from '@/lib/auth/password-policy';

// 16px, not 14: iOS Safari zooms the page on focusing any field whose computed
// font-size is under 16px, and the zoom does not come back on blur. That is the
// whole cause — nothing about the viewport meta or the layout.
const field = 'mt-1 w-full border-[1.5px] border-ink bg-white p-3 text-base';

export default function LoginForm() {
  // One form, three actions. Which one runs is decided by what the student is
  // doing, not by three separate pages they have to find their way between.
  const [mode, setMode] = useState<'signin' | 'reset'>('signin');
  // Chosen by the student, never inferred from a failed sign-in (ROUND_6 Task 3).
  const [creating, setCreating] = useState(false);
  // HELD ON THE CLIENT, not returned in AuthState: React 19 resets an
  // uncontrolled form once a form action has run — exactly when signIn answers
  // needsProfile and this form becomes a registration, which had the student
  // typing the password a second time on a phone.
  const [password, setPassword] = useState('');
  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signIn, {});
  const [registerState, registerAction, registering] = useActionState<AuthState, FormData>(register, {});
  const [resetState, resetAction, resetting] = useActionState<AuthState, FormData>(requestReset, {});

  if (resetState.resetRequested) {
    return (
      <p className="mt-6 border-l-3 border-green-pen bg-white p-4 text-sm">
        If there is an account for that email, a link to set a new password is on its way. It works
        once and expires in 30 minutes.
      </p>
    );
  }

  if (mode === 'reset') {
    return (
      <form action={resetAction} className="mt-6 space-y-4">
        <label className="block">
          <span className="font-mono text-xs uppercase tracking-widest text-dim">Email</span>
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        {resetState.error && <p className="text-sm text-red-pen">{resetState.error}</p>}
        <button
          type="submit"
          disabled={resetting}
          className="w-full bg-red-pen p-4 font-black text-white shadow-[4px_4px_0_var(--ink)] disabled:opacity-60"
        >
          {resetting ? 'Sending…' : 'Send me a link'}
        </button>
        <button type="button" onClick={() => setMode('signin')} className="w-full text-sm underline">
          Back to sign in
        </button>
      </form>
    );
  }

  const needsProfile = creating || registerState.needsProfile;
  const state = needsProfile ? registerState : signInState;
  const pending = needsProfile ? registering : signingIn;

  return (
    <form action={needsProfile ? registerAction : signInAction} className="mt-6 space-y-4">
      <label className="block">
        <span className="font-mono text-xs uppercase tracking-widest text-dim">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.email ?? signInState.email}
          className={field}
        />
      </label>

      <label className="block">
        <span className="font-mono text-xs uppercase tracking-widest text-dim">Password</span>
        <input
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={needsProfile ? PASSWORD_MIN : undefined}
          autoComplete={needsProfile ? 'new-password' : 'current-password'}
          className={field}
        />
        {needsProfile && (
          <span className="mt-1 block text-[11px] text-dim">
            At least {PASSWORD_MIN} characters. Length is what makes a password hard to guess — a
            short phrase you will remember beats a short word with symbols in it.
          </span>
        )}
      </label>

      {needsProfile && (
        <fieldset className="space-y-4 border-[1.5px] border-dashed border-ink p-4">
          <legend className="px-1 font-mono text-xs uppercase tracking-widest text-dim">
            Your account
          </legend>
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-widest text-dim">Name</span>
            <input name="name" required className={field} />
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-widest text-dim">
              Island (optional)
            </span>
            <input name="island" className={field} />
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-widest text-dim">Exam sitting</span>
            <select name="exam_sitting" required className={field} defaultValue="may-june-2027">
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
        {pending ? 'One moment…' : needsProfile ? 'Create account' : 'Sign in'}
      </button>

      {!needsProfile && (
        <>
          <button type="button" onClick={() => setCreating(true)} className="w-full text-sm underline">
            New here? Create an account
          </button>
          <button type="button" onClick={() => setMode('reset')} className="w-full text-sm underline">
            Forgot your password?
          </button>
        </>
      )}
      {creating && (
        <button type="button" onClick={() => setCreating(false)} className="w-full text-sm underline">
          I already have an account
        </button>
      )}

      {/* Shown where an account is actually being made, rather than on every
          sign-in. Photographs of a student's handwriting are held for seven
          days and the privacy page says so; this is the moment to read it. */}
      {needsProfile && (
        <p className="text-center text-[12px] leading-snug text-dim">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="underline">
            terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline">
            privacy page
          </Link>
          .
        </p>
      )}
    </form>
  );
}
