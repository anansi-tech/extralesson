'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { register, requestReset, signIn, type AuthState } from './actions';
import { PASSWORD_MIN } from '@/lib/auth/password-policy';
import { LIMITS, TOO_MANY } from '@/lib/auth/rate-limit';

export type Door = 'signin' | 'create' | 'reset';

// 16px, not 14: iOS Safari zooms the page on focusing any field whose computed
// font-size is under 16px, and the zoom does not come back on blur.
const LABEL = 'block font-mono text-[11px] font-bold uppercase tracking-[0.14em]';
const FIELD = 'mt-2 min-h-11 w-full border-[1.5px] border-ink bg-white p-2.5 font-mono text-base text-ink read-only:bg-paper-deep';
const ERROR = 'mt-2 border-l-3 border-red-pen bg-[#FDF1F0] px-2.5 py-2 text-[13px] leading-snug';
const PRIMARY = 'mt-4 min-h-11 w-full bg-red-pen p-4 text-[17px] font-black text-white shadow-[var(--shadow-card)] disabled:opacity-50 lg:mt-5 lg:w-auto lg:px-8';
const QUIET = 'inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-[0.14em] underline underline-offset-[3px]';

const minutes = (n: number) => `${n} minute${n === 1 ? '' : 's'}`;

/**
 * THREE DOORS, ONE FORM: sign in, create an account, ask for a reset link.
 * The page decides which door is open; nothing here infers it from a failed
 * sign-in. Errors sit above the field they concern.
 */
export default function LoginForm({
  door,
  lockedEmail,
  sender,
  resetMinutes,
  initial = {},
}: {
  door: Door;
  /** The address a payment is waiting on: pre-filled and not editable. */
  lockedEmail?: string;
  /** Named on the reset-sent screen, so the student knows what to look for. */
  sender?: string;
  /** How long a reset link lives, from the token's own lifetime. */
  resetMinutes?: number;
  /** The state to open in, so a page (or a test) can show an error or a sent reset. */
  initial?: AuthState;
}) {
  // Held on the client: React 19 resets an uncontrolled form once a form
  // action has run, which had the student typing the password twice on a phone.
  const [password, setPassword] = useState('');
  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signIn, initial);
  const [registerState, registerAction, registering] = useActionState<AuthState, FormData>(register, initial);
  const [resetState, resetAction, resetting] = useActionState<AuthState, FormData>(requestReset, initial);

  const state = door === 'create' ? registerState : door === 'reset' ? resetState : signInState;
  const pending = door === 'create' ? registering : door === 'reset' ? resetting : signingIn;
  const limitedNow = state.error === TOO_MANY;
  // The real window: one more call is allowed when the bucket has refilled by one.
  const wait = Math.ceil(1 / LIMITS[door === 'reset' ? 'reset-request' : 'login'].refillPerSecond / 60);

  if (door === 'reset' && resetState.resetRequested) {
    return (
      <>
        {/* The reset door carries its own heading, because this screen replaces it. */}
        <div className="font-hand text-[32px] leading-none text-green-pen">✓</div>
        <h1 className="mb-1.5 mt-2 text-2xl font-black tracking-[-0.015em]">
          Check your email<span className="text-red-pen">.</span>
        </h1>
        <p className="mb-5 text-[15px] leading-normal">
          If there is an account for that email, a link to set a new password is on its way. It works
          once and expires in {resetMinutes} minutes.
        </p>
        <p className="border-l-3 border-margin bg-[#FFFDF6] px-3 py-2 text-[13px] leading-snug text-dim">
          Nothing in your inbox after a minute or two? Look in spam. The sender is {sender}.
        </p>
        <div className="mt-5 border-t border-paper-deep pt-3">
          <Link href="/study/login" className={QUIET}>Back to sign in</Link>
        </div>
      </>
    );
  }

  return (
    <form action={door === 'create' ? registerAction : door === 'reset' ? resetAction : signInAction}>
      {door === 'reset' && (
        <h1 className="mb-5 text-2xl font-black tracking-[-0.015em] lg:text-[34px] lg:leading-[1.04] lg:tracking-[-0.02em]">
          Forgot your password<span className="text-red-pen">?</span>
        </h1>
      )}
      {limitedNow && (
        <p className="mb-4 border-l-3 border-amber bg-[#FDF8EC] px-3 py-2.5 text-[13px] leading-snug">
          Too many attempts. You can ask again in {minutes(wait)}.
        </p>
      )}

      <label className="block">
        <span className={LABEL}>Your email address</span>
        {state.error && !limitedNow && <p className={ERROR}>{state.error}</p>}
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={lockedEmail ?? state.email}
          readOnly={!!lockedEmail}
          className={FIELD}
        />
      </label>

      {door !== 'reset' && (
        <label className="mt-[18px] block">
          <span className={LABEL}>{door === 'create' ? 'Choose a password' : 'Your password'}</span>
          <input
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={door === 'create' ? PASSWORD_MIN : undefined}
            autoComplete={door === 'create' ? 'new-password' : 'current-password'}
            className={FIELD}
          />
          {door === 'create' && (
            <span className="mt-1.5 block text-[11px] leading-snug text-dim">
              At least {PASSWORD_MIN} characters. Length is what makes a password hard to guess — a
              short phrase you will remember beats a short word with symbols in it.
            </span>
          )}
        </label>
      )}

      {door === 'create' && (
        <>
          <label className="mt-[18px] block">
            <span className={LABEL}>Your name</span>
            <input name="name" required autoComplete="name" className={FIELD} />
          </label>
          <label className="mt-[18px] block">
            <span className={LABEL}>Which sitting are you entered for</span>
            <select name="exam_sitting" required className={`${FIELD} bg-paper font-sans`} defaultValue="may-june-2027">
              <option value="may-june-2027">May/June 2027</option>
              <option value="jan-2027">January 2027 re-sit</option>
            </select>
          </label>
        </>
      )}

      <button type="submit" disabled={pending || limitedNow} className={PRIMARY}>
        {pending ? 'One moment…' : door === 'create' ? 'Create account' : door === 'reset' ? 'Send me a link' : 'Sign in'}
        {limitedNow && (
          <small className="mt-1 block font-mono text-[10px] font-medium uppercase tracking-[0.1em]">Available in {minutes(wait)}</small>
        )}
      </button>

      {/* The other door, always in view: explicit routes, one page. */}
      <div className="mt-5 flex flex-wrap gap-x-5 border-t border-paper-deep pt-3 lg:mt-6">
        {door === 'create' ? (
          <Link href="/study/login" className={QUIET}>
            I already have an account — sign in
          </Link>
        ) : door === 'reset' ? (
          <Link href="/study/login" className={QUIET}>Back to sign in</Link>
        ) : (
          <>
            <Link href="/study/login?new=1" className={QUIET}>
              New here? Create an account
            </Link>
            <Link href="/study/login?reset=1" className={QUIET}>Forgot your password?</Link>
          </>
        )}
      </div>

      {/* Shown where an account is actually being made, rather than on every
          sign-in. Photographs of a student's handwriting are held for seven
          days and the privacy page says so; this is the moment to read it. */}
      {door === 'create' && (
        <p className="mt-4 text-xs leading-snug text-dim">
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
